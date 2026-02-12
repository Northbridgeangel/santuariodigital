// InteractionSystem.js
AFRAME.registerSystem("InteractionSystem", {
  schema: { maxDistance: { default: 5 } },

  init: function () {
    const sceneEl = this.el.sceneEl;
    const { escenario, interactiveMeshes: globalMeshes } = OpenCentralGlobals;

    if (!escenario || !sceneEl) {
      console.error("❌ OpenCentralGlobals no cargado correctamente");
      return;
    }

    const interactiveMeshes = [];
    let modelLoaded = false;

    // -------------------------------------------------
    // Modelo cargado
    // -------------------------------------------------
    escenario.addEventListener("model-loaded", (ev) => {
      const modelRoot = escenario.getObject3D("mesh") || ev.detail.model;
      if (!modelRoot) return console.error("❌ No se encontró modelRoot");

      console.log("✅ InteractionSystem activo — esperando interacciones.");

      modelRoot.traverse((child) => {
        if (!child.isMesh || child.name.startsWith("Escena")) return;

        if (/transparentfloor|floor|ground/i.test(child.name)) {
          console.log(`🟡 Ignorando mesh del suelo: ${child.name}`);
          child.userData.clickable = false;
          return;
        }

        child.userData.interactable = true; // ← añadimos clase interactable
        child.originalMaterial = child.material.clone(); // backup del material para resetMaterial
        interactiveMeshes.push(child);
        globalMeshes.push(child); // ← Registramos mesh también en OpenCentralGlobals
      });

      if (interactiveMeshes.length === 0)
        console.warn("⚠️ No se encontraron meshes interactivos.");
      else
        console.log(
          `🎨 Meshes detectados (${interactiveMeshes.length}):`,
          interactiveMeshes.map((m) => m.name),
        );

      modelLoaded = true;
    });

    // -------------------------------------------------
    // Eventos pointer (desktop / mobile)
    // -------------------------------------------------
    const pointer = new THREE.Vector2();
    let pointerDownPos = { x: 0, y: 0 };
    const CLICK_THRESHOLD = 5;
    const raycaster = new THREE.Raycaster();

    const pointerRaycast = (event) => {
      if (!sceneEl.camera || !modelLoaded) return;

      const rect = sceneEl.canvas.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, sceneEl.camera);
      raycaster.far = this.data.maxDistance;

      const hit = raycaster.intersectObjects(interactiveMeshes, true)[0];
      const mesh = hit?.object || null;

      mesh ? handleHover(mesh) : handleHoverExit();
      sceneEl.selectedMeshUnderPointer = mesh;
    };

    const onPointerDown = (e) => {
      pointerDownPos.x = e.clientX;
      pointerDownPos.y = e.clientY;
    };

    const onPointerUp = (e) => {
      if (!modelLoaded || !sceneEl.camera) return;

      const dx = Math.abs(e.clientX - pointerDownPos.x);
      const dy = Math.abs(e.clientY - pointerDownPos.y);
      if (dx > CLICK_THRESHOLD || dy > CLICK_THRESHOLD) return;

      const rect = sceneEl.canvas.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, sceneEl.camera);
      raycaster.far = this.data.maxDistance;

      const hit = raycaster.intersectObjects(interactiveMeshes, true)[0];
      const mesh = hit?.object || null;

      if (mesh) handleClick(mesh);
      console.log(`🔴 CLICK REAL: ${mesh.name}`);
    };

    const attachPointerEvents = () => {
      const attach = () => {
        sceneEl.canvas.addEventListener("pointermove", pointerRaycast);
        sceneEl.canvas.addEventListener("pointerdown", onPointerDown);
        sceneEl.canvas.addEventListener("pointerup", onPointerUp);
      };
      if (!sceneEl.canvas)
        sceneEl.addEventListener("renderstart", attach, { once: true });
      else attach();
    };
    attachPointerEvents();

    // -------------------------------------------------
    // Tick VR fuera de model-loaded
    // -------------------------------------------------
    this.tick = () => {
      if (!sceneEl.is("vr-mode") || !modelLoaded) return;

      ["left", "right"].forEach((hand) => {
        const controllerEl = document.querySelector(`#controller-${hand}`);
        if (!controllerEl) return;

        const comp = controllerEl.components.raycaster;
        if (!comp || !comp.raycaster) return;

        const ray = comp.raycaster;
        ray.far = this.data.maxDistance;

        const hit = ray.intersectObjects(interactiveMeshes, true)[0];
        const mesh = hit?.object || null;

        mesh ? handleHover(mesh) : handleHoverExit();
        sceneEl.selectedMeshUnderPointer = mesh;
      });
    };
  },
});
