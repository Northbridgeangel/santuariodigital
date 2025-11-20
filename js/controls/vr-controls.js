//vr-controls.js
AFRAME.registerComponent("vr-controls", {
  schema: { speed: { type: "number", default: 0.05 } },
  init: function () {
    this.rig = document.querySelector("#rig");
    this.camera = document.querySelector("#camera");

    // Esperar a que la escena esté lista
    this.el.sceneEl.addEventListener("loaded", () => {
      this.right = document.querySelector('[laser-controls][hand="right"]');
      this.left = document.querySelector('[laser-controls][hand="left"]');

      if (!this.right || !this.left) {
        console.warn("⚠️ No se encontraron ambos controladores VR");
        return;
      }

      // Click trigger
      this.right.addEventListener("triggerdown", () => {
        console.log("🔵 VR Trigger → CLICK");
        this.camera.dispatchEvent(new Event("click"));
      });

      // Movimiento
      const moveRig = (e) => {
        const x = e.detail.axes[0];
        const y = e.detail.axes[1];
        if (Math.abs(x) < 0.1 && Math.abs(y) < 0.1) return;

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
      };

      this.right.addEventListener("axismove", moveRig);
      this.left.addEventListener("axismove", moveRig);
    });
  },
});
