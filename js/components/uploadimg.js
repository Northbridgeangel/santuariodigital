/* ==========================
UPLOAD IMG COMPONENT 
========================== */

AFRAME.registerComponent("upload-wall-texture", {
  init: function () {
    const sceneEl = this.el.sceneEl;
    const OG = window.OpenCentralGlobals;

    const highlightableNames = [
      "Objetoañadido",
      "Muro_hab_salida",
      "Muro_hab_entrada",
      "Muro_entrada001",
      "Muro_entrada002",
      "Muro_entrada003",
      "Muro_entrada004",
      "Muro_gal_salida",
      "Murolienzo001",
      "Murolienzo002",
      "MyEntrance",
      "MyEntrance_gal",
    ];

    // cargamos la textura desde assets
    const loader = new THREE.TextureLoader();
    const questionTexture = loader.load(
      "assets/Textura-de-pregunta.png",
      () => {
        console.log("✅ Textura cargada correctamente");
      },
      undefined,
      (err) => {
        console.error("❌ Error cargando textura:", err);
      },
    );

    questionTexture.flipY = false; // importante para GLTF/GLB

    sceneEl.addEventListener("mesh-clicked", (event) => {
      const mesh = event.detail?.mesh;
      if (!mesh) return;

      if (mesh.name === "Btn-upload-img") {
        const selectableMeshes = OG.core.interactiveMeshes.filter((m) =>
          highlightableNames.includes(m.name),
        );

        console.log(
          "🖼 Aplicando textura de pregunta a:",
          selectableMeshes.map((m) => m.name),
        );

        selectableMeshes.forEach((m) => {
          if (!m.originalMaterial) {
            m.originalMaterial = m.material.clone();
          }

          const newMaterial = m.material.clone();
          newMaterial.map = questionTexture;
          newMaterial.needsUpdate = true;

          m.material = newMaterial;
        });
      }
    });
  },
});
