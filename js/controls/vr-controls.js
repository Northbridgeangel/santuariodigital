//vr-controls.js
AFRAME.registerComponent("vr-controls", {
  schema: {
    speed: { type: "number", default: 0.05 }, // velocidad de movimiento
  },

  init: function () {
    console.log("🎮 VR Controls inicializado");

    this.rig = document.querySelector("#rig");
    this.camera = document.querySelector("#camera");

    // Escuchar cuando un controlador VR se conecta
    this.el.sceneEl.addEventListener("controllerconnected", (evt) => {
      const controller = evt.detail.target; // el <a-entity> del controlador
      const hand = controller.getAttribute("laser-controls")?.hand || "unknown";

      console.log(`🕹️ Controlador conectado: ${hand}`, controller);

      // =============================
      // CLICK (Trigger)
      // =============================
      controller.addEventListener("triggerdown", () => {
        console.log(`🔵 Trigger pulsado (${hand})`);
        this.camera.dispatchEvent(new Event("click"));
      });

      // =============================
      // MOVIMIENTO con thumbstick
      // =============================
      controller.addEventListener("axismove", (e) => {
        // Solo si es el joystick derecho o izquierdo según quieras
        const x = e.detail.axes[0]; // horizontal
        const y = e.detail.axes[1]; // vertical

        // Deadzone para evitar micro-movimientos
        if (Math.abs(x) < 0.1 && Math.abs(y) < 0.1) return;

        // Dirección de la cámara
        const dir = new THREE.Vector3();
        this.camera.object3D.getWorldDirection(dir);
        dir.y = 0;
        dir.normalize();

        const rightVec = new THREE.Vector3();
        rightVec.crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();

        const move = new THREE.Vector3();
        move.add(dir.multiplyScalar(-y * this.data.speed));
        move.add(rightVec.multiplyScalar(x * this.data.speed));

        this.rig.object3D.position.add(move);
      });
    });
  },
});
