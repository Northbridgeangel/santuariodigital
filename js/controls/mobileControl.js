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


// Componente simple: avanza hacia adelante (Z+) mientras se mantiene pulsado
AFRAME.registerComponent("touch-hold", {
  schema: { speed: { default: 0.05 } },
  init: function () {
    const rig = document.querySelector("#rig");
    let interval;

    const moveForward = () => {
      const pos = rig.object3D.position;
      const dir = new THREE.Vector3();
      rig.object3D.getWorldDirection(dir);
      pos.addScaledVector(dir, this.data.speed);
      rig.object3D.position.copy(pos);
      console.log(
        `Moving forward: x=${pos.x.toFixed(2)} z=${pos.z.toFixed(2)}`
      );
    };

    this.el.sceneEl.canvas.addEventListener("touchstart", () => {
      console.log("Touch hold start");
      interval = setInterval(moveForward, 16); // ~60fps
    });

    this.el.sceneEl.canvas.addEventListener("touchend", () => {
      console.log("Touch hold end");
      clearInterval(interval);
    });
  },
});

