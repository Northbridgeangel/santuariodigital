//vr-controls.js
AFRAME.registerComponent("test-joystick", {
  init: function () {
    console.log("🔹 Componente Test Joystick inicializado");

    this.controllers = { left: null, right: null };
    this.lastAxes = { left: [0, 0], right: [0, 0] };

    // Controladores conectados
    this.el.sceneEl.addEventListener("controllerconnected", (evt) => {
      const hand = evt.detail.hand || "unknown";
      console.log(`🎮 Controlador conectado: ${hand}`);
      if (hand === "left") this.controllers.left = evt.detail.target;
      if (hand === "right") this.controllers.right = evt.detail.target;

      // Empezar a escuchar joystick del gamepad de este controlador
      this.listenGamepad(hand);
    });
  },

  listenGamepad: function (hand) {
    const controller = this.controllers[hand];
    if (!controller) return;

    const checkGamepad = () => {
      const gp = controller.components["laser-controls"]?.controller?.gamepad;
      if (gp) {
        // Chequear ejes (0,1 y 2,3)
        const x = gp.axes[0] || gp.axes[2] || 0;
        const y = gp.axes[1] || gp.axes[3] || 0;

        if (x !== this.lastAxes[hand][0] || y !== this.lastAxes[hand][1]) {
          console.log(
            `🕹 ${hand} joystick X=${x.toFixed(2)}, Y=${y.toFixed(2)}`
          );
          this.lastAxes[hand] = [x, y];
        }

        // Botones A,B,X,Y
        if (gp.buttons[0]?.pressed) console.log(`✅ ${hand} Botón A`);
        if (gp.buttons[1]?.pressed) console.log(`✅ ${hand} Botón B`);
        if (gp.buttons[2]?.pressed) console.log(`✅ ${hand} Botón X`);
        if (gp.buttons[3]?.pressed) console.log(`✅ ${hand} Botón Y`);
      }

      requestAnimationFrame(checkGamepad);
    };

    checkGamepad();
  },
});
