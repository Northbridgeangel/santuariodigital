// Componente para mover la cámara arriba y abajo con swipe (eje Y)
AFRAME.registerComponent("swipe-up-down", {
  schema: {
    speed: { type: "number", default: 0.05 }, // suavidad del movimiento
  },

  init: function () {
    this.startY = null;
    this.targetY = this.el.object3D.position.y;

    this.el.sceneEl.canvas.addEventListener(
      "touchstart",
      (e) => {
        if (e.touches.length === 1) this.startY = e.touches[0].clientY;
      },
      false
    );

    this.el.sceneEl.canvas.addEventListener(
      "touchmove",
      (e) => {
        if (e.touches.length === 1 && this.startY !== null) {
          let deltaY = e.touches[0].clientY - this.startY;
          this.targetY -= deltaY * 0.01; // ajuste de sensibilidad
          this.startY = e.touches[0].clientY;
        }
      },
      false
    );

    this.el.sceneEl.canvas.addEventListener(
      "touchend",
      (e) => {
        this.startY = null;
      },
      false
    );
  },

  tick: function () {
    const pos = this.el.object3D.position;
    pos.y += (this.targetY - pos.y) * this.data.speed;
  },
});


// Componente para mover el rig hacia delante mientras se mantiene pulsado (eje Z)
AFRAME.registerComponent("touch-hold", {
  schema: {
    speed: { type: "number", default: 0.25 },
  },

  init: function () {
    // Aplica el componente al rig
    this.holding = false;

    window.addEventListener("touchstart", (e) => {
      if (e.touches.length === 1) this.holding = true;
    });

    window.addEventListener("touchend", () => {
      this.holding = false;
    });
  },

  tick: function (_, timeDelta) {
    if (!this.holding) return;

    const deltaSeconds = timeDelta / 1000;
    const rig = this.el.object3D; // EL rig es la entidad donde aplicas este componente
    const camera = this.el.querySelector("[camera]").object3D; // La cámara dentro del rig

    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.normalize();

    // Forzar que siempre avance (hacia delante)
    forward.z = -Math.abs(forward.z);

    // Sumar al rig, no a la cámara
    rig.position.x += forward.x * this.data.speed * deltaSeconds;
    rig.position.z += forward.z * this.data.speed * deltaSeconds;

    console.log(
      `Rig moviéndose: X=${rig.position.x.toFixed(
        2
      )} Z=${rig.position.z.toFixed(2)}`
    );
  },
});
