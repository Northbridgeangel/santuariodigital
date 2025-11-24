//vr-controls.js
AFRAME.registerComponent("test-joystick", {
  init: function () {
    console.log("🟢 Componente Test Joystick inicializado");

    // Variables para almacenar gamepads
    this.rightGP = null;
    this.leftGP = null;
  },
  tick: function () {
    const gps = navigator.getGamepads();
    if (!gps) return;

    // Solo log una vez si no había detectado
    gps.forEach((gp) => {
      if (gp && !gp.logged) {
        console.log("🎮 Gamepad detectado:", gp.id, "Index:", gp.index);
        gp.logged = true; // evitar logs infinitos
      }
    });
  },
});
