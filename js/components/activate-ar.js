AFRAME.registerComponent("activate-ar", {
  schema: {
    active: { type: "boolean", default: false },
    sky: { type: "selector", default: "a-sky" },
  },

  init() {
    this.scene = this.el.sceneEl;
    const OG = window.OpenCentralGlobals;

    if (!OG || !OG.core || !this.scene) {
      console.warn("⚠️ OpenCentralGlobals no disponible");
      return;
    }

    this.isAR = this.data.active;
    this.video = null;
    this.stream = null;

    // Detectamos si sky es string o HTMLElement
    if (typeof this.data.sky === "string") {
      this.sky = OG.core.sceneEl.querySelector(this.data.sky);
    } else if (this.data.sky instanceof HTMLElement) {
      this.sky = this.data.sky;
    } else {
      this.sky = null;
    }

    console.log("📷 AR system initialized");
    console.log(
      "🌌 Sky encontrado:",
      this.sky ? this.sky.tagName : "no hay sky",
    );
  },

  toggleAR() {
    this.isAR = !this.isAR;
    console.log("🔄 Portal AR toggle:", this.isAR ? "ON" : "OFF");

    if (this.isAR) this.enableAR();
    else this.disableAR();
  },

  async enableAR() {
    console.log("📷 Activando AR");

    if (this.sky) this.sky.object3D.visible = false;

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      const video = document.createElement("video");
      video.setAttribute("autoplay", "");
      video.setAttribute("playsinline", "");
      video.srcObject = this.stream;
      this.video = video;

      // En móviles: asegurar reproducción
      await video.play();

      const texture = new THREE.VideoTexture(video);
      this.scene.object3D.background = texture;

      console.log("📷 Cámara activada");
    } catch (e) {
      console.error("❌ Error activando cámara", e);
    }
  },

  disableAR() {
    console.log("📷 Desactivando AR");

    if (this.sky) {
      this.sky.object3D.visible = true;
      console.log("🌌 Sky restaurado");
    }

    if (!this.stream) return;

    this.stream.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.video = null;
    this.scene.object3D.background = null;

    console.log("📷 Cámara desactivada");
  },
});
