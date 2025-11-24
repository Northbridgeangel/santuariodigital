//vr-controls.js
AFRAME.registerComponent("test-joystick", {
  schema: {
    logThreshold: { type: "number", default: 0.01 }, // valor mínimo para mostrar movimiento
  },

  init: function () {
    console.log("🎮 Componente Test Joystick Inicializando");
    this.gamepads = { left: null, right: null };
  },

  tick: function () {
    const gps = navigator.getGamepads ? navigator.getGamepads() : [];

    let leftFound = false;
    let rightFound = false;

    for (let i = 0; i < gps.length; i++) {
      const gp = gps[i];
      if (!gp) continue;

      // Identificar el mando
      const id = gp.id.toLowerCase();
      let hand = "unknown";
      if (id.includes("left")) hand = "left";
      if (id.includes("right")) hand = "right";

      if (hand === "left") {
        this.gamepads.left = gp;
        leftFound = true;
      }
      if (hand === "right") {
        this.gamepads.right = gp;
        rightFound = true;
      }

      // Leer axes (0/1 o 2/3 según dispositivo)
      const x = gp.axes[2] !== undefined ? gp.axes[2] : gp.axes[0];
      const y = gp.axes[3] !== undefined ? gp.axes[3] : gp.axes[1];

      // Mostrar joystick aunque no se mueva
      if (
        Math.abs(x) > this.data.logThreshold ||
        Math.abs(y) > this.data.logThreshold
      ) {
        console.log(
          `🕹 [${hand}] Joystick X=${x.toFixed(2)}, Y=${y.toFixed(2)}`
        );
      } else {
        console.log(
          `🕹 [${hand}] Joystick X=${x.toFixed(2)}, Y=${y.toFixed(
            2
          )} (sin movimiento)`
        );
      }

      // Botones
      gp.buttons.forEach((b, idx) => {
        if (b.pressed) console.log(`✅ [${hand}] Botón ${idx} pulsado`);
      });
    }

    if (!leftFound) console.log("❌ Gamepad izquierdo no detectado");
    if (!rightFound) console.log("❌ Gamepad derecho no detectado");
  },
});