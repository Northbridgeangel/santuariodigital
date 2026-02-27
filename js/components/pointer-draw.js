// ==========================
// CREATOR MODE SYSTEM
// ==========================
AFRAME.registerSystem("creator-mode", {
  schema: {},

  init: function () {
    const escenario = window.OpenCentralGlobals.core.escenario;

    this.creatorModeActive = false;
    this.listeners = [];

    this.iconMeshes = null; // se rellenará cuando el modelo cargue

    const setupIcons = () => {
      const modelRoot = escenario.getObject3D("mesh");
      if (!modelRoot) return;

     this.iconMeshes = {
       draw: modelRoot.getObjectByName("Icon-Draw"),
       color: modelRoot.getObjectByName("Icon-Colorpicker"),
       eraser: modelRoot.getObjectByName("Icon-Eraser"),
       plane: modelRoot.getObjectByName("Icon-PlaneSelector"),
     };
      //console.log(modelRoot.children.map((c) => c.name));

      // 🔹 Inicialmente invisibles
      Object.values(this.iconMeshes).forEach((mesh) => {
        if (mesh) mesh.visible = false;
      });

      console.log("🎨 Iconos Creator Mode inicializados");
    };

    // Si ya está cargado
    if (escenario.getObject3D("mesh")) setupIcons();
    escenario.addEventListener("model-loaded", setupIcons);
  },

  // 🔹 Toggle Creator Mode
  toggle: function () {
    this.creatorModeActive = !this.creatorModeActive;

    console.log(`🎮 Creator Mode: ${this.creatorModeActive ? "ON" : "OFF"}`);

    // Mostrar / ocultar iconos
    if (this.iconMeshes) {
      Object.values(this.iconMeshes).forEach((mesh) => {
        if (mesh) mesh.visible = this.creatorModeActive;
      });
    }

    // Notificar listeners
    this.listeners.forEach((fn) => fn(this.creatorModeActive));
  },

  registerListener: function (fn) {
    this.listeners.push(fn);
  },

  isActive: function () {
    return this.creatorModeActive;
  },
});


AFRAME.registerComponent("pointer-draw", {
  schema: { enabled: { type: "boolean", default: false } },

  init: function () {
    const sceneEl = this.el.sceneEl;
    const escenario = window.OpenCentralGlobals.core.escenario;

    this.isPointerDown = false; 
    this.drawPoints = [];
    this.drawLine = null;
    this.drawGroup = new THREE.Group();
    this.drawGroup.name = "DrawGroup";

    // ====================================
    // FUNCIÓN PARA AÑADIR PUNTOS
    // ====================================
    this.addDrawPoint = (point) => {
      this.drawPoints.push(point.clone());
      if (this.drawPoints.length < 2) return;

      if (this.drawLine) this.drawGroup.remove(this.drawLine);

      const geometry = new THREE.BufferGeometry().setFromPoints(this.drawPoints);
      const material = new THREE.LineBasicMaterial({ color: 0xff0000 });
      this.drawLine = new THREE.Line(geometry, material);
      this.drawGroup.add(this.drawLine);
    };

    window.clearDrawing = () => {
      this.drawPoints = [];
      if (this.drawLine) {
        this.drawGroup.remove(this.drawLine);
        this.drawLine = null;
      }
    };

    // ====================================
    // AÑADIR DrawGroup AL MODELO
    // ====================================
    const addDrawGroup = () => {
      const modelRoot = escenario.getObject3D("mesh");
      if (!modelRoot) return console.warn("⚠️ Modelo aún no listo");
      modelRoot.add(this.drawGroup);
      console.log("✅ DrawGroup añadido al modelo");
    };

    if (escenario.getObject3D("mesh")) addDrawGroup();
    escenario.addEventListener("model-loaded", addDrawGroup);

    // ====================================
    // ACCESO AL SYSTEM
    // ====================================
    const creatorSystem = sceneEl.systems["creator-mode"];
    // Registrar listener para actualizar componente al cambiar Creator Mode
    creatorSystem.registerListener((active) => {
      this.data.enabled = active;
    });

    // ====================================
    // DETECCIÓN BOTÓN CREATOR (mouse / pointer)
    // ====================================
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const onPointerDownCheck = (e) => {
      if (!sceneEl.canvas || !sceneEl.camera) return;

      const rect = sceneEl.canvas.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, sceneEl.camera);

      const hitButton = raycaster.intersectObjects(
        window.OpenCentralGlobals.core.interactiveMeshes,
        true
      )[0]?.object;

      if (hitButton?.name === "Btn-creator-menú_Mesh_1") {
        creatorSystem.toggle();
      }

      if (creatorSystem.isActive()) this.isPointerDown = true;
    };

    sceneEl.canvas.addEventListener("pointerdown", onPointerDownCheck);

    // ====================================
    // EVENTOS POINTER PARA DIBUJO
    // ====================================
    const attachPointerEvents = () => {
      if (!sceneEl.canvas || !sceneEl.camera) return;

      const onPointerMove = (e) => {
        if (!this.data.enabled || !this.isPointerDown) return;

        const rect = sceneEl.canvas.getBoundingClientRect();
        pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(pointer, sceneEl.camera);

        const pos3D = new THREE.Vector3();
        raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),0), pos3D);

        if (pos3D) this.addDrawPoint(pos3D);
      };

      const onPointerUp = () => { this.isPointerDown = false; };

      sceneEl.canvas.addEventListener("pointermove", onPointerMove);
      sceneEl.canvas.addEventListener("pointerup", onPointerUp);

      console.log("✅ Eventos pointer-draw añadidos al canvas");
    };

    sceneEl.addEventListener("renderstart", attachPointerEvents, { once: true });

    // ====================================
    // TICK VR
    // ====================================
    this.tick = () => {
      if (!sceneEl.is("vr-mode") || !sceneEl.VRButtonState) return;

      ["left","right"].forEach(hand => {
        const controllerEl = document.querySelector(`#controller-${hand}`);
        if (!controllerEl) return;
        const comp = controllerEl.components.raycaster;
        if (!comp || !comp.raycaster) return;

        const VRHold = sceneEl.VRButtonState?.[hand]?.[0]?.VRHold;
        const drawActive = this.data.enabled && VRHold;

        if (drawActive) {
          const origin = controllerEl.object3D.getWorldPosition(new THREE.Vector3());
          const dir = controllerEl.object3D.getWorldDirection(new THREE.Vector3());
          const pos3D = origin.clone().add(dir.multiplyScalar(0.1));
          this.addDrawPoint(pos3D);
          comp.el.components.raycaster.data.enabled = false;
        } else {
          comp.el.components.raycaster.data.enabled = true;
        }
      });
    };
  },
});