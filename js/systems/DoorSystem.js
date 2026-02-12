// js/systems/DoorSystem.js
AFRAME.registerSystem("door-system", {
  init: function () {
    this.logged = false; // marca para que solo loguee una vez
  },

  tick: function () {
    if (this.logged) return; // ya logueamos, no hacemos nada

    const meshes = window.OpenCentralGlobals?.interactiveMeshes;
    if (meshes && meshes.length) {
      const doorMeshes = meshes.filter((m) => m.name.startsWith("Puerta"));
      console.log(
        "🚪 DoorSystem — Puertas detectadas:",
        doorMeshes.map((m) => m.name),
      );
      this.logged = true; // ¡importante! para que no vuelva a loguear
    }
  },
});
