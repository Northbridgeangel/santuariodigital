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


// Componente para mover el rig hacia delante mientras se mantiene pulsado (eje Z)
AFRAME.registerComponent("touch-hold", {
  schema: {
    speed: { type: "number", default: 0.15 }, // velocidad de avance por segundo
  },

  init: function () {
    // Flag que indica si se mantiene pulsado
    this.holding = false;

    // Detecta inicio de toque
    window.addEventListener("touchstart", (e) => {
      if (e.touches.length === 1) {
        this.holding = true;
        console.log("Touch hold started");
      }
    });

    // Detecta fin de toque
    window.addEventListener("touchend", () => {
      this.holding = false;
      console.log("Touch hold ended");
    });
  },

  tick: function (_, timeDelta) {
    if (!this.holding) return;

    // Convertimos delta de ms a segundos
    const deltaSeconds = timeDelta / 1000;

    // Obtenemos el rig y la cámara dentro del rig
    const rig = this.el; // asumimos que el componente se pone en el <a-entity id="rig">
    const camera = rig.querySelector("#camera").object3D;

    // Obtenemos dirección forward de la cámara
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward); // calcula forward en mundo
    forward.normalize();

    // Movemos solo en Z hacia adelante (acumulativo)
    rig.object3D.position.x += forward.x * this.data.speed * deltaSeconds;
    rig.object3D.position.z += forward.z * this.data.speed * deltaSeconds;

    console.log(
      "Moving touch-hold",
      "Rig pos:",
      rig.object3D.position.x.toFixed(2),
      rig.object3D.position.z.toFixed(2),
      "Forward:",
      forward.x.toFixed(2),
      forward.z.toFixed(2)
    );
  },
});
