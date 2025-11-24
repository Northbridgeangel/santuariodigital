//vr-controls.js
AFRAME.registerComponent("test-joystick-quest", {
  init: function () {
    console.log("🟢 Componente Test Joystick Quest inicializado");

    this.gamepads = [];
    this.pollGamepads = this.pollGamepads.bind(this);

    // Start polling
    requestAnimationFrame(this.pollGamepads);
  },

  pollGamepads: function () {
    const gps = navigator.getGamepads ? navigator.getGamepads() : [];
    this.gamepads = [];

    for (let i = 0; i < gps.length; i++) {
      const gp = gps[i];
      if (!gp) continue;

      this.gamepads.push(gp);

      // Log gamepad detected
      console.log(`🎮 Gamepad conectado: ID=${gp.id}, Index=${gp.index}`);

      // Joystick principal (ejes 0,1 y también 2,3 si aplica)
      const axes = [
        gp.axes[0] || 0,
        gp.axes[1] || 0,
        gp.axes[2] || 0,
        gp.axes[3] || 0,
      ];

      console.log(
        `🕹 Joystick: X0=${axes[0].toFixed(2)}, Y0=${axes[1].toFixed(
          2
        )}, X1=${axes[2].toFixed(2)}, Y1=${axes[3].toFixed(2)}`
      );

      // Botones
      gp.buttons.forEach((b, index) => {
        if (b.pressed) console.log(`✅ Botón ${index} pulsado`);
      });
    }

    // Repetir cada frame
    requestAnimationFrame(this.pollGamepads);
  },
});
