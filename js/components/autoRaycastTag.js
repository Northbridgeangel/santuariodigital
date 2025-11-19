//autoRaycastTag.js - Componente auto-tag interactable para GLB
AFRAME.registerComponent("auto-raycast-tag", {
  init: function () {
    this.el.addEventListener("model-loaded", () => {
      const mesh = this.el.getObject3D("mesh");
      if (!mesh) return;

      mesh.traverse((node) => {
        if (node.isMesh) {
          node.el = this.el;
          node.classList = this.el.classList;
          node.classList.add("interactable");
        }
      });

      console.log("🎯 Todas las mallas internas marcadas como .interactable");
    });
  },
});
