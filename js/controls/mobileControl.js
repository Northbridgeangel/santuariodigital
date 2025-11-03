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
    const camera = document.querySelector("#camera");
    let interval;

    const moveForward = () => {
      if (!camera || !rig) return;

      const pos = rig.object3D.position.clone();
      const dir = new THREE.Vector3();
      camera.object3D.getWorldDirection(dir);

      dir.normalize();

      // Movernos hacia delante (en dirección -Z)
      pos.x -= dir.x * this.data.speed;
      pos.z -= dir.z * this.data.speed;

      rig.object3D.position.copy(pos);

      console.log(
        `Moving forward: X=${pos.x.toFixed(2)}, Z=${pos.z.toFixed(
          2
        )}, dir=(${dir.x.toFixed(2)}, ${dir.z.toFixed(2)})`
      );
    };

    this.el.sceneEl.canvas.addEventListener("touchstart", () => {
      console.log("Touch hold start");
      interval = setInterval(moveForward, 16);
    });

    this.el.sceneEl.canvas.addEventListener("touchend", () => {
      console.log("Touch hold end");
      clearInterval(interval);
    });
  },
});
