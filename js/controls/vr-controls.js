// vr-controls.js
AFRAME.registerComponent("test-joystick", {
  init: function () {
    console.log("🟢 Componente Test Joystick Quest inicializado");
    this.gamepadsReady = false;   // indica si ya se detectó sesión y gamepads
  },

  tick: function () {
    // Si la sesión aún no está activa, solo comprobamos una vez
    if (!this.gamepadsReady) {
      if (!this.el.sceneEl.xrSession) return; // no hacemos nada hasta que esté activa
      console.log("🟢 Sesión WebXR activa");
      this.gamepadsReady = true; // a partir de ahora ya comprobamos gamepads
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
