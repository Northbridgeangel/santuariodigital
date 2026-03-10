/* ==========================
UPLOAD IMG COMPONENT 
========================== */

AFRAME.registerComponent("upload-wall-texture", {
  init: function () {
    const sceneEl = this.el.sceneEl;
    const OG = window.OpenCentralGlobals;

    // Lista de meshes que pueden recibir imágenes
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

    // Estado interno
    this.selecting = false; // indica si estamos esperando que el usuario seleccione una pared
    this.selectableMeshes = []; // meshes que se pueden seleccionar
    this.targetMesh = null; // mesh que finalmente el usuario elige

    /* -----------------------------
       FILE INPUT OCULTO
       ----------------------------- */

    // Creamos un input invisible para subir imágenes
    this.fileInput = document.createElement("input");
    this.fileInput.type = "file";
    this.fileInput.accept = "image/*";
    this.fileInput.style.display = "none";
    document.body.appendChild(this.fileInput);

    /* -----------------------------
       TEXTURA DE PREGUNTA
       ----------------------------- */

    // Textura que se aplicará a las paredes que se pueden elegir
    const loader = new THREE.TextureLoader();
    const questionTexture = loader.load("assets/Textura-de-pregunta.png");

    // Necesario para modelos GLTF
    questionTexture.flipY = false;

    /* -----------------------------
       EVENTO PRINCIPAL DE CLICK
       ----------------------------- */

    sceneEl.addEventListener("mesh-clicked", (event) => {
      const mesh = event.detail?.mesh;
      if (!mesh) return;

      /* --------------------------------------------------
         1️⃣ CLICK EN BOTÓN SUBIR IMAGEN
         -------------------------------------------------- */

      if (mesh.name === "Btn-upload-img") {
        this.selecting = true;

        // Buscamos meshes válidas PERO ignoramos las que ya tienen imagen subida
        this.selectableMeshes = OG.core.interactiveMeshes.filter(
          (m) => highlightableNames.includes(m.name) && !m.userUploadedTexture, // 🔵 evita sobrescribir imágenes ya subidas
        );

        console.log(
          "🖼 Aplicando textura de pregunta a:",
          this.selectableMeshes.map((m) => m.name),
        );

        // Aplicamos textura de "pregunta" a todas las seleccionables
        this.selectableMeshes.forEach((m) => {
          // guardamos material original si aún no lo habíamos hecho
          if (!m.originalMaterial) {
            m.originalMaterial = m.material.clone();
          }

          const newMaterial = m.material.clone();
          newMaterial.map = questionTexture;
          newMaterial.needsUpdate = true;

          m.material = newMaterial;
        });

        return;
      }

      /* --------------------------------------------------
         2️⃣ SI ESTAMOS EN MODO SELECCIÓN
         -------------------------------------------------- */

      if (this.selecting) {
        const clickedSelectable = this.selectableMeshes.includes(mesh);

        /* -----------------------------
           CLICK FUERA DE LAS PAREDES
           ----------------------------- */

        if (!clickedSelectable) {
          //console.log("❌ Click fuera, cancelando selección");

          this.resetMaterials();
          this.selecting = false;
          return;
        }

        /* -----------------------------
           CLICK EN PARED VÁLIDA
           ----------------------------- */

        //console.log("✅ Mesh seleccionada:", mesh.name);

        this.targetMesh = mesh;
        this.selecting = false;

        // Restauramos las demás paredes
        this.selectableMeshes.forEach((m) => {
          if (m !== mesh && m.originalMaterial) {
            m.material = m.originalMaterial;
          }
        });

        // Abrimos selector de archivos
        this.fileInput.click();
      }
    });

    /* --------------------------------------------------
       3️⃣ CUANDO EL USUARIO ELIGE UNA IMAGEN
       -------------------------------------------------- */

    this.fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file || !this.targetMesh) return;

      const reader = new FileReader();

      reader.onload = (event) => {
        const img = new Image();

        img.onload = () => {
          // Creamos textura desde la imagen
          const texture = new THREE.Texture(img);
          texture.flipY = false;
          texture.needsUpdate = true;

          // Clonamos material del mesh
          const mat = this.targetMesh.material.clone();
          mat.map = texture;
          mat.needsUpdate = true;

          // Aplicamos nueva textura
          this.targetMesh.material = mat;

          // 🔵 MARCAMOS ESTA MALLA COMO EDITADA
          // Así no volverá a recibir la textura de pregunta
          this.targetMesh.userUploadedTexture = true;

          //console.log("🎨 Textura aplicada a:", this.targetMesh.name);

          this.targetMesh = null;
        };

        img.src = event.target.result;
      };

      reader.readAsDataURL(file);

      // limpiamos input para permitir subir otra imagen después
      this.fileInput.value = "";
    });
  },

  /* --------------------------------------------------
     RESTAURAR MATERIALES ORIGINALES
     -------------------------------------------------- */

  resetMaterials: function () {
    this.selectableMeshes.forEach((m) => {
      if (m.originalMaterial) {
        m.material = m.originalMaterial;
      }
    });
  },
});