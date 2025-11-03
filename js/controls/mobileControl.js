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
    speed: { type: "number", default: 0.25 }, // velocidad de avance por segundo
  },

  init: function () {
    // Guardamos la entidad que representa el rig
    this.rig = this.el;

    // Variable que indica si se está manteniendo pulsado
    this.holding = false;

    window.addEventListener("touchstart", (e) => {
      if (e.touches.length === 1) {
        this.holding = true;
        console.log("Touch hold: START");
      }
    });

    window.addEventListener("touchend", () => {
      this.holding = false;
      console.log("Touch hold: END");
    });
  },

  tick: function (_, timeDelta) {
    const deltaSeconds = timeDelta / 1000;

    if (this.holding) {
      // Usamos la dirección hacia adelante basada en la cámara dentro del rig
      const camera = this.rig.querySelector("[camera]").object3D;

      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      forward.normalize();

      // Forzamos que Z siempre avance
      forward.z = -Math.abs(forward.z);

      // Movemos el rig, no la cámara local
      const rigPos = this.rig.object3D.position;
      rigPos.x += forward.x * this.data.speed * deltaSeconds;
      rigPos.z += forward.z * this.data.speed * deltaSeconds;

      console.log(
        `Moviéndose en rig Z: ${rigPos.z.toFixed(2)}, X: ${rigPos.x.toFixed(2)}`
      );
    }
  },
});
