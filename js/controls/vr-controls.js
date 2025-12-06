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
        // Añadidos
        evt.added.forEach((source) => {
          const hand = source.handedness || "unknown";

          // 🎮 CONTROLLER
          if (source.gamepad) {
            this.data.pads[hand] = {
              type: "controller",
              source: source,
            };
            console.log(`🎮 Gamepad añadido: ${hand}`);
          }

          // 🖐 HAND TRACKING
          if (source.hand) {
            this.data.pads[hand] = {
              type: "hand",
              source: source,
              hand: source.hand,
            };
            console.log(`🖐 HAND añadido: ${hand} (tracking hand)`);
          }
        });

        // Eliminados
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

  tick: function (time, deltaTime, frame) {
    if (!this.xrSessionActive || !frame) return;

    const pads = this.data.pads;
    const renderer = this.el.sceneEl.renderer;
    if (!renderer || !renderer.xr || !renderer.xr.getReferenceSpace) return;
    const xrRefSpace = renderer.xr.getReferenceSpace();
    if (!xrRefSpace) return;

    for (const hand in pads) {
      const pad = pads[hand];

      // 1️⃣ Controller: botones y joystick
      if (pad.type === "controller") {
        const gp = pad.source.gamepad;
        if (gp) {
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
        }
      }

      // 2️⃣ Hand tracking + grip distance
      let handPose = null;
      let gripPose = null;

      if (pad.type === "hand") {
        handPose = pad.hand.get?.("index-finger-tip") || null;
      }

      if (pad.type === "controller" && pad.source.gripSpace) {
        gripPose = frame.getPose(pad.source.gripSpace, xrRefSpace);
      }

      if (handPose && gripPose) {
        const distanceZ = Math.abs(
          gripPose.transform.position.z - handPose.transform.position.z
        );

        if (distanceZ < 0.05) {
          console.log(
            `✊ ${hand}: grip cercano (${(distanceZ * 100).toFixed(
              1
            )} cm) → usando controller`
          );
        } else {
          console.log(
            `✋ ${hand}: grip lejano (${(distanceZ * 100).toFixed(
              1
            )} cm) → usando mano`
          );
        }
      } else if (handPose) {
        console.log(`🖐 ${hand}: solo hand tracking`);
      } else if (gripPose) {
        console.log(`🎮 ${hand}: solo controller grip`);
      }
    }
  },
});
