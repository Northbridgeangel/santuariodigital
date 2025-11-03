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
  schema: {
    speed: { type: "number", default: 0.05 }, // velocidad en unidades por segundo
  },

  init: function () {
    this.holding = false; // indica si el usuario mantiene pulsado

    // Detectar inicio del toque
    window.addEventListener("touchstart", (e) => {
      if (e.touches.length === 1) {
        this.holding = true;
        console.log("Touch hold: iniciado");
      }
    });

    // Detectar fin del toque
    window.addEventListener("touchend", () => {
      this.holding = false;
      console.log("Touch hold: detenido");
    });
  },

  tick: function (_, timeDelta) {
    // Convertimos el tiempo del frame a segundos
    const deltaSeconds = timeDelta / 1000;

    if (this.holding) {
      const camera = this.el.object3D;
      const oldZ = camera.position.z; // posición anterior

      // Movimiento solo en el eje Z positivo, constante y acumulativo
      camera.position.z += this.data.speed * deltaSeconds;

      console.log(
        `Moviéndose hacia delante: Z ${oldZ.toFixed(3)} -> ${camera.position.z.toFixed(3)}`
      );
    }
  },
});
