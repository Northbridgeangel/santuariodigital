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

// Componente para mover la cámara hacia adelante mientras se mantiene pulsado (eje Z relativo a cámara)
AFRAME.registerComponent("touch-hold", {
  schema: {
    speed: { type: "number", default: 0.88 }, // velocidad de avance por segundo
  },

  init: function () {
    // Indicador de si se mantiene pulsado
    this.holding = false;

    // Detecta toque único en pantalla
    window.addEventListener("touchstart", (e) => {
      if (e.touches.length === 1) {
        this.holding = true;
        console.log("Touch start: movimiento activado");
      }
    });

    // Detecta fin del toque
    window.addEventListener("touchend", () => {
      this.holding = false;
      console.log("Touch end: movimiento detenido");
    });
  },

  tick: function (_, timeDelta) {
    if (!this.holding) return;

    const deltaSeconds = timeDelta / 1000; // Convertir ms a segundos
    const camera = this.el.object3D;

    // Obtener dirección forward de la cámara en world coordinates
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.normalize(); // Magnitud 1

    // Multiplicamos forward por speed y deltaSeconds
    const moveVector = forward
      .clone()
      .multiplyScalar(this.data.speed * deltaSeconds);

    // Aplicamos movimiento a la posición actual de la cámara
    camera.position.add(moveVector);

    // Debug: mostrar posiciones X y Z actualizadas
    console.log(
      `Moviéndose -> X: ${camera.position.x.toFixed(
        3
      )}, Z: ${camera.position.z.toFixed(3)}`
    );
  },
});
