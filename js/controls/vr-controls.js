// vr-controls.js
AFRAME.registerComponent("test-joystick", {
  init: function () {
    console.log("🟢 Componente Test Joystick Quest inicializado");

    this.gamepads = {}; // para no loguear lo mismo varias veces
    this.xrSessionActive = false;

    // Detectar cuando la sesión XR entra
    this.el.sceneEl.addEventListener("enter-vr", async () => {
      const session = this.el.sceneEl.xrSession;
      if (session) {
        this.xrSessionActive = true;
        console.log("🟢 Session WebXR activa");

        // Escuchar cambios en los inputs (controladores)
        session.addEventListener("inputsourceschange", (evt) => {
          // Controladores añadidos
          evt.added.forEach((input) => {
            if (input.gamepad) {
              const id =
                input.handedness && input.handedness.length
                  ? input.handedness
                  : "unknown";

              if (!this.gamepads[id]) {
                this.gamepads[id] = input.gamepad;
                console.log(`🎮 Gamepad añadido: ${id}`);
              }
            }
          });

          // Controladores eliminados
          evt.removed.forEach((input) => {
            if (input.gamepad) {
              const id =
                input.handedness && input.handedness.length
                  ? input.handedness
                  : "unknown";

              if (this.gamepads[id]) {
                console.log(`❌ Gamepad eliminado: ${id}`);
                delete this.gamepads[id];
              }
            }
          });
        });
      }
    });

    this.el.sceneEl.addEventListener("exit-vr", () => {
      this.xrSessionActive = false;
      console.log("🔴 Saliendo de VR");
      this.gamepads = {};
    });
  },

  tick: function () {
    if (!this.xrSessionActive) return;

    const gps = navigator.getGamepads ? navigator.getGamepads() : [];
    for (let gp of gps) {
      if (!gp) continue;

      // Solo loguear si ya no lo hemos hecho
      if (!gp.logged) {
        console.log(
          `🎮 Gamepad detectado en tick: ${gp.id || "sin-id"}, index: ${
            gp.index
          }`
        );
        gp.logged = true;
      }

      // Joystick X/Y
      const x = gp.axes[0] || gp.axes[2] || 0;
      const y = gp.axes[1] || gp.axes[3] || 0;

      if (Math.abs(x) > 0.01 || Math.abs(y) > 0.01) {
        console.log(`🕹 Joystick: X=${x.toFixed(2)}, Y=${y.toFixed(2)}`);
      }

      // Botones 0-3
      gp.buttons.forEach((b, i) => {
        if (b.pressed) console.log(`✅ Botón ${i} pulsado`);
      });
    }
  },
});
