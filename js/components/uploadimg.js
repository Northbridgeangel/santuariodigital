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

    this.selecting = false;
    this.selectableMeshes = [];
    this.targetMesh = null;

    // NUEVO: textura pendiente
    this.pendingTexture = null;

    /* -----------------------------
       FILE INPUT OCULTO
    ----------------------------- */

    this.fileInput = document.createElement("input");
    this.fileInput.type = "file";
    this.fileInput.accept = "image/*";
    this.fileInput.style.display = "none";
    document.body.appendChild(this.fileInput);

    /* -----------------------------
       TEXTURA DE PREGUNTA
    ----------------------------- */

    const loader = new THREE.TextureLoader();
    const questionTexture = loader.load("assets/Textura-de-pregunta.png");
    questionTexture.flipY = false;

    /* -----------------------------
       EVENTO CLICK EN MESH
    ----------------------------- */

    sceneEl.addEventListener("mesh-clicked", (event) => {
      const mesh = event.detail?.mesh;
      if (!mesh) return;

      /* --------------------------------------------------
         1️⃣ CLICK BOTÓN SUBIR IMAGEN
      -------------------------------------------------- */

      if (mesh.name === "Btn-upload-img") {
        this.selecting = true;

        this.selectableMeshes = OG.core.interactiveMeshes.filter(
          (m) => highlightableNames.includes(m.name) && !m.userUploadedTexture,
        );

        this.selectableMeshes.forEach((m) => {
          if (!m.originalMaterial) {
            m.originalMaterial = m.material.clone();
          }

          const newMaterial = m.material.clone();
          newMaterial.map = questionTexture;
          newMaterial.needsUpdate = true;

          m.material = newMaterial;
        });

        // 👇 ABRIMOS SELECTOR EN EL GESTO DEL USUARIO
        this.fileInput.click();

        return;
      }

      /* --------------------------------------------------
         2️⃣ SELECCIÓN DE PARED
      -------------------------------------------------- */

      if (this.selecting) {
        const clickedSelectable = this.selectableMeshes.includes(mesh);

        if (!clickedSelectable) {
          this.resetMaterials();
          this.selecting = false;

          return;
        }

        this.targetMesh = mesh;
        this.selecting = false;

        this.selectableMeshes.forEach((m) => {
          if (m !== mesh && m.originalMaterial) {
            m.material = m.originalMaterial;
          }
        });

        /* --------------------------------------------------
           3️⃣ SI YA TENEMOS IMAGEN → APLICAR TEXTURA
        -------------------------------------------------- */

        if (this.pendingTexture) {
          const mat = this.targetMesh.material.clone();

          mat.map = this.pendingTexture;
          mat.needsUpdate = true;

          this.targetMesh.material = mat;

          this.targetMesh.userUploadedTexture = true;

          this.pendingTexture = null;
          this.targetMesh = null;
        }
      }
    });

    /* --------------------------------------------------
       CUANDO EL USUARIO ELIGE IMAGEN
    -------------------------------------------------- */

    this.fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();

      reader.onload = (event) => {
        const img = new Image();

        img.onload = () => {
          const texture = new THREE.Texture(img);

          texture.flipY = false;
          texture.needsUpdate = true;

          // mejora visual
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.anisotropy = 4;

          // guardamos textura pendiente
          this.pendingTexture = texture;
        };

        img.src = event.target.result;
      };

      reader.readAsDataURL(file);

      this.fileInput.value = "";
    });
  },

  /* --------------------------------------------------
     RESTAURAR MATERIALES
  -------------------------------------------------- */

  resetMaterials: function () {
    this.selectableMeshes.forEach((m) => {
      if (m.originalMaterial) {
        m.material = m.originalMaterial;
      }
    });
  },
});
