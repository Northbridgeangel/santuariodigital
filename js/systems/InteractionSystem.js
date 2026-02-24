// InteractionSystem.js
AFRAME.registerSystem("InteractionSystem", {
  schema: { maxDistance: { default: 5 } },

  init: function () {
    const sceneEl = this.el.sceneEl;
    const { escenario, interactiveMeshes: globalMeshes } =
      window.OpenCentralGlobals.core;

    if (!escenario || !sceneEl) {
      //console.error("❌ OpenCentralGlobals no cargado correctamente");
      return;
    }

    const interactiveMeshes = [];
    let modelLoaded = false;


    // ================================
    // ✏️ D1. DRAW STATE  - Bloque drawstate del init es paso 1
    // ================================
    this.isPointerDown = false;          // 🔹 Activación de dibujo
    this.drawPoints = [];
    this.drawLine = null;
    this.drawGroup = new THREE.Group();  // 🔹 Grupo que contendrá las líneas
    this.drawGroup.name = "DrawGroup";

    this.addDrawPoint = (point) => {     // 🔹 Función para agregar puntos y dibujar la línea
      this.drawPoints.push(point.clone());
      if (this.drawPoints.length < 2) return;

      if (this.drawLine) this.drawGroup.remove(this.drawLine);

      const geometry = new THREE.BufferGeometry().setFromPoints(this.drawPoints);
      const material = new THREE.LineBasicMaterial({ color: 0xff0000 });
      this.drawLine = new THREE.Line(geometry, material);
      this.drawGroup.add(this.drawLine);
    };

    window.clearDrawing = () => {        // 🔹 Función global para limpiar el dibujo
      this.drawPoints = [];
      if (this.drawLine) {
        this.drawGroup.remove(this.drawLine);
        this.drawLine = null;
      }
    };



    // -------------------------------------------------
    // Modelo cargado
    // -------------------------------------------------
    escenario.addEventListener("model-loaded", (ev) => {
      const modelRoot = escenario.getObject3D("mesh") || ev.detail.model;
      if (!modelRoot) return console.error("❌ No se encontró modelRoot");

      //console.log("✅ InteractionSystem activo — esperando interacciones.");

      modelRoot.add(this.drawGroup); // 🔥 D2. Añadimos grupo dibujo al modelo es paso 2

      modelRoot.traverse((child) => {
        if (!child.isMesh || child.name.startsWith("Escena")) return;

        if (/transparentfloor|floor|ground/i.test(child.name)) {
          //console.log(`🟡 Ignorando mesh del suelo: ${child.name}`);
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

      // 🔥 Emitimos evento global de inicialización
      sceneEl.emit("open-globals-ready", {
        meshes: globalMeshes,
      });

      //console.log("🚀 OpenCentralGlobals listo — evento emitido");
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

      // ================================
      // 🔹 D3.1.POINTERWODN. DIBUJO: si el pointer está presionado y creator mode activo. Paso 3.1.
      if (this.creatorModeActive && this.isPointerDown) {
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const pos3D = new THREE.Vector3();
        raycaster.ray.intersectPlane(plane, pos3D);
        if (pos3D) this.addDrawPoint(pos3D);
        return; // mientras dibuja, no hacemos hover
      }
      // -----------------------------

      const hit = raycaster.intersectObjects(interactiveMeshes, true)[0];
      const mesh = hit?.object || null;

      mesh ? handleHover(mesh) : handleHoverExit();
      sceneEl.selectedMeshUnderPointer = mesh;
    };

    const onPointerDown = (e) => {
      pointerDownPos.x = e.clientX;
      pointerDownPos.y = e.clientY;

      // 🔹D3.2.POINTERWODN Activar dibujo en el (e) es el paso 3.2.
      // 🔹 Comprobamos si se ha pulsado el botón creator
      const rect = sceneEl.canvas.getBoundingClientRect();
      const pointerVec = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointerVec, sceneEl.camera);

      const hitButton = raycaster.intersectObjects(interactiveMeshes, true)[0]
        ?.object;
      if (hitButton?.name === "Btn-creator-menú_Mesh_1") {
        this.creatorModeActive = !this.creatorModeActive;
        console.log(
          `🎮 Creator mode: ${this.creatorModeActive ? "ON" : "OFF"}`,
        );
        return; // solo alternamos modo, no activamos dibujo ni hover
      }

      // 🔹 Activamos dibujo solo si estamos en creator mode
      if (this.creatorModeActive) {
        this.isPointerDown = true; 
      }
      // 🔹Fin de D3.2.---------------------------------------------------
    };

    const onPointerUp = (e) => {
      this.isPointerDown = false; // 🔹D4.1.POINTERUP. Apagar dibujo siempre que se suelte en el (e) es el paso 4.1.

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
      console.log(`🔴 CLICK REAL: ${mesh.name || "NINGUNO"}`);
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
