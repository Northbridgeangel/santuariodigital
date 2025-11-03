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

    // Detecta cuando se toca la pantalla
    window.addEventListener("touchstart", (e) => {
      if (e.touches.length === 1) {
        this.holding = true;
        console.log("👉 Touch start detectado. Movimiento activado.");
      }
    });

    // Detecta cuando se deja de tocar
    window.addEventListener("touchend", () => {
      this.holding = false;
      console.log("🖐️ Touch end detectado. Movimiento detenido.");
    });
  },

  tick: function (_, timeDelta) {
    const deltaSeconds = timeDelta / 1000;

    if (this.holding) {
      const camera = this.el.object3D;
      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      forward.normalize();

      // Direcciones y datos de debug
      console.log("➡️ Dirección forward:", forward);
      console.log("⏱️ deltaSeconds:", deltaSeconds);
      console.log("⚙️ Velocidad:", this.data.speed);

      // Posición actual antes del movimiento
      const pos = camera.position.clone();
      console.log("📍 Posición inicial:", pos);

      // Mueve en dirección -Z (hacia adelante visualmente)
      pos.add(forward.multiplyScalar(-this.data.speed * deltaSeconds));

      // Aplica el nuevo valor y sincroniza con el atributo de A-Frame
      this.el.object3D.position.copy(pos);
      this.el.setAttribute("position", pos);

      console.log("🚀 Nueva posición Z:", pos.z);
    }
  },
});
