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

      if (!interactiveMeshes.length)
        console.warn("⚠️ No se encontraron meshes interactivos");

      // 🔹 Raycaster
      const raycaster = new THREE.Raycaster();
      const pointer = new THREE.Vector2();
      let pointerDownPos = { x: 0, y: 0 };
      const CLICK_THRESHOLD = 5;

      // 🔹 Función unificada de raycast + hover
      function checkHover(origin, direction) {
        raycaster.set(origin, direction);
        const intersects = raycaster.intersectObjects(interactiveMeshes, true);
        const mesh = intersects[0]?.object || null;

        if (mesh) {
          handleHover(mesh);
          sceneEl.selectedMeshUnderPointer = mesh;
        } else {
          handleHoverExit();
          sceneEl.selectedMeshUnderPointer = null;
        }
      }

      // 🔹 Desktop / Mobile: raycast desde cámara + pointer
      function pointerRaycast(event) {
        if (!sceneEl.camera) return;
        const rect = sceneEl.canvas.getBoundingClientRect();
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(pointer, sceneEl.camera);
        const intersects = raycaster.intersectObjects(interactiveMeshes, true);
        const mesh = intersects[0]?.object || null;
        if (mesh) handleHover(mesh);
        else handleHoverExit();
      }

      // 🔹 Pointer down/up para Desktop/Mobile
      function onPointerDown(event) {
        pointerDownPos.x = event.clientX;
        pointerDownPos.y = event.clientY;
      }

      function onPointerUp(event) {
        const dx = Math.abs(event.clientX - pointerDownPos.x);
        const dy = Math.abs(event.clientY - pointerDownPos.y);
        if (dx > CLICK_THRESHOLD || dy > CLICK_THRESHOLD) return;

        if (!sceneEl.camera) return;
        const rect = sceneEl.canvas.getBoundingClientRect();
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(pointer, sceneEl.camera);
        const intersects = raycaster.intersectObjects(interactiveMeshes, true);
        const mesh = intersects[0]?.object || null;
        if (mesh) {
          console.log(`🔴 CLICK REAL: ${mesh.name}`); // 🔹 Log del click real
          handleClick(mesh);
        }
      }

      // 🔹 Adjuntar eventos pointer para Desktop/Mobile
      function attachPointerEvents() {
        const attach = () => {
          sceneEl.canvas.addEventListener("pointermove", pointerRaycast);
          sceneEl.canvas.addEventListener("pointerdown", onPointerDown);
          sceneEl.canvas.addEventListener("pointerup", onPointerUp);
        };
        if (!sceneEl.canvas)
          sceneEl.addEventListener("renderstart", attach, { once: true });
        else attach();
      }
      attachPointerEvents();

      // 🔹 Tick para VR: raycast desde controladores
      this.tick = function () {
        if (!sceneEl.is("vr-mode")) return;

        ["left", "right"].forEach((hand) => {
          const controllerEl = document.querySelector(`#${hand}-controller`);
          if (!controllerEl) return;

          const origin = controllerEl.object3D.getWorldPosition(
            new THREE.Vector3()
          );
          const direction = controllerEl.object3D.getWorldDirection(
            new THREE.Vector3()
          );
          checkHover(origin, direction); // calcula intersección hasta maxDistance
        });
      };
    });
  },
});
