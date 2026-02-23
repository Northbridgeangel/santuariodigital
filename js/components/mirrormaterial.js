AFRAME.registerComponent("mirror-material", {
  schema: { target: { type: "selector" } },

  init: function () {
    const targetEl = this.data.target;
    if (!targetEl) return;

    targetEl.addEventListener("model-loaded", () => {
      const mesh = targetEl.getObject3D("mesh");

      // Cargar textura de entorno
      const loader = new THREE.TextureLoader();
      loader.setPath("./assets/");

      loader.load("environment.png", (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;

        mesh.traverse((child) => {
          if (!child.isMesh || !child.material) return;

          // 🪞 ESPEJO (tu material original)
          if (child.material.name === "Espejo") {
            child.material = new THREE.MeshStandardMaterial({
              color: 0xffffff,
              metalness: 1.0,
              roughness: 0.0,
              envMap: texture,
              envMapIntensity: 1.5,
            });

            //console.log("✅ Material espejo aplicado");
          }

          // ✨ CRISTAL DORADO ESPEJADO
          if (child.material.name === "Cristal dorado") {
            child.material = new THREE.MeshPhysicalMaterial({
              color: 0xbfa15a,
              metalness: 0.05,
              roughness: 0.02,
              transmission: 1.0,
              thickness: 0.2,
              ior: 1.52,
              envMap: texture,
              envMapIntensity: 2.5,
              transparent: true,
              opacity: 0.92,
            });

            //console.log("✨ Cristal dorado aplicado");
          }
        });

        //console.log("✅ Componente de materiales cargado");
      });
    });
  },
});
