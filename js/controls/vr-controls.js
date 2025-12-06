// vr-controls.js -> sistema PAD / controlador mixto
AFRAME.registerComponent("test-joystick", {
  schema: {
    pads: { default: {} }, // left, right, unknown
  },

  init: function () {
    console.log("🟢 Componente Test Joystick Quest inicializado");

    this.xrSessionActive = false;
    this.xrReferenceSpace = null;

    this.el.sceneEl.addEventListener("enter-vr", () => {
      const session = this.el.sceneEl.xrSession;
      if (!session) return;

      this.xrSessionActive = true;

      // Necesario para calcular posiciones de grip y hand
      session.requestReferenceSpace("local").then((refSpace) => {
        this.xrReferenceSpace = refSpace;
      });

      console.log("🟢 Session WebXR activa");

      session.addEventListener("inputsourceschange", (evt) => {
        /* ────────────────────────────────────────────────
         *   AÑADIDOS
         * ──────────────────────────────────────────────── */
        evt.added.forEach((source) => {
          const hand = source.handedness || "unknown";

          /* 🎮 CONTROLLER (gamepad) */
          if (source.gamepad) {
            this.data.pads[hand] = {
              type: "controller",
              source: source,
              axes: source.gamepad.axes,
              buttons: source.gamepad.buttons,
            };
            console.log(`🎮 Gamepad añadido: ${hand}`);
          }

          /* 🖐 HAND TRACKING (manos reales) */
          if (source.hand) {
            this.data.pads[hand] = {
              type: "hand",
              source: source,
              hand: source.hand,
            };
            console.log(`🖐 HAND añadido: ${hand} (tracking hand)`);
          }
        });

        /* ────────────────────────────────────────────────
         *   ELIMINADOS
         * ──────────────────────────────────────────────── */
        evt.removed.forEach((source) => {
          const hand = source.handedness || "unknown";
          if (this.data.pads[hand]) {
            console.log(
              `❌ InputSource eliminado (${this.data.pads[hand].type}): ${hand}`
            );
            delete this.data.pads[hand];
          }
        });
      });
    });

    this.el.sceneEl.addEventListener("exit-vr", () => {
      this.xrSessionActive = false;
      this.data.pads = {};
      this.xrReferenceSpace = null;
      console.log("🔴 Saliendo de VR");
    });
  },

  tick: function (time, deltaTime) {
    if (!this.xrSessionActive || !this.xrReferenceSpace) return;

    const pads = this.data.pads;
    const frame = this.el.sceneEl.xrFrame;

    for (const hand in pads) {
      const pad = pads[hand];

      /* ────────────────────────────────────────────────
       *    1. CONTROLLER (gamepad)
       * ──────────────────────────────────────────────── */
      if (pad.type === "controller") {
        const gp = pad.source.gamepad;

        // Botones
        gp.buttons.forEach((btn, i) => {
          if (btn.pressed) {
            console.log(`🎯 Botón XR ${hand} #${i} pulsado`);
          }
        });

        // Joystick
        if (gp.axes.length >= 2) {
          const x = gp.axes[0] || gp.axes[2] || 0;
          const y = gp.axes[1] || gp.axes[3] || 0;
          if (Math.abs(x) > 0.01 || Math.abs(y) > 0.01) {
            console.log(
              `🕹 Joystick XR [${hand}] X=${x.toFixed(2)}, Y=${y.toFixed(2)}`
            );
          }
        }

        // ────────────────────────────────────────────────
        // Detector de proximidad grip → hand (wrist, según la distancia de la muñeca)
        if (
          pad.source.gripSpace &&
          pads[hand.replace("left", "right") || hand]
        ) {
          const gripPose = frame.getPose(
            pad.source.gripSpace,
            this.xrReferenceSpace
          );
          const handPad = pads[hand];
          if (handPad && handPad.type === "hand") {
            const handObj = handPad.hand;
            const wrist = handObj.get("wrist");
            if (gripPose && wrist) {
              const dx = gripPose.transform.position.x - wrist.x;
              const dy = gripPose.transform.position.y - wrist.y;
              const dz = gripPose.transform.position.z - wrist.z;
              const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
              if (distance < 0.05) {
                console.log(`${hand} → usando controller`);
              } else {
                console.log(`${hand} → usando hand tracking`);
              }
            }
          }
        }
      }

      /* ────────────────────────────────────────────────
       *    2. HAND TRACKING (joints)
       * ──────────────────────────────────────────────── */
      if (pad.type === "hand") {
        const handObj = pad.hand;
        const indexTip = handObj.get?.("index-finger-tip");
        if (indexTip) {
          console.log(`👉 Mano ${hand}: índice tracking OK`);
        }
      }
    }
  },
});
