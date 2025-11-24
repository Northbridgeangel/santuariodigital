//vr-controls.js
AFRAME.registerComponent("test-gamepad", {
  init: function () {
    console.log("Componente Test Gamepad inicializado");

    // Entrar en VR
    this.el.sceneEl.addEventListener("enter-vr", () => {
      console.log("🟢 Entrando en VR");

      // Revisar gamepads conectados
      const gamepads = navigator.getGamepads();
      for (let i = 0; i < gamepads.length; i++) {
        const gp = gamepads[i];
        if (gp) {
          console.log(`🎮 Gamepad conectado #${i}:`, gp.id);
        }
      }

      if (!gamepads.length || !gamepads.some((gp) => gp)) {
        console.log("⚠️ No hay gamepads detectados");
      }
    });

    this.el.sceneEl.addEventListener("exit-vr", () => {
      console.log("🔴 Saliendo de VR");
    });
  },
});
