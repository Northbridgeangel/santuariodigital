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

  enableAR() {
    // 🧠 DETECCIÓN XR SESSION
    const renderer = this.scene.renderer;
    const session = renderer?.xr?.getSession();

    // Si hay sesión XR activa, asumimos que es un headset AR/VR. Si no, fallback a cámara.
    if (session) {
      enableARHeadset(this);
    } else {
      enableCameraAR(this);
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

function enableCameraAR(component) {
  console.log("📷 Activando AR");

  const scene = component.el.sceneEl;
  const OG = window.OpenCentralGlobals;

  if (!OG || !OG.core || !scene) {
    console.warn("⚠️ OpenCentralGlobals no disponible");
    return;
  }

  component.scene = scene;

  // Detectamos si sky es string o HTMLElement
  let sky = null;

  if (typeof component.data.sky === "string") {
    sky = OG.core.sceneEl.querySelector(component.data.sky);
  } else if (component.data.sky instanceof HTMLElement) {
    sky = component.data.sky;
  }

  component.sky = sky;

  if (component.sky) component.sky.object3D.visible = false;

  try {
    navigator.mediaDevices
      .getUserMedia({
        video: { facingMode: "environment" },
      })
      .then((stream) => {
        component.stream = stream;

        const video = document.createElement("video");
        video.setAttribute("autoplay", "");
        video.setAttribute("playsinline", "");
        video.srcObject = stream;

        component.video = video;

        return video.play().then(() => {
          const texture = new THREE.VideoTexture(video);
          scene.object3D.background = texture;

          console.log("📷 Cámara activada");
        });
      });
  } catch (e) {
    console.error("❌ Error activando cámara", e);
  }
}

async function enableARHeadset(component) {
  console.log("🔄 Portal AR toggle ON → FORCED XR TRANSITION");

  const scene = component.el.sceneEl;
  const renderer = scene.renderer;
  let session = renderer?.xr?.getSession();

  if (session) {
    const mode = session.environmentBlendMode;

    console.log("🥽 XR session detected:", mode);

    console.log("🚪 Ending current XR session...");
    await session.end();

    session = null;
  }

  try {
    console.log("📡 Requesting immersive-ar session...");

    const newSession = await navigator.xr.requestSession("immersive-ar");

    await renderer.xr.setSession(newSession);

    console.log("🟢 AR SESSION ACTIVE (portal success)");

    component.xrState = "AR_XR";

    if (component.sky) component.sky.object3D.visible = false;

    // 🟢 UI FEEDBACK (AQUÍ LO IMPORTANTE)
    showXRTransitionBanner("🟢 AR SESSION ACTIVE · " + getDeviceName());

    return;
  } catch (e) {
    console.log("⚠️ AR not supported → fallback browser camera");

    showXRTransitionBanner("⚠️ XR AR NOT AVAILABLE · " + getDeviceName());

    enableCameraAR(component);
  }
}

function showXRTransitionBanner(text) {
  let el = document.createElement("div");

  el.style.position = "fixed";
  el.style.top = "20px";
  el.style.left = "50%";
  el.style.transform = "translateX(-50%)";
  el.style.padding = "12px 18px";
  el.style.background = "rgba(0,0,0,0.75)";
  el.style.color = "white";
  el.style.fontSize = "14px";
  el.style.borderRadius = "10px";
  el.style.zIndex = "999999";
  el.style.fontFamily = "sans-serif";
  el.style.textAlign = "center";
  el.style.backdropFilter = "blur(6px)";

  el.innerText = text;

  document.body.appendChild(el);

  setTimeout(() => {
    el.remove();
  }, 10000);
}

function getDeviceName() {
  const ua = navigator.userAgent;

  // 🥽 Meta Quest family
  if (ua.includes("Quest 3")) return "Meta Quest 3";
  if (ua.includes("Quest 2")) return "Meta Quest 2";
  if (ua.includes("Quest")) return "Meta Quest (unknown version)";

  // 🥽 Oculus legacy
  if (ua.includes("Oculus")) return "Oculus Device";

  // 📱 mobile
  if (ua.includes("iPhone")) return "iPhone";
  if (ua.includes("Android")) return "Android Device";

  return "Unknown XR Device";
}
