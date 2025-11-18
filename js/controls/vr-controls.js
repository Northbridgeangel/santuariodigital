//vr-controls.js
AFRAME.registerComponent("vr-controls", {
  schema: {
    speed: { type: "number", default: 0.05 },
  },

  init: function () {
    console.log("🎮 VR Controls inicializado");

    this.rig = document.querySelector("#rig");
    this.camera = document.querySelector("#camera");

    this.right = document.querySelector('[laser-controls][hand="right"]');
    this.left = document.querySelector('[laser-controls][hand="left"]');

    if (!this.right) {
      console.warn("⚠️ No se encontró controlador VR derecho");
      return;
    }

    // ================
    // CLICK (trigger)
    // ================
    this.right.addEventListener("triggerdown", () => {
      console.log("🔵 VR Trigger → CLICK");

      // Reutiliza tu raycaster/interaction system
      const clickEvt = new Event("click");
      this.camera.dispatchEvent(clickEvt);
    });

    // =====================================
    // MOVIMIENTO (Thumbstick / Joystick)
    // =====================================
    this.right.addEventListener("thumbstickmoved", (e) => {
      const x = e.detail.x;
      const y = e.detail.y;

      // muerto (deadzone)
      if (Math.abs(x) < 0.1 && Math.abs(y) < 0.1) return;

      const dir = new THREE.Vector3();
      this.camera.object3D.getWorldDirection(dir);
      dir.y = 0;
      dir.normalize();

      const right = new THREE.Vector3();
      right.crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();

      const move = new THREE.Vector3();

      move.add(dir.multiplyScalar(-y * this.data.speed)); // adelante/atrás
      move.add(right.multiplyScalar(x * this.data.speed)); // izquierda/derecha

      this.rig.object3D.position.add(move);
    });
  },
});
