// ==========================
// CREATOR MODE
// ==========================
// pointer-draw.js

AFRAME.registerComponent("pointer-draw", {
  schema: { enabled: { type: "boolean", default: false } },

  init: function () {
    const sceneEl = this.el.sceneEl;
    const escenario = window.OpenCentralGlobals.core.escenario;

    // ================================
    // ✏️ D1. DRAW STATE  - Bloque drawstate del init es paso 1
    // ================================
    this.isPointerDown = false; // 🔹 Activación de dibujo
    this.drawPoints = [];
    this.drawLine = null;
    this.drawGroup = new THREE.Group(); // 🔹 Grupo que contendrá las líneas
    this.drawGroup.name = "DrawGroup";

    // Función para añadir puntos
    this.addDrawPoint = (point) => {
      this.drawPoints.push(point.clone());
      if (this.drawPoints.length < 2) return;

      if (this.drawLine) this.drawGroup.remove(this.drawLine);

      const geometry = new THREE.BufferGeometry().setFromPoints(
        this.drawPoints,
      );
      const material = new THREE.LineBasicMaterial({ color: 0xff0000 });
      this.drawLine = new THREE.Line(geometry, material);
      this.drawGroup.add(this.drawLine);
    };

    window.clearDrawing = () => {
      // 🔹 Función global para limpiar el dibujo
      this.drawPoints = [];
      if (this.drawLine) {
        this.drawGroup.remove(this.drawLine);
        this.drawLine = null;
      }
    };

    // ================================
    // D2. Añadir DrawGroup al modelo
    // ================================
    const addDrawGroup = () => {
      const modelRoot = escenario.getObject3D("mesh");
      if (!modelRoot) return console.warn("⚠️ Modelo aún no listo");
      modelRoot.add(this.drawGroup);
      console.log("✅ DrawGroup añadido al modelo"); // 🔥 D2. Añadimos grupo dibujo al modelo es paso 2 ->modelRoot.add(this.drawGroup);
    };

    if (escenario.getObject3D("mesh")) addDrawGroup();
    escenario.addEventListener("model-loaded", addDrawGroup);

    // ================================
    // D3. ACTIVAR DIBUJO CON CREATOR MODE
    // ================================
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const onPointerDownCheck = (e) => {
      if (!sceneEl.canvas || !sceneEl.camera) return;

      const rect = sceneEl.canvas.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, sceneEl.camera);

      // Detectar botón Creator Mode
      const hitButton = raycaster.intersectObjects(
        window.OpenCentralGlobals.core.interactiveMeshes,
        true,
      )[0]?.object;

      if (hitButton?.name === "Btn-creator-menú_Mesh_1") {
        // Toggle global Creator Mode
        window.OpenCentralGlobals.core.creatorModeActive =
          !window.OpenCentralGlobals.core.creatorModeActive;

        console.log(
          `🎮 Creator mode: ${window.OpenCentralGlobals.core.creatorModeActive ? "ON" : "OFF"}`,
        );

        // Habilitar o deshabilitar el componente pointer-draw según estado
        this.data.enabled = window.OpenCentralGlobals.core.creatorModeActive;
      }

      // Si Creator Mode activo, permitimos dibujo
      if (window.OpenCentralGlobals.core.creatorModeActive) {
        this.isPointerDown = true;
      }
    };

    // Escuchar pointerdown global
    sceneEl.canvas.addEventListener("pointerdown", onPointerDownCheck);

    // ================================
    // D4. EVENTOS POINTER (dibujar)
    // ================================
    const attachPointerEvents = () => {
      if (!sceneEl.canvas || !sceneEl.camera) return;

      const raycaster = new THREE.Raycaster();
      const pointer = new THREE.Vector2();

      // D4.1 Dibujar si pointerDown
      const onPointerMove = (e) => {
        if (!this.data.enabled || !this.isPointerDown) return;

        const rect = sceneEl.canvas.getBoundingClientRect();
        pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(pointer, sceneEl.camera);

        const pos3D = new THREE.Vector3();
        raycaster.ray.intersectPlane(
          new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
          pos3D,
        );

        if (pos3D) this.addDrawPoint(pos3D);
      };

      // D4.2 Activar dibujo
      const onPointerDown = () => {
        if (!this.data.enabled) return;
        this.isPointerDown = true;
      };

      // D4.3 Apagar dibujo
      const onPointerUp = () => {
        this.isPointerDown = false;
      };

      sceneEl.canvas.addEventListener("pointermove", onPointerMove);
      sceneEl.canvas.addEventListener("pointerdown", onPointerDown);
      sceneEl.canvas.addEventListener("pointerup", onPointerUp);

      console.log("✅ Eventos pointer-draw añadidos al canvas");
    };

    // Esperamos a que canvas y cámara existan
    sceneEl.addEventListener("renderstart", attachPointerEvents, {
      once: true,
    });

    // ================================
    // D5/D6. VR: tick de dibujo y trigger real
    // ================================
    this.tick = () => {
      if (!sceneEl.is("vr-mode")) return;

      ["left", "right"].forEach((hand) => {
        const controllerEl = document.querySelector(`#controller-${hand}`);
        if (!controllerEl) return;

        const comp = controllerEl.components.raycaster;
        if (!comp || !comp.raycaster) return;

        const ray = comp.raycaster;
        ray.far = 10; // límite de distancia para dibujo

        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const pos3D = new THREE.Vector3();

        // 🔹 D6: Leer estado real del trigger (botón 0) desde vr-controls.js
        const VRHold = sceneEl.VRButtonState?.[hand]?.[0]?.VRHold;
        this.isPointerDown = this.data.enabled && VRHold;

        // 🔹 Si estamos dibujando:
        if (this.isPointerDown) {
          ray.enabled = false; // desactivamos raycaster de esta mano
          ray.el.object3D.visible = false; // ocultamos visualmente el rayo

          ray.ray.intersectPlane(plane, pos3D);
          if (pos3D) this.addDrawPoint(pos3D);
        } else {
          // 🔹 Hover normal: raycaster activo
          ray.enabled = true;
          ray.el.object3D.visible = true;

          const hit = ray.intersectObjects(
            window.OpenCentralGlobals.core.interactiveMeshes,
            true,
          )[0];
          sceneEl.selectedMeshUnderPointer = hit?.object || null;
        }
      });
    };
  },
});
