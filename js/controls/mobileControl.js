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

// Componente para mover la cámara hacia adelante mientras se mantiene pulsado (eje Z)
AFRAME.registerComponent("touch-hold", {
  schema: { speed: { type: "number", default: 0.05 } },

  init: function () {
    this.holding = false;

    console.log("touch-hold inicializado"); // <--- Esto confirma que se carga

    window.addEventListener("touchstart", (e) => {
      if (e.touches.length === 1) {
        this.holding = true;
        console.log("tocando: holding = true"); // <--- Debug de touch
      }
    });

    window.addEventListener("touchend", () => {
      this.holding = false;
      console.log("soltado: holding = false"); // <--- Debug de release
    });
  },

  tick: function (_, timeDelta) {
    if (this.holding) {
      const deltaSeconds = timeDelta / 1000;
      const camera = this.el.object3D;
      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      forward.normalize();
      camera.position.z += forward.z * this.data.speed * deltaSeconds;
      console.log("moviéndose en Z", camera.position.z); // <--- Debug del movimiento
    }
  },
});
