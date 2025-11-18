//vr-controls.js
AFRAME.registerComponent("vr-controls", {
  schema: {
    speed: { type: "number", default: 0.05 }, // velocidad de movimiento
  },

  init: function () {
    console.log("🎮 VR Controls inicializado");

    this.rig = document.querySelector("#rig");
    this.camera = document.querySelector("#camera");

    this.right = document.querySelector('[laser-controls][hand="right"]');
    this.left = document.querySelector('[laser-controls][hand="left"]');

    if (!this.right || !this.left) {
      console.warn("⚠️ No se encontraron ambos controladores VR");
      return;
    }

    // ===========================
    // CLICK (Trigger derecho)
    // ===========================
    this.right.addEventListener("triggerdown", () => {
      console.log("🔵 VR Trigger → CLICK");
      const clickEvt = new Event("click");
      this.camera.dispatchEvent(clickEvt);
    });

    // ===========================
    // MOVIMIENTO (Thumbstick / Joystick)
    // ===========================
    const moveRig = (e) => {
      // e.detail.axes[0] = X, e.detail.axes[1] = Y del thumbstick
      const x = e.detail.axes[0];
      const y = e.detail.axes[1];

      // Deadzone
      if (Math.abs(x) < 0.1 && Math.abs(y) < 0.1) return;

      // Dirección de la cámara
      const dir = new THREE.Vector3();
      this.camera.object3D.getWorldDirection(dir);
      dir.y = 0;
      dir.normalize();

      // Vector lateral
      const rightVec = new THREE.Vector3();
      rightVec.crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();

      // Movimiento final
      const move = new THREE.Vector3();
      move.add(dir.multiplyScalar(-y * this.data.speed)); // adelante/atrás
      move.add(rightVec.multiplyScalar(x * this.data.speed)); // izquierda/derecha

      this.rig.object3D.position.add(move);
    };

    // Aplicar movimiento a ambos mandos para robustez
    this.right.addEventListener("axismove", moveRig);
    this.left.addEventListener("axismove", moveRig);
  },
});
