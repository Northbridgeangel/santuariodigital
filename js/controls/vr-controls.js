// vr-controls.js -> sistema PAD / controlador mixto
AFRAME.registerComponent("test-joystick", {
  schema: {
    pads: { default: {} }, // left, right, unknown
  },

  init: function () {
    console.log("🟢 Componente Test Joystick Quest inicializado");

    this.xrSessionActive = false;

    this.el.sceneEl.addEventListener("enter-vr", () => {
      const session = this.el.sceneEl.xrSession;
      if (!session) return;

      this.xrSessionActive = true;
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
              isGripped: false, // ← estado del grip sensor
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
      console.log("🔴 Saliendo de VR");
    });
  },

  tick: function () {
    if (!this.xrSessionActive) return;

    const pads = this.data.pads;

    for (const hand in pads) {
      const pad = pads[hand];

      /* ────────────────────────────────────────────────
       *    1. CONTROLLER (gamepad)
       * ──────────────────────────────────────────────── */
      if (pad.type === "controller") {
        const gp = pad.source.gamepad;

        // 🔥 SENSOR DE GRIP REAL (analógico)
        const gripValue = gp.buttons[1]?.value ?? 0;
        pad.isGripped = gripValue > 0.15;

        // 🧠 Si NO lo estás agarrando → ignoramos el mando
        if (!pad.isGripped) {
          //console.log(`(🟡 ${hand}) mando suelto → ignorado`);
          continue;
        }

        // 🔘 Botones
        gp.buttons.forEach((btn, i) => {
          if (btn.pressed) {
            console.log(`🎯 Botón XR ${hand} #${i} pulsado`);
          }
        });

        // 🕹 Joystick
        if (gp.axes.length >= 2) {
          const x = gp.axes[0] || gp.axes[2] || 0;
          const y = gp.axes[1] || gp.axes[3] || 0;

          if (Math.abs(x) > 0.01 || Math.abs(y) > 0.01) {
            console.log(
              `🕹 Joystick XR [${hand}] X=${x.toFixed(2)}, Y=${y.toFixed(2)}`
            );
          }
        }
      }

      /* ────────────────────────────────────────────────
       *    2. HAND TRACKING (joints)
       * ──────────────────────────────────────────────── */
      if (pad.type === "hand") {
        const handObj = pad.hand;

        // Ejemplo: detectar si el índice está visible
        const indexTip = handObj.get?.("index-finger-tip");

        if (indexTip) {
          console.log(`👉 Mano ${hand}: índice tracking OK`);
        }
      }
    }
  },
});