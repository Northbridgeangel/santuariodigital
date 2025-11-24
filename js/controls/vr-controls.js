//vr-controls.js
AFRAME.registerComponent("test-joystick", {
  init: function () {
    console.log("🟢 Componente Test Joystick Quest inicializado");
    this.gamepadsReady = false;
  },

  tick: function () {
    const gps = navigator.getGamepads ? navigator.getGamepads() : [];
    if (!gps.length) return;

    // Buscar gamepads conectados
    for (let gp of gps) {
      if (!gp) continue;

      if (!gp.logged) {
        console.log(`🎮 Gamepad detectado: ${gp.id}, index: ${gp.index}`);
        gp.logged = true;
      }

      // Log de ejes X/Y
      const x = gp.axes[0] || gp.axes[2] || 0; // prueba ambos sets
      const y = gp.axes[1] || gp.axes[3] || 0;

      console.log(`🕹 Joystick: X=${x.toFixed(2)}, Y=${y.toFixed(2)}`);

      // Log de botones A/B/X/Y (0-3)
      gp.buttons.forEach((b, i) => {
        if (b.pressed) console.log(`✅ Botón ${i} pulsado`);
      });
    }
  },
});
