// vr-controls.js
AFRAME.registerComponent("test-joystick", {
  init: function () {
    console.log("🟢 Componente Test Joystick Quest inicializado");
    this.gamepadsReady = false;
  },

  tick: function () {
    // Verificar que la sesión WebXR esté activa
    if (!this.el.sceneEl.xrSession) {
      console.log("⚠️ Sesión WebXR no activa todavía");
      return;
    }

    // Obtener gamepads
    const gps = navigator.getGamepads ? navigator.getGamepads() : [];
    if (!gps.length) return;

    for (let gp of gps) {
      if (!gp) continue;

      // Solo loguear la detección del gamepad una vez
      if (!gp.logged) {
        console.log(`🎮 Gamepad detectado: ${gp.id}, index: ${gp.index}`);
        gp.logged = true;
      }

      // Detectar ejes: soportando sets 0/1 y 2/3 según dispositivo
      const x = gp.axes[0] !== undefined ? gp.axes[0] : gp.axes[2] || 0;
      const y = gp.axes[1] !== undefined ? gp.axes[1] : gp.axes[3] || 0;

      // Solo loguear si hay movimiento relevante (>0.01)
      if (Math.abs(x) > 0.01 || Math.abs(y) > 0.01) {
        console.log(`🕹 Joystick: X=${x.toFixed(2)}, Y=${y.toFixed(2)}`);
      }

      // Log de botones A/B/X/Y (índices 0-3)
      gp.buttons.forEach((b, i) => {
        if (b.pressed) console.log(`✅ Botón ${i} pulsado`);
      });
    }
  },
});
