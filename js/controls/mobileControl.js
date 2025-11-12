//mobileControl.js;
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
        // 🔒 Solo si estamos en modo vuelo
        if (!this.el.sceneEl.isFlyMode) return;
        if (e.touches.length === 1) this.startY = e.touches[0].clientY;
      },
      false
    );

    this.el.sceneEl.canvas.addEventListener(
      "touchmove",
      (e) => {
        // 🔒 Solo si estamos en modo vuelo
        if (!this.el.sceneEl.isFlyMode) return;

        if (e.touches.length === 1 && this.startY !== null) {
          let deltaY = e.touches[0].clientY - this.startY;
          this.targetY -= deltaY * 0.007; // ajuste de sensibilidad (0.01 muy brusco)
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
    // 🔒 Solo si estamos en modo vuelo
    if (!this.el.sceneEl.isFlyMode) return;

    const pos = this.el.object3D.position;
    pos.y += (this.targetY - pos.y) * this.data.speed;
  },
});

//Minicomponente para igualar la suavidad horizontal a la del movimiento vertical
AFRAME.registerComponent("swipe-left-right", {
  schema: {
    speed: { type: "number", default: 0.05 }, // suavidad del giro
    sensitivity: { type: "number", default: 0.007 }, // sensibilidad del swipe
  },
});

// Componente para mover la cámara hacia adelante mientras se mantiene pulsado (eje Z relativo a cámara)
AFRAME.registerComponent("touch-hold", {
  schema: {
    speed: { type: "number", default: 0.5 },
    holdTime: { type: "number", default: 500 }, // Mantener pulsado medio segundo para activar
  },

  init: function () {
    this.holding = false;
    this.activeHold = false;
    this.holdTimer = null;

    // Detectar inicio de toque
    window.addEventListener("touchstart", (e) => {
      if (e.touches.length === 1) {
        // Inicia el temporizador
        this.holdTimer = setTimeout(() => {
          this.activeHold = true; // activamos movimiento
        }, this.data.holdTime);

        this.holding = true;
      }
    });

    // Detectar fin de toque
    window.addEventListener("touchend", () => {
      this.holding = false;
      this.activeHold = false;
      clearTimeout(this.holdTimer);
      this.holdTimer = null;
    });
  },

  tick: function (_, timeDelta) {
    if (!this.holding || !this.activeHold) return;

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
