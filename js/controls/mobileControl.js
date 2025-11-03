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
  schema: {
    speed: { type: "number", default: 0.05 }, // velocidad de avance por segundo
  },

  init: function () {
    // Variable que indica si se está manteniendo pulsado
    this.holding = false;

    // Detecta cuando se toca la pantalla
    window.addEventListener("touchstart", (e) => {
      if (e.touches.length === 1) {
        this.holding = true; // comienza el movimiento
      }
    });

    // Detecta cuando se deja de tocar
    window.addEventListener("touchend", () => {
      this.holding = false; // se detiene el movimiento
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

      // Movemos solo en Z (hacia adelante), sumando constantemente mientras se mantiene pulsado
      camera.position.z += forward.z * this.data.speed * deltaSeconds;
    }
  },
});
