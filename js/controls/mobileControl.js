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

// Componente para mover la cámara hacia adelante mientras se mantiene pulsado (eje Z relativo al rig)
AFRAME.registerComponent("touch-hold", {
  schema: {
    speed: { type: "number", default: 0.09 }, // velocidad de avance por segundo
  },

  init: function () {
    // Variable que indica si se está manteniendo pulsado
    this.holding = false;

    // Detecta cuando se toca la pantalla
    window.addEventListener("touchstart", (e) => {
      if (e.touches.length === 1) {
        this.holding = true; // comienza el movimiento
        console.log("Touch Hold iniciado");
      }
    });

    // Detecta cuando se deja de tocar
    window.addEventListener("touchend", () => {
      this.holding = false; // se detiene el movimiento
      console.log("Touch Hold detenido");
    });
  },

  tick: function (_, timeDelta) {
    if (!this.holding) return;

    // Convertimos delta de ms a segundos
    const deltaSeconds = timeDelta / 1000;

    // Tomamos la posición actual del objeto (rig o cámara)
    const camera = this.el.object3D;

    // Vector forward de la cámara
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.normalize();

    // Forzamos que siempre avance hacia delante, sin importar orientación global
    const moveVector = forward
      .clone()
      .multiplyScalar(this.data.speed * deltaSeconds);

    // Multiplicamos por -1 para asegurar que Z avanza hacia delante
    camera.position.x += moveVector.x * -1;
    camera.position.z += moveVector.z * -1;

    // Debug: imprimir posición cada tick
    console.log(
      `Moviéndose en Z hacia delante: posición X=${camera.position.x.toFixed(
        3
      )}, Z=${camera.position.z.toFixed(3)}`
    );
  },
});
