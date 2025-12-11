// click-hover-detector.js
AFRAME.registerComponent("click-hover-detector", {
  schema: {
    maxDistance: { default: 5 },
  },

  init: function () {
    const sceneEl = this.el.sceneEl;
    const { escenario } = OpenCentralGlobals;

    if (!escenario || !sceneEl) {
      console.error("❌ OpenCentralGlobals no cargado correctamente");
      return;
    }

    escenario.addEventListener("model-loaded", (ev) => {
      const modelRoot = escenario.getObject3D("mesh") || ev.detail.model;
      if (!modelRoot) return console.error("❌ No se encontró modelRoot");

      console.log("✅ ClickHoverDetector activo — esperando interacciones.");

      // 🔹 Recoger meshes interactivos
      const interactiveMeshes = [];
      modelRoot.traverse((child) => {
        if (!child.isMesh || child.name.startsWith("Escena")) return;

        if (/transparentfloor|floor|ground/i.test(child.name)) {
          console.log(`🟡 Ignorando mesh del suelo: ${child.name}`);
          child.userData.clickable = false;
          return;
        }

        child.originalMaterial = child.material.clone();
        interactiveMeshes.push(child);
      });

      if (interactiveMeshes.length === 0) {
        console.warn("⚠️ No se encontraron meshes interactivos.");
      } else {
        console.log(
          `🎨 Meshes detectados (${interactiveMeshes.length}):`,
          interactiveMeshes.map((m) => m.name)
        );
      }

      // ==================================================
      // 🔹 Raycaster único
      // ==================================================
      const raycaster = new THREE.Raycaster();
      const pointer = new THREE.Vector2();
      let pointerDownPos = { x: 0, y: 0 };
      const CLICK_THRESHOLD = 5;

      // ==================================================
      // 🔹 Función generalizada de Raycast + Hover
      // ==================================================
      const checkHover = (origin, direction) => {
        if (!origin || !direction) return;

        raycaster.far = this.data.maxDistance; // ← alcance centralizado
        raycaster.set(origin, direction);

        const hit = raycaster.intersectObjects(interactiveMeshes, true)[0];
        const mesh = hit?.object || null;

        if (mesh) {
          handleHover(mesh);
          sceneEl.selectedMeshUnderPointer = mesh;
        } else {
          handleHoverExit();
          sceneEl.selectedMeshUnderPointer = null;
        }
      };

      // ==================================================
      // 🔹 Desktop / Mobile: raycast desde cámara + pointer
      // ==================================================
      const pointerRaycast = (event) => {
        if (!sceneEl.camera) return;

        const rect = sceneEl.canvas.getBoundingClientRect();
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(pointer, sceneEl.camera);
        raycaster.far = this.data.maxDistance;

        const hit = raycaster.intersectObjects(interactiveMeshes, true)[0];
        const mesh = hit?.object || null;

        mesh ? handleHover(mesh) : handleHoverExit();
      };

      const onPointerDown = (e) => {
        pointerDownPos.x = e.clientX;
        pointerDownPos.y = e.clientY;
      };

      const onPointerUp = (e) => {
        const dx = Math.abs(e.clientX - pointerDownPos.x);
        const dy = Math.abs(e.clientY - pointerDownPos.y);
        if (dx > CLICK_THRESHOLD || dy > CLICK_THRESHOLD) return;

        if (!sceneEl.camera) return;

        const rect = sceneEl.canvas.getBoundingClientRect();
        pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(pointer, sceneEl.camera);
        raycaster.far = this.data.maxDistance;

        const hit = raycaster.intersectObjects(interactiveMeshes, true)[0];
        const mesh = hit?.object || null;

        if (mesh) {
          console.log(`🔴 CLICK REAL: ${mesh.name}`);
          handleClick(mesh);
        }
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

      // ==================================================
      // 🔹 VR Tick: Raycast desde mando izquierdo y derecho
      // ==================================================
      this.tick = () => {
        if (!sceneEl.is("vr-mode")) return;

        ["left", "right"].forEach((hand) => {
          const controllerEl = document.querySelector(`#${hand}-controller`);
          if (!controllerEl) return;

          const comp = controllerEl.components.raycaster;
          if (!comp || !comp.raycaster) return;

          const ray = comp.raycaster;

          // Ajustamos distancia máxima
          ray.far = this.data.maxDistance;

          // Pasamos el raycaster REAL al detector
          const hit = ray.intersectObjects(interactiveMeshes, true)[0];
          const mesh = hit?.object || null;

          if (mesh) {
            handleHover(mesh);
            sceneEl.selectedMeshUnderPointer = mesh;
          } else {
            handleHoverExit();
            sceneEl.selectedMeshUnderPointer = null;
          }
        });
      };
    });
  },
});
