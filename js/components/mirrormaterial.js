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
          // Aplicar a cualquier material que contenga "Cristal dorado" en su nombre
          if (child.material.name.includes("Cristal dorado")) {
            child.material.color.set(0xbfa15a);
            child.material.metalness = 0.05;
            child.material.roughness = 0.02;
            child.material.transmission = 1.0;
            child.material.thickness = 0.2;
            child.material.ior = 1.52;
            child.material.envMap = texture;
            child.material.envMapIntensity = 2.5;
            child.material.transparent = true;
            child.material.opacity = 0.92;

            // Si el material no es físico todavía, lo reemplazamos
            if (!(child.material instanceof THREE.MeshPhysicalMaterial)) {
              child.material = new THREE.MeshPhysicalMaterial(child.material);
            }

            //console.log("✨ Cristal dorado espejado aplicado");
          }
        });

        //console.log("✅ Componente de materiales cargado");
      });
    });
  },
});
