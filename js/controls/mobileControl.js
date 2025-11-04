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

//No imprescindible, para igualar la suavidad de movimiento horizontal
AFRAME.registerComponent("swipe-left-right", {
  schema: { speed: { type: "number", default: 0.05 } },

  init: function () {
    this.startX = null;
    this.targetRotationY = this.el.object3D.rotation.y;

    this.el.sceneEl.canvas.addEventListener("touchstart", (e) => {
      if (e.touches.length === 1) this.startX = e.touches[0].clientX;
    });

    this.el.sceneEl.canvas.addEventListener("touchmove", (e) => {
      if (this.startX !== null && e.touches.length === 1) {
        const deltaX = e.touches[0].clientX - this.startX;
        this.targetRotationY -= deltaX * 0.01; // ajustar sensibilidad
        this.startX = e.touches[0].clientX;
      }
    });

    this.el.sceneEl.canvas.addEventListener("touchend", () => {
      this.startX = null;
    });
  },

  tick: function () {
    const rot = this.el.object3D.rotation;
    rot.y += (this.targetRotationY - rot.y) * this.data.speed; // lerp suave
  },
});

// Componente para mover la cámara hacia adelante mientras se mantiene pulsado (eje Z relativo a cámara)
AFRAME.registerComponent("touch-hold", {
  schema: {
    speed: { type: "number", default: 0.3 },
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
  },

  tick: function (_, timeDelta) {
    if (!this.holding) return;

    const deltaSeconds = timeDelta / 1000;
    const rig = this.el.object3D;
    const camera = this.el.querySelector("[camera]").object3D;

    // Dirección de la cámara en el mundo
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0; // ignorar altura
    forward.normalize();

    // Invertir componentes para que avance hacia delante
    forward.multiplyScalar(-1);

    // Aplicar desplazamiento al rig
    rig.position.x += forward.x * this.data.speed * deltaSeconds;
    rig.position.z += forward.z * this.data.speed * deltaSeconds;

    //console.log(`Rig moviéndose: X=${rig.position.x.toFixed(2)} Z=${rig.position.z.toFixed(2)} | Forward: X=${forward.x.toFixed(2)} Z=${forward.z.toFixed(2)}`);
  },
});
