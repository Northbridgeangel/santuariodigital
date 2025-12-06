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

          // Si no existe, inicializamos
          if (!this.data.pads[hand]) {
            this.data.pads[hand] = { source: null, hand: null };
          }

          // 🎮 Controller
          if (source.gamepad) {
            this.data.pads[hand].source = source;
            console.log(`🎮 Gamepad añadido: ${hand}`);
          }

          // 🖐 Hand tracking
          if (source.hand) {
            this.data.pads[hand].hand = source.hand;
            console.log(`🖐 HAND añadido: ${hand} (tracking hand)`);
          }
        });

        // Eliminados
        evt.removed.forEach((source) => {
          const hand = source.handedness || "unknown";
          if (!this.data.pads[hand]) return;

          if (source.gamepad && this.data.pads[hand].source) {
            console.log(`❌ Gamepad eliminado: ${hand}`);
            this.data.pads[hand].source = null;
          }

          if (source.hand && this.data.pads[hand].hand) {
            console.log(`❌ Hand tracking eliminado: ${hand}`);
            this.data.pads[hand].hand = null;
          }

          // Si no queda nada, eliminamos el pad
          if (!this.data.pads[hand].source && !this.data.pads[hand].hand) {
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
      const gp = pad.source; // gamepad o null
      const handObj = pad.hand; // hand tracking o null

      // 🔘 Botones y joystick del controller
      if (gp) {
        gp.gamepad?.buttons?.forEach((btn, i) => {
          if (btn.pressed) console.log(`🎯 Botón XR ${hand} #${i} pulsado`);
        });

        const axes = gp.gamepad?.axes || [];
        if (axes.length >= 2) {
          const x = axes[0] || axes[2] || 0;
          const y = axes[1] || axes[3] || 0;
          if (Math.abs(x) > 0.01 || Math.abs(y) > 0.01)
            console.log(
              `🕹 Joystick XR [${hand}] X=${x.toFixed(2)}, Y=${y.toFixed(2)}`
            );
        }
      }

      // Hand tracking + grip distance
      let handPose = handObj?.get?.("index-finger-tip") || null;
      let gripPose = gp?.gripSpace
        ? frame.getPose(gp.gripSpace, xrRefSpace)
        : null;

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
