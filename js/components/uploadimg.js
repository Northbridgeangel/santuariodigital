/* ==========================
UPLOAD IMG COMPONENT 
========================== */

AFRAME.registerComponent("upload-wall-texture", {
  schema: {
    highlightColor: { type: "color", default: "#00ff00" }, // color de highlight
  },

  init: function () {
    const sceneEl = this.el;

    this.escenario = window.OpenCentralGlobals?.core?.escenario || null;
    this.targetMesh = null;
    this.mode = "idle"; // idle | selecting | uploading
    this.highlighted = null;

    // input oculto
    this.fileInput = document.createElement("input");
    this.fileInput.type = "file";
    this.fileInput.accept = "image/png, image/jpeg";
    this.fileInput.style.display = "none";
    document.body.appendChild(this.fileInput);

    // intentar conectar escenario ya cargado
    const tryGetEscenario = () => {
      const esc = window.OpenCentralGlobals?.core?.escenario;
      if (esc) {
        this.escenario = esc;
        console.log("🌍 Escenario conectado");
        return true;
      }
      return false;
    };

    if (!tryGetEscenario()) {
      sceneEl.addEventListener("open-globals-ready", () => tryGetEscenario());
    }

    // raycast para highlight
    sceneEl.addEventListener("raycaster-intersection", (evt) => {
      if (this.mode !== "selecting") return;

      const intersection = evt.detail?.els?.[0];
      if (!intersection) return;

      const mesh = intersection.object3D;

      if (!mesh.isMesh || mesh.name.includes("Btn-upload-img")) return;

      // quitar highlight anterior
      if (this.highlighted && this.highlighted !== mesh) {
        this.highlighted.material.emissive = new THREE.Color(0x000000);
      }

      // aplicar highlight
      mesh.material.emissive = new THREE.Color(this.data.highlightColor);
      this.highlighted = mesh;
    });

    sceneEl.addEventListener("raycaster-intersection-cleared", (evt) => {
      if (this.highlighted) {
        this.highlighted.material.emissive = new THREE.Color(0x000000);
        this.highlighted = null;
      }
    });

    // click en escena
    sceneEl.addEventListener("click", (evt) => {
      const intersection = evt.detail?.intersection;
      if (!intersection) return;

      let mesh = intersection.object;

      // 1️⃣ Btn-upload-img
      while (mesh) {
        if (
          mesh.name &&
          mesh.name.includes("Btn-upload-img") &&
          this.mode === "idle"
        ) {
          console.log("🔴 CLICK REAL: Btn-upload-img");
          this.mode = "selecting";
          return;
        }

        // 2️⃣ seleccionar superficie
        if (
          this.mode === "selecting" &&
          mesh.isMesh &&
          !mesh.name.includes("Btn-upload-img")
        ) {
          this.targetMesh = mesh;
          console.log("🎯 Mesh seleccionada:", mesh.name);
          this.mode = "uploading";
          this.fileInput.click();
          return;
        }

        mesh = mesh.parent;
      }
    });

    // subida de archivo
    this.fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) {
        this.mode = "idle";
        return;
      }

      console.log("📁 Imagen elegida:", file.name);

      const reader = new FileReader();
      reader.onload = (event) => {
        this.applyTexture(event.target.result);
        this.fileInput.value = "";
        this.mode = "idle";
        this.clearHighlight();
      };
      reader.readAsDataURL(file);
    });
  },

  applyTexture: function (imgSrc) {
    if (!this.targetMesh) return;

    const img = new Image();
    img.onload = () => {
      const texture = new THREE.Texture(img);
      texture.needsUpdate = true;
      texture.flipY = false;

      const mesh = this.targetMesh;

      console.log("🧱 Aplicando textura a:", mesh.name);

      // clonar material para no afectar otros objetos
      mesh.material = mesh.material.clone();
      mesh.material.map = texture;
      mesh.material.needsUpdate = true;

      this.targetMesh = null;
    };
    img.src = imgSrc;
  },

  clearHighlight: function () {
    if (this.highlighted) {
      this.highlighted.material.emissive = new THREE.Color(0x000000);
      this.highlighted = null;
    }
  },
});