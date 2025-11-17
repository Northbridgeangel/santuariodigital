// main.js — crea y llena el namespace
window.OpenCentralGlobals = {
  escenario: document.querySelector("#escenario"),  
  sceneEl: document.querySelector("a-scene"),
};

if (!OpenCentralGlobals.escenario)
  console.error("❌ No se encontró #escenario");
else console.log("✅ Escenario global disponible");

if (!OpenCentralGlobals.sceneEl) console.error("❌ No se encontró <a-scene>");
else console.log("✅ Scene global disponible");

// ==========================
// hud-pegado a la cámara
// ==========================
AFRAME.registerComponent("hud-overlay", {
  schema: {
    camera: { type: "selector" },
  },

  init: function () {
    this.cam = this.data.camera;
    this.vec3 = new THREE.Vector3();
    this.quat = new THREE.Quaternion();
    this.offset = new THREE.Vector3(0, 0, -0.1); // centrado

    this.el.addEventListener("object3dset", () => this.configureMaterial());
  },

  configureMaterial: function () {
    this.el.object3D.traverse((obj) => {
      if (obj.isMesh && obj.material) {
        obj.material.depthTest = false;
        obj.renderOrder = 9999;
        obj.material.needsUpdate = true;
      }
    });
  },

  tick: function () {
    if (!this.cam || !this.cam.object3D) return;

    const camObj = this.cam.object3D;
    const hudObj = this.el.object3D;

    camObj.getWorldPosition(this.vec3);
    camObj.getWorldQuaternion(this.quat);

    const pos = this.offset.clone().applyQuaternion(this.quat);

    hudObj.position.copy(this.vec3).add(pos);
    hudObj.quaternion.copy(this.quat);
  },
});

// ==========================
// hud-autoscale (ESCALA DINÁMICA DEL HUD)
// ==========================
AFRAME.registerComponent("hud-autoscale", {
  schema: {
    baseWidth: { default: 743 },
    baseHeight: { default: 743 },
    baseScale: { default: 1 },
  },

  init: function () {
    this.targetScale = new THREE.Vector3(1, 1, 1);

    this.updateScale = this.updateScale.bind(this);
    window.addEventListener("resize", this.updateScale);

    this.updateScale();
  },

  updateScale: function () {
    const w = window.innerWidth;
    const h = window.innerHeight;

      const factor = Math.min(
        w / this.data.baseWidth,
        h / this.data.baseHeight
      );
      const s = this.data.baseScale * factor;
      this.targetScale.set(s, s, s);

  },

  tick: function () {
    this.el.object3D.scale.lerp(this.targetScale, 0.15);
  },

  remove: function () {
    window.removeEventListener("resize", this.updateScale);
  },
});


// ==========================
// hud-child-position-scale (POSICIÓN DINÁMICA DEL HIJO DEL HUD)
// ==========================
AFRAME.registerComponent("hud-child-position-scale", {
  schema: {
    scaleWithScreen: { type: "boolean", default: true }, // si queremos ajustar con pantalla
  },

  init: function () {
    // Guardamos la posición base que venga del HTML
    const pos = this.el.getAttribute("position") || { x: 0, y: 0, z: 0 };
    this.basePos = new THREE.Vector3(pos.x, pos.y, pos.z);

    window.addEventListener("resize", () => this.updatePosition());
  },

  updatePosition: function () {
    const parent = this.el.parentEl;
    if (!parent) return;

    const plane = parent.querySelector("a-plane");
    if (!plane) return;

    // Factor de escala según pantalla
    let screenFactor = 1;
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;
    if (screenW < 743) screenFactor = screenW / 743;
    if (screenH < 743) screenFactor = Math.min(screenFactor, screenH / 743);

    let posX = this.basePos.x;
    let posY = this.basePos.y;

    if (this.data.scaleWithScreen) {
      // Aplica el mismo factor de escala que antes, multiplicando la posición base
      posX = this.basePos.x * screenFactor;
      posY = this.basePos.y * screenFactor;
    }

    this.el.object3D.position.set(posX, posY, this.basePos.z || 0);
  },

  tick: function () {
    this.updatePosition();
  },

  remove: function () {
    window.removeEventListener("resize", this.updatePosition);
  },
});


AFRAME.registerComponent("vr-detector", {
  init: function () {
    const scene = this.el.sceneEl;

    // 1. ESPERAR A QUE LA ESCENA CARGUE
    scene.addEventListener("loaded", () => {
      this.checkVRInitial();
    });

    // 2. DETECTAR CAMBIO A VR
    scene.addEventListener("enter-vr", () => {
      console.log("Entramos en VR");
      window.APP.isVR = true;
    });

    // 3. DETECTAR SALIDA DE VR
    scene.addEventListener("exit-vr", () => {
      console.log("Salimos de VR");
      window.APP.isVR = false;
    });
  },

  checkVRInitial: function () {
    const scene = this.el.sceneEl;

    // A-Frame indica VR activo con esta flag
    const isVrNow = scene.is("vr-mode");

    window.APP = window.APP || {};
    window.APP.isVR = isVrNow;

    console.log("Estado VR inicial:", isVrNow ? "VR" : "Desktop");
  },
});
