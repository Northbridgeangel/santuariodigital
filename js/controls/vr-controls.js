//vr-controls.js
AFRAME.registerComponent("test-joystick", {
  schema: {
    logThreshold: { type: "number", default: 0.01 },
  },

  init: function () {
    this.rightGamepad = null;
    this.gamepadConnected = false;
    console.log("🔹 Componente test-joystick inicializado");
  },

  tick: function () {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    this.rightGamepad = null;

    for (let gp of gamepads) {
      if (!gp) continue;
      if (
        gp.id.toLowerCase().includes("right") ||
        gp.id.toLowerCase().includes("oculus touch")
      ) {
        this.rightGamepad = gp;
        break;
      }
    }

    // Detectar conexión/desconexión
    if (this.rightGamepad && !this.gamepadConnected) {
      this.gamepadConnected = true;
      console.log("🎮 Gamepad derecho conectado:", this.rightGamepad.id);
    } else if (!this.rightGamepad && this.gamepadConnected) {
      this.gamepadConnected = false;
      console.log("❌ Gamepad derecho desconectado");
    }

    if (!this.rightGamepad) return;

    // Detectar ejes adaptativos: 2/3 o 0/1
    let x = 0,
      y = 0;
    if (this.rightGamepad.axes.length >= 4) {
      x = this.rightGamepad.axes[2] || 0;
      y = this.rightGamepad.axes[3] || 0;
    } else if (this.rightGamepad.axes.length >= 2) {
      x = this.rightGamepad.axes[0] || 0;
      y = this.rightGamepad.axes[1] || 0;
    }

    console.log(`🕹 Joystick Right - X: ${x.toFixed(2)}, Y: ${y.toFixed(2)}`);

    if (
      Math.abs(x) > this.data.logThreshold ||
      Math.abs(y) > this.data.logThreshold
    ) {
      console.log("➡️ Movimiento detectado:", { x, y });
    }
  },
});
