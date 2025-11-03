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


// Componente para mover la cámara hacia delante mientras se mantiene pulsado (eje Z)
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
        console.log("Touch hold: START");
      }
    });

    // Detecta cuando se deja de tocar
    window.addEventListener("touchend", () => {
      this.holding = false; // se detiene el movimiento
      console.log("Touch hold: END");
    });
  },

  tick: function (_, timeDelta) {
    // timeDelta es el tiempo en ms desde el tick anterior
    const deltaSeconds = timeDelta / 1000;

    if (this.holding) {
      // Obtenemos el objeto 3D de la cámara
      const camera = this.el.object3D;

      // Vector de dirección hacia donde apunta la cámara
      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);

      // Normalizamos para magnitud 1
      forward.normalize();

      // Forzamos que Z siempre sea hacia delante (positivo según tu escena)
      forward.z = -Math.abs(forward.z);

      // Movemos solo en X y Z (no Y), sumando a la posición actual
      camera.position.x += forward.x * this.data.speed * deltaSeconds;
      camera.position.z += forward.z * this.data.speed * deltaSeconds;

      // Debug: mostramos la posición actual de la cámara
      console.log(
        `Moviéndose en Z: ${camera.position.z.toFixed(2)}, X: ${camera.position.x.toFixed(2)}`
      );
    }
  },
});
