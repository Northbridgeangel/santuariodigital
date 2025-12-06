// -------------------------------------------------------------
// auto-raycast.js
// Contiene:
// 1) auto-raycast-tag → añade clase .interactable a las mallas internas
// 2) auto-raycaster   → raycaster automático + selección de mesh
// -------------------------------------------------------------

// 1️⃣ Etiquetado automático de mallas
AFRAME.registerComponent("auto-raycast-tag", {
  init: function () {
    this.el.addEventListener("model-loaded", () => {
      const mesh = this.el.getObject3D("mesh");
      if (!mesh) return;

      mesh.traverse((node) => {
        if (node.isMesh) {
          node.el = this.el; // referencia al entity original
          node.classList = this.el.classList;
          node.classList.add("interactable");
        }
      });

      console.log(
        "🎯 auto-raycast-tag: mallas internas marcadas como .interactable"
      );
    });
  },
});

// 2️⃣ Raycaster automático desde la cámara
AFRAME.registerComponent("auto-raycaster", {
  schema: {
    distance: { default: 5 },
  },

  init: function () {
    this.raycaster = new THREE.Raycaster();
    this.tempMatrix = new THREE.Matrix4();
    this.intersected = null;

    // Guardamos referencia global a la escena
    this.scene = this.el.sceneEl;
  },

  tick: function () {
    // Dirección del ray desde la cámara
    const camObj = this.el.object3D;
    this.tempMatrix.identity().extractRotation(camObj.matrixWorld);

    const origin = camObj.getWorldPosition(new THREE.Vector3());
    const direction = new THREE.Vector3(0, 0, -1).applyMatrix4(this.tempMatrix);

    this.raycaster.set(origin, direction);
    this.raycaster.far = this.data.distance;

    // Obtenemos todos los meshes interactuables
    const interactables = [];
    this.scene.object3D.traverse((node) => {
      if (
        node.isMesh &&
        node.classList &&
        node.classList.contains("interactable")
      ) {
        interactables.push(node);
      }
    });

    const hits = this.raycaster.intersectObjects(interactables, true);

    const scene = this.scene;

    if (hits.length > 0) {
      const mesh = hits[0].object;

      // Guardamos el mesh seleccionado globalmente
      scene.selectedMeshUnderPointer = mesh;

      if (this.intersected !== mesh) {
        this.intersected = mesh;
        console.log("👉 Nuevo mesh seleccionado:", mesh.el?.id || mesh.name);
      }
    } else {
      scene.selectedMeshUnderPointer = null;
      this.intersected = null;
    }
  },
});
