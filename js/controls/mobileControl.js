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
// Siempre avanza hacia delante, independientemente de la rotación
AFRAME.registerComponent("touch-hold", {
  schema: {
    speed: { type: "number", default: 0.1 }, // velocidad de avance por segundo
  },

  init: function () {
    // Variable que indica si se está manteniendo pulsado
    this.holding = false;

    // Detecta cuando se toca la pantalla
    window.addEventListener("touchstart", (e) => {
      if (e.touches.length === 1) {
        this.holding = true; // comienza el movimiento
        console.log("Touch start: holding = true");
      }
    });

    // Detecta cuando se deja de tocar
    window.addEventListener("touchend", () => {
      this.holding = false; // se detiene el movimiento
      console.log("Touch end: holding = false");
    });
  },

  tick: function (_, timeDelta) {
    // timeDelta es el tiempo en ms desde el tick anterior
    // Lo convertimos a segundos para calcular el desplazamiento
    const deltaSeconds = timeDelta / 1000;

    if (this.holding) {
      const camera = this.el.object3D;

      // Dirección forward de la cámara
      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);

      // Normalizamos para que tenga magnitud 1
      forward.normalize();

      // Para que siempre avance hacia delante, invertimos el vector forward
      const move = forward
        .clone()
        .multiplyScalar(this.data.speed * deltaSeconds * -1);

      // Aplicamos solo la parte del movimiento hacia delante (X y Z)
      camera.position.x += move.x;
      camera.position.z += move.z;

      console.log(
        `Moving forward: moveX=${move.x.toFixed(3)}, moveZ=${move.z.toFixed(
          3
        )}, ` +
          `cameraX=${camera.position.x.toFixed(
            3
          )}, cameraZ=${camera.position.z.toFixed(3)}`
      );
    }
  },
});
