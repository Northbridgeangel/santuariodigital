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

//Componente hud-overlay para el UI y los elementos que lo necesiten
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


