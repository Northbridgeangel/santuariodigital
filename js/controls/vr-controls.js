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
        // ➕ AÑADIDOS
        evt.added.forEach((source) => {
          if (!source.gamepad) return;

          const hand = source.handedness || "unknown";

          // Creamos la estructura SOLO UNA VEZ
          this.data.pads[hand] = {
            source: source,
            axes: source.gamepad.axes,
            buttons: source.gamepad.buttons,
          };

          console.log(`🎮 Gamepad añadido: ${hand}`);
        });

        // ➖ ELIMINADOS
        evt.removed.forEach((source) => {
          if (!source.gamepad) return;

          const hand = source.handedness || "unknown";

          if (this.data.pads[hand]) {
            console.log(`❌ Gamepad eliminado: ${hand}`);
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

    // Leemos SIN RECREAR NADA
    for (const hand in pads) {
      const pad = pads[hand];
      const gp = pad.source.gamepad;

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
  },
});
