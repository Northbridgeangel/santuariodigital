// click-hover-detector.js
AFRAME.registerComponent("click-hover-detector", {
  schema: {
    maxDistance: { default: 5 }, // 🔹 Distancia máxima del raycaster
  },

  init: function () {
    const sceneEl = this.el.sceneEl; // A-Frame scene
    const { escenario } = OpenCentralGlobals; // globals de tu proyecto

    if (!escenario || !sceneEl) {
      console.error("❌ OpenCentralGlobals no cargado correctamente");
      return;
    }

    escenario.addEventListener("model-loaded", (ev) => {
      const modelRoot = escenario.getObject3D("mesh") || ev.detail.model;
      if (!modelRoot) {
        console.error("❌ No se encontró modelRoot en #escenario");
        return;
      }

      console.log("✅ ClickHoverDetector activo — esperando interacciones.");

      // 🔹 Recoger todos los meshes interactivos y guardar su material original
      const interactiveMeshes = [];
      modelRoot.traverse((child) => {
        if (child.isMesh && !child.name.startsWith("Escena")) {
          if (
            child.name.toLowerCase().includes("transparentfloor") ||
            child.name.toLowerCase().includes("floor") ||
            child.name.toLowerCase().includes("ground")
          ) {
            console.log(`🟡 Ignorando mesh del suelo: ${child.name}`);
            child.userData.clickable = false;
            return;
          }
          child.originalMaterial = child.material.clone();
          interactiveMeshes.push(child);
        }
      });


      if (interactiveMeshes.length === 0) {
        console.warn(
          "⚠️ No se encontraron meshes interactivos (sin 'Escena')."
        );
      } else {
        console.log(
          `🎨 Meshes detectados (${interactiveMeshes.length}):`,
          interactiveMeshes.map((m) => m.name)
        );
      }

      // 🔹 Raycaster y posición normalizada de pointer
      const raycaster = new THREE.Raycaster();
      const pointer = new THREE.Vector2();
      let pointerDownPos = { x: 0, y: 0 };
      const CLICK_THRESHOLD = 5;

      // 🔹 Hover
      function onPointerMove(event) {
        if (!sceneEl.camera) return;
        const rect = sceneEl.canvas.getBoundingClientRect();
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(pointer, sceneEl.camera);
        const intersects = raycaster.intersectObjects(interactiveMeshes, true);

        if (intersects.length > 0) {
          const mesh = intersects[0].object;
          handleHover(mesh); // disparar hover
          console.log(`🟢 HOVER: ${mesh.name}`);
          sceneEl.selectedMeshUnderPointer = mesh; // 🔹 Actualizamos la referencia global para VR
        } else {
          handleHoverExit(); // reseteo cuando no hay intersección
          sceneEl.selectedMeshUnderPointer = null; // 🔹 Mesh actual bajo el puntero o controlador (VR-controls.js)
        }
      }

      // 🔹 Pointer Down
      function onPointerDown(event) {
        pointerDownPos.x = event.clientX;
        pointerDownPos.y = event.clientY;
      }

      // 🔹 Pointer Up y click real
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

        if (intersects.length > 0) {
          const mesh = intersects[0].object;
          console.log(`🔴 CLICK REAL: ${mesh.name}`);

          // 🔹 Pasamos el mesh clicado a handleClick
          handleClick(mesh);
        }
      }

      // 🔹 Adjuntar eventos pointer
      function attachPointerEvents() {
        const attach = () => {
          sceneEl.canvas.addEventListener("pointermove", onPointerMove);
          sceneEl.canvas.addEventListener("pointerdown", onPointerDown);
          sceneEl.canvas.addEventListener("pointerup", onPointerUp);
        };
        if (!sceneEl.canvas) {
          sceneEl.addEventListener("renderstart", attach, { once: true });
        } else attach();
      }

      attachPointerEvents();
    });
  },
});
