// touch-fly-z: mover hacia adelante / atrás con gesto de zoom (pinch)
AFRAME.registerComponent("touch-fly-z", {
  schema: {
    speed: { type: "number", default: 0.1 },
  },

  init: function () {
    this.lastDistance = null;
    const canvas = this.el.sceneEl.canvas;

    canvas.addEventListener("touchmove", this.onTouchMove.bind(this));
    canvas.addEventListener("touchend", this.onTouchEnd.bind(this));
  },

  onTouchMove: function (e) {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (this.lastDistance) {
        const delta = distance - this.lastDistance;

        const forward = new THREE.Vector3();
        this.el.object3D.getWorldDirection(forward);
        forward.y = 0; // mantener nivelado

        this.el.object3D.position.add(
          forward.multiplyScalar(delta * this.data.speed * 0.01)
        );
      }
      this.lastDistance = distance;
    }
  },

  onTouchEnd: function () {
    this.lastDistance = null;
  },
});

// touch-fly-y: mover arriba / abajo arrastrando dos dedos verticalmente
AFRAME.registerComponent("touch-fly-y", {
  schema: {
    speed: { type: "number", default: 0.02 },
    minY: { type: "number", default: 0 },
    maxY: { type: "number", default: 10 },
  },

  init: function () {
    this.prevY = null;
    const canvas = this.el.sceneEl.canvas;

    canvas.addEventListener("touchmove", this.onTouchMove.bind(this));
    canvas.addEventListener("touchend", this.onTouchEnd.bind(this));
  },

  onTouchMove: function (e) {
    if (e.touches.length === 2) {
      const avgY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      if (this.prevY) {
        const dy = this.prevY - avgY;
        const pos = this.el.object3D.position;
        pos.y = THREE.MathUtils.clamp(
          pos.y + dy * this.data.speed * 0.1,
          this.data.minY,
          this.data.maxY
        );
      }
      this.prevY = avgY;
    }
  },

  onTouchEnd: function () {
    this.prevY = null;
  },
});

// touch-fly-longpress: mantener pulsado para moverse hacia adelante o atrás
AFRAME.registerComponent("touch-fly-longpress", {
  schema: {
    speed: { type: "number", default: 0.05 },
  },

  init: function () {
    this.isLongPress = false;
    this.direction = 1;
    this.timer = null;
    const canvas = this.el.sceneEl.canvas;

    canvas.addEventListener("touchstart", this.onTouchStart.bind(this));
    canvas.addEventListener("touchend", this.onTouchEnd.bind(this));
  },

  onTouchStart: function (e) {
    if (e.touches.length === 1) {
      this.timer = setTimeout(() => {
        this.isLongPress = true;
        // opcional: detectar si el toque está en la parte superior o inferior de la pantalla
        const touchY = e.touches[0].clientY;
        this.direction = touchY < window.innerHeight / 2 ? 1 : -1; // arriba → adelante / abajo → atrás
      }, 500);
    }
  },

  onTouchEnd: function () {
    clearTimeout(this.timer);
    this.isLongPress = false;
  },

  tick: function (time, delta) {
    if (!this.isLongPress) return;

    const camera = this.el.object3D;
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    camera.position.add(
      forward.multiplyScalar(this.direction * this.data.speed)
    );
  },
});
