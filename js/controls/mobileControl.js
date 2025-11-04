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
    // Indica si el usuario mantiene pulsado
    this.holding = false;

    // Detecta toque inicial
    window.addEventListener("touchstart", (e) => {
      if (e.touches.length === 1) {
        this.holding = true;
        console.log("Touch Hold activado");
      }
    });

    // Detecta cuando se deja de tocar
    window.addEventListener("touchend", () => {
      this.holding = false;
      console.log("Touch Hold desactivado");
    });
  },

  tick: function (_, timeDelta) {
    if (!this.holding) return;

    // Convertimos el delta de tiempo a segundos
    const deltaSeconds = timeDelta / 1000;

    const camera = this.el.object3D;

    // Obtenemos el vector forward de la cámara (donde está mirando)
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);

    // Solo nos interesa el movimiento horizontal XZ
    forward.y = 0;
    forward.normalize();

    // Movemos la cámara en el espacio global XZ según su orientación
    const moveVector = forward
      .clone()
      .multiplyScalar(this.data.speed * deltaSeconds);
    camera.position.add(moveVector);

    // Logs de depuración
    console.log(
      "Moviendo cámara:",
      "X:",
      camera.position.x.toFixed(2),
      "Z:",
      camera.position.z.toFixed(2)
    );
    console.log(
      "Forward:",
      forward.x.toFixed(2),
      forward.z.toFixed(2),
      "DeltaSeconds:",
      deltaSeconds.toFixed(3)
    );
  },
});
