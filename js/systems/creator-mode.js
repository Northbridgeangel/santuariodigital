// ==========================
// CREATOR MODE SYSTEM
// ==========================
AFRAME.registerSystem("creator-mode", {
  schema: {},

  init: function () {
    const escenario = window.OpenCentralGlobals.core.escenario;
    this.creatorModeActive = false;
    this.listeners = [];
    this.iconMeshes = null;

    const setupIcons = () => {
      const modelRoot = escenario.getObject3D("mesh");
      if (!modelRoot) return;

      this.iconMeshes = {
        draw: modelRoot.getObjectByName("Icon-Draw"),
        color: modelRoot.getObjectByName("Icon-Colorpicker"),
        eraser: modelRoot.getObjectByName("Icon-Eraser"),
        plane: modelRoot.getObjectByName("Icon-PlaneSelector"),
      };

      // Inicialmente invisibles
      Object.values(this.iconMeshes).forEach((mesh) => {
        if (mesh) mesh.visible = false;
        if (mesh) mesh.userData.active = false; // marca de toggle
      });

      console.log("🎨 Iconos Creator Mode inicializados");
    };

    if (escenario.getObject3D("mesh")) setupIcons();
    escenario.addEventListener("model-loaded", setupIcons);

    const sceneEl = this.el.sceneEl;
    sceneEl.addEventListener("mesh-clicked", (evt) => {
      const mesh = evt.detail.mesh;

      if (!mesh) return;

      if (mesh.name === "Btn-creator-menú_Mesh_1") {
        // Solo activa/desactiva Creator Mode (iconos visibles/invisibles)
        this.creatorModeActive = !this.creatorModeActive;
        console.log(
          `🎮 Creator Mode: ${this.creatorModeActive ? "ON" : "OFF"}`,
        );
        if (this.iconMeshes) {
          Object.values(this.iconMeshes).forEach((m) => {
            if (m) m.visible = this.creatorModeActive;
          });
        }

        // 🔹 Si se apaga Creator Mode, desactiva pointer-draw
        if (!this.creatorModeActive && this.iconMeshes?.draw) {
          this.iconMeshes.draw.userData.active = false;
          sceneEl.emit("IconDraw-clicked", {
            active: false,
            mesh: this.iconMeshes.draw,
          });
        }
      }

      // 🔹 Solo toggle para Icon-Draw
      if (mesh.name === "Icon-Draw" && this.creatorModeActive) {
        const isActive = !mesh.userData.active;
        mesh.userData.active = isActive;
        sceneEl.emit("IconDraw-clicked", { active: isActive, mesh });
      }

      // 🔹 Otros iconos solo desactivan pointer-draw
      if (
        mesh.name !== "Icon-Draw" &&
        mesh.name !== "Btn-creator-menú_Mesh_1"
      ) {
        if (this.iconMeshes?.draw?.userData.active) {
          this.iconMeshes.draw.userData.active = false;
          sceneEl.emit("IconDraw-clicked", {
            active: false,
            mesh: this.iconMeshes.draw,
          });
        }
      }
    });
  },

  registerListener: function (fn) {
    this.listeners.push(fn);
  },

  isActive: function () {
    return this.creatorModeActive;
  },
});


// ==========================
// POINTER DRAW COMPONENT
// ==========================
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

    // Añadir DrawGroup al modelo
    const addDrawGroup = () => {
      const modelRoot = escenario.getObject3D("mesh");
      if (!modelRoot) return;
      modelRoot.add(this.drawGroup);
    };
    if (escenario.getObject3D("mesh")) addDrawGroup();
    escenario.addEventListener("model-loaded", addDrawGroup);

    // 🔹 Solo se activa/desactiva desde IconDraw-clicked
    sceneEl.addEventListener("IconDraw-clicked", (evt) => {
      this.data.enabled = evt.detail.active;
      this.isPointerDown = evt.detail.active;
    });

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

    // Limpiar dibujo
    window.clearDrawing = () => {
      this.drawPoints = [];
      if (this.drawLine) {
        this.drawGroup.remove(this.drawLine);
        this.drawLine = null;
      }
    };

    // Eventos pointer
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const onPointerDown = (e) => {
      if (this.data.enabled) this.isPointerDown = true;
    };
    const onPointerUp = (e) => {
      this.isPointerDown = false;
    };
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

    sceneEl.addEventListener(
      "renderstart",
      () => {
        sceneEl.canvas.addEventListener("pointerdown", onPointerDown);
        sceneEl.canvas.addEventListener("pointerup", onPointerUp);
        sceneEl.canvas.addEventListener("pointermove", onPointerMove);
      },
      { once: true },
    );
  },
});