// changenote.js - Toggle entre carteles habitación y estudio
AFRAME.registerComponent("changenote", {
  init: function () {
    const escenario = window.OpenCentralGlobals.core.escenario;
    const sceneEl = window.OpenCentralGlobals.core.sceneEl;

    this.noteModeActive = false;
    this.noteMeshes = {};
    this.btnMeshName = "Btn-change-mode";

    const setupNotes = () => {
      const modelRoot = escenario.getObject3D("mesh");
      if (!modelRoot) return;

      this.noteMeshes = {
        Dorm: modelRoot.getObjectByName("Carteldormnote"),
        Studio: modelRoot.getObjectByName("Cartelstudynotes"),
        Btn: modelRoot.getObjectByName(this.btnMeshName),
      };

      // Estado inicial
      if (this.noteMeshes.Dorm) this.noteMeshes.Dorm.visible = false;
      if (this.noteMeshes.Studio) this.noteMeshes.Studio.visible = true;

      // Registrar botón como interactable
      if (this.noteMeshes.Btn) {
        this.noteMeshes.Btn.userData.interactable = true;
        window.OpenCentralGlobals.core.interactiveMeshes.push(this.noteMeshes.Btn);
      }

      console.log("🟢 Carteles inicializados y registrados VR/mouse");
    };

    if (escenario.getObject3D("mesh")) setupNotes();
    escenario.addEventListener("model-loaded", setupNotes);

    // Escuchar clicks globales
    sceneEl.addEventListener("mesh-clicked", (evt) => {
      const clickedMesh = evt.detail.mesh;
      if (!clickedMesh) return;

      if (clickedMesh.name === this.btnMeshName) {
        this.toggle();
      }
    });
  },

  toggle: function () {
    if (!this.noteMeshes.Dorm || !this.noteMeshes.Studio) return;

    this.noteModeActive = !this.noteModeActive;
    this.noteMeshes.Dorm.visible = this.noteModeActive;
    this.noteMeshes.Studio.visible = !this.noteModeActive;
    /*console.log(
      `🎮 Note Mode toggled: ${this.noteModeActive ? "Dorm visible" : "Studio visible"}`,
    );*/
  },
});