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
    speed: { type: "number", default: 0.088 },
  },

  init: function () {
    this.holding = false;

    // Detectar inicio de toque
    window.addEventListener("touchstart", (e) => {
      if (e.touches.length === 1) this.holding = true;
    });

    // Detectar fin de toque
    window.addEventListener("touchend", () => {
      this.holding = false;
    });

    // Posición inicial del rig
    this.currentPos = new THREE.Vector3();
  },

  tick: function (_, timeDelta) {
    if (!this.holding) return;

    const deltaSeconds = timeDelta / 1000;
    const rig = this.el.object3D;

    // Guardamos posición actual
    this.currentPos.copy(rig.position);

    // Calculamos forward basado en la posición actual del rig, invertida
    const forward = this.currentPos.clone().multiplyScalar(-1);

    // Normalizamos para mantener dirección consistente
    forward.normalize();

    // Calculamos desplazamiento
    const move = forward.clone().multiplyScalar(this.data.speed * deltaSeconds);

    // Aplicamos movimiento al rig
    this.currentPos.add(move);
    rig.position.set(this.currentPos.x, rig.position.y, this.currentPos.z);

    console.log(
      `Rig moviéndose: X=${rig.position.x.toFixed(
        2
      )} Z=${rig.position.z.toFixed(
        2
      )} | Forward invertido: X=${forward.x.toFixed(2)} Z=${forward.z.toFixed(
        2
      )}`
    );
  },
});