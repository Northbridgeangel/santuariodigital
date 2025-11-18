// vr-controls.js
AFRAME.registerComponent("vr-controls", {
  schema: { speed: { type: "number", default: 0.05 } },

  init: function () {
    //console.log("🎮 VR Controls inicializado");

    // Rig y cámara
    this.rig = this.el;
    this.camera = this.el.querySelector("#camera");

    // Detectamos mandos
    this.right = this.el.querySelector('[laser-controls][hand="right"]');
    this.left = this.el.querySelector('[laser-controls][hand="left"]');

    if (!this.right) {
      //console.warn("⚠️ No se encontró controlador VR derecho");
      return;
    }

    // ==================
    // Escala solo para VR
    // ==================
    if (AFRAME.utils.device.checkHeadsetConnected()) {
      this.rig.setAttribute("scale", "0.35 0.35 0.35");
      //console.log("🧍 Escala VR aplicada al rig:", this.rig.getAttribute("scale"));
    } else {
      this.rig.setAttribute("scale", "1 1 1");
    }

    // ==================
    // Click trigger
    // ==================
    this.right.addEventListener("triggerdown", () => {
      //console.log("🔵 VR Trigger → CLICK");
      const clickEvt = new Event("click");
      this.camera.dispatchEvent(clickEvt);
    });

    // ==================
    // Movimiento joystick / thumbstick
    // ==================
    const moveFn = (e) => {
      const x = e.detail.x;
      const y = e.detail.y;
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

    this.right.addEventListener("thumbstickmoved", moveFn);
    this.right.addEventListener("axismove", moveFn);
  },
});
