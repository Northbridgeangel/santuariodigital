//vr-controls.js
AFRAME.registerComponent("test-joystick", {
  init: function () {
    this.gamepadIndex = null;
    console.log("🟢 Componente test-joystick inicializado");
  },

  tick: function () {
    const gamepads = navigator.getGamepads();
    if (!gamepads) return;

    // Intentar encontrar nuestro gamepad si aún no lo tenemos
    if (this.gamepadIndex === null) {
      for (let i = 0; i < gamepads.length; i++) {
        if (gamepads[i]) {
          this.gamepadIndex = i;
          console.log("🎮 Gamepad conectado:", gamepads[i].id);
          break;
        }
      }
    }

    // Si no hay gamepad conectado, salir
    const gp = this.gamepadIndex !== null ? gamepads[this.gamepadIndex] : null;
    if (!gp) {
      console.log("⚠️ No hay gamepad conectado");
      return;
    }

    // Tomar ejes del joystick (derecho normalmente axes[2] y axes[3])
    let x = gp.axes[2] !== undefined ? gp.axes[2] : 0;
    let y = gp.axes[3] !== undefined ? gp.axes[3] : 0;

    // Mostrar siempre en consola aunque esté en 0
    console.log(`🕹 Joystick: X=${x.toFixed(2)}, Y=${y.toFixed(2)}`);

    // Mostrar botones A/B/X/Y (índices 0-3)
    if (gp.buttons[0]?.pressed) console.log("✅ Botón A pulsado");
    if (gp.buttons[1]?.pressed) console.log("✅ Botón B pulsado");
    if (gp.buttons[2]?.pressed) console.log("✅ Botón X pulsado");
    if (gp.buttons[3]?.pressed) console.log("✅ Botón Y pulsado");
  },
});
