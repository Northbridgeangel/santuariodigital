//vr-controls.js
AFRAME.registerComponent("test-joystick", {
  schema: {},

  init: function () {
    console.log("🎮 Componente Test Joystick inicializado");
  },

  tick: function () {
    const gamepads = navigator.getGamepads();
    if (!gamepads) return;

    for (let i = 0; i < gamepads.length; i++) {
      const gp = gamepads[i];
      if (!gp) continue;

      console.log(`🟢 Gamepad conectado: index=${gp.index}, id=${gp.id}`);

      // Ejes del joystick derecho (pueden variar según dispositivo)
      const x = gp.axes[2] || 0;
      const y = gp.axes[3] || 0;

      // Mostrar solo si hay movimiento significativo
      if (Math.abs(x) > 0.05 || Math.abs(y) > 0.05) {
        console.log(`🕹 Joystick: X=${x.toFixed(2)}, Y=${y.toFixed(2)}`);
      }
    }
  },
});
