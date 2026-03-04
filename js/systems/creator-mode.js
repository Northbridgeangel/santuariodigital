/* ========================== */
/* WINDOWS GLOBALS PARA CREATOR MODE */
/* ========================== */
window.DrawingMode = {
  type: "ground", // "ground" = plano suelo 2D, "wall" = 2D pared, "3D" = 3D libre
};

/* ========================== */
/* CREATOR MODE SYSTEM */
/* ========================== */
AFRAME.registerSystem("creator-mode", {
  schema: {},
  init: function () {
    const escenario = window.OpenCentralGlobals.core.escenario;
    const sceneEl = this.el.sceneEl;

    this.creatorModeActive = false;
    this.listeners = [];
    this.iconMeshes = null;
    this.creatorMenu = [];
    this.selectedIcon = null;

    const setRayVisible = (visible) => {
      ["right", "left"].forEach((hand) => {
        const ctrl = document.querySelector(`#controller-${hand}`);
        if (!ctrl) return;
        const rayLine = ctrl.getObject3D("line");
        if (rayLine) rayLine.visible = visible;
      });
    };

    const toggleMeshState = (meshes, active) => {
      const meshArray = Array.isArray(meshes) ? meshes : [meshes];
      meshArray.forEach((mesh) => {
        if (!mesh) return;
        mesh.userData.active = active;
        if (active) {
          resaltarMesh(mesh, "click");
          if (window.HoverControl?.clearHoverFor) {
            window.HoverControl.clearHoverFor(mesh);
          }
        } else {
          resetMesh(mesh);
        }
      });
    };

    const updateCreatorUI = () => {
      if (!this.iconMeshes) return;
      const anyIconVisible = Object.values(this.iconMeshes).some((group) =>
        group.some((m) => m && m.visible),
      );

      if (!anyIconVisible && this.selectedIcon) {
        toggleMeshState(this.selectedIcon, false);
        if (this.selectedIcon.some((m) => m.name === "Icon-Draw")) {
          sceneEl.emit("IconDraw-clicked", {
            active: false,
            mesh: this.selectedIcon,
          });
        }
        this.selectedIcon = null;
        setRayVisible(true);
      }

      if (this.selectedIcon?.some((m) => m.name === "Icon-Draw")) {
        setRayVisible(false);
      } else {
        setRayVisible(true);
      }
    };

    const setupIcons = () => {
      const modelRoot = escenario.getObject3D("mesh");
      if (!modelRoot) return;

      this.iconMeshes = {
        draw: [modelRoot.getObjectByName("Icon-Draw")],
        plane: [
          modelRoot.getObjectByName("Icon-PlaneSelector_Mesh"),
          modelRoot.getObjectByName("Icon-PlaneSelector_Mesh_1"),
          modelRoot.getObjectByName("Icon-PlaneSelector_Mesh_2"),
        ],
        color: [
          modelRoot.getObjectByName("Icon-Colorpicker_Mesh"),
          modelRoot.getObjectByName("Icon-Colorpicker_Mesh_1"),
        ],
        eraser: [modelRoot.getObjectByName("Icon-Eraser")],
      };

      Object.values(this.iconMeshes).forEach((group) => {
        group.forEach((m) => {
          if (!m) return;
          m.visible = false;
          m.userData.active = false;
          m.userData.interactable = true;
          window.OpenCentralGlobals.core.interactiveMeshes.push(m);
        });
      });

      this.creatorMenu = Object.values(modelRoot.children).filter((m) =>
        m.name.startsWith("Btn-creator-menú"),
      );
    };

    if (escenario.getObject3D("mesh")) setupIcons();
    escenario.addEventListener("model-loaded", setupIcons);

    sceneEl.addEventListener("mesh-clicked", (evt) => {
      const mesh = evt.detail.mesh;
      if (!mesh) return;

      if (mesh.name.startsWith("Btn-creator-menú")) {
        this.creatorModeActive = !this.creatorModeActive;
        Object.values(this.iconMeshes).forEach((group) =>
          group.forEach((m) => (m.visible = this.creatorModeActive)),
        );
        toggleMeshState(this.creatorMenu, this.creatorModeActive);
        updateCreatorUI();
        return;
      }

      if (
        mesh.name.startsWith("Icon") &&
        Object.values(this.iconMeshes).some((group) =>
          group.some((m) => m.visible),
        )
      ) {
        let iconGroup = null;
        let iconKey = null;
        for (const key in this.iconMeshes) {
          if (this.iconMeshes[key].some((m) => m === mesh)) {
            iconGroup = this.iconMeshes[key];
            iconKey = key;
            break;
          }
        }
        if (!iconGroup) return;

        const drawGroup = this.iconMeshes.draw;
        const planeGroup = this.iconMeshes.plane;
        const drawPlaneGroup = [...drawGroup, ...planeGroup];

        const prevSelected = this.selectedIcon;

        if (iconKey === "draw") {
          const drawActive = drawPlaneGroup.some((m) => m.userData.active);
          if (drawActive) {
            toggleMeshState(drawPlaneGroup, false);
            sceneEl.emit("IconDraw-clicked", {
              active: false,
              mesh: drawPlaneGroup,
            });
            this.selectedIcon = null;
          } else {
            if (prevSelected && prevSelected !== drawPlaneGroup)
              toggleMeshState(prevSelected, false);
            toggleMeshState(drawPlaneGroup, true);
            sceneEl.emit("IconDraw-clicked", {
              active: true,
              mesh: drawPlaneGroup,
            });
            this.selectedIcon = drawPlaneGroup;
          }
          updateCreatorUI();
          return;
        }

        if (iconKey === "plane") {
          if (!drawPlaneGroup.some((m) => m.userData.active)) return;
          toggleMeshState(drawPlaneGroup, true);
          this.selectedIcon = drawPlaneGroup;
          updateCreatorUI();
          sceneEl.emit("IconPlaneSelector-clicked", { mesh: mesh });
          return;
        }

        if (prevSelected && prevSelected !== iconGroup)
          toggleMeshState(prevSelected, false);
        const isActive = !iconGroup.some((m) => m.userData.active);
        toggleMeshState(iconGroup, isActive);
        this.selectedIcon = isActive ? iconGroup : null;
        updateCreatorUI();
        return;
      }
    });

    // ==========================
    // TICK VR (DIBUJO)
    // ==========================
    this.tick = () => {
      if (!this.selectedIcon?.some((m) => m.name === "Icon-Draw")) return;
      const drawSystem = sceneEl.components["pointer-draw"];
      if (!drawSystem) return;

      ["right", "left"].forEach((hand) => {
        const ctrl = document.querySelector(`#controller-${hand}`);
        if (!ctrl || ctrl.hasDrawListener) return;

        ctrl.hasDrawListener = true;
        ctrl.addEventListener("triggerdown", () => {
          if (!drawSystem.data.enabled) return;
          const pos = new THREE.Vector3();
          ctrl.object3D.getWorldPosition(pos);
          drawSystem.addDrawPoint(pos);
        });
      });
    };
  },

  registerListener: function (fn) {
    this.listeners.push(fn);
  },

  isActive: function () {
    return !!this.creatorModeActive;
  },
});

/* ========================== */
/* POINTER DRAW COMPONENT OPTIMIZADO PARA VR + MODO PLANE SELECTOR */
/* ========================== */
AFRAME.registerComponent("pointer-draw", {
  schema: { enabled: { type: "boolean", default: false } },

  init: function () {
    const sceneEl = this.el.sceneEl;
    const escenario = window.OpenCentralGlobals.core.escenario;

    this.isPointerDown = false;
    this.currentPoints = null;
    this.currentLine = null;
    this.currentMesh = null; // mesh actual donde se dibuja
    this.drawGroup = new THREE.Group();
    this.drawGroup.name = "DrawGroup";
    this.handTriggerDown = { right: false, left: false };

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    // -------------------------
    // Añadir DrawGroup al modelo
    // -------------------------
    const addDrawGroup = () => {
      const modelRoot = escenario.getObject3D("mesh");
      if (!modelRoot) return;
      modelRoot.add(this.drawGroup);
    };
    if (escenario.getObject3D("mesh")) addDrawGroup();
    escenario.addEventListener("model-loaded", addDrawGroup);

    // -------------------------
    // Activación desde Creator Mode
    // -------------------------
    sceneEl.addEventListener("IconDraw-clicked", (evt) => {
      this.data.enabled = evt.detail.active;
      this.isPointerDown = false;
      this.currentPoints = null;
      this.currentLine = null;
      this.currentMesh = null;
    });

    // -------------------------
    // Añadir punto al dibujo
    // -------------------------
    this.addDrawPoint = (point, mesh) => {
      // 🔹 Si no hay punto o mesh, finalizamos línea
      if (!point || !mesh) {
        this.currentPoints = null;
        this.currentLine = null;
        this.currentMesh = null;
        return;
      }

      // 🔹 Si cambiamos de mesh, finalizamos línea anterior
      if (this.currentMesh && mesh !== this.currentMesh) {
        this.currentPoints = [];
        this.currentLine = null;
      }

      this.currentMesh = mesh;

      if (!this.currentPoints) {
        this.currentPoints = [];
        this.currentLine = null;
      }

      this.currentPoints.push(point.clone());

      if (this.currentPoints.length < 2) return;

      if (this.currentLine) this.drawGroup.remove(this.currentLine);

      const geometry = new THREE.BufferGeometry().setFromPoints(
        this.currentPoints,
      );
      const material = new THREE.LineBasicMaterial({ color: 0xff0000 });

      this.currentLine = new THREE.Line(geometry, material);
      this.drawGroup.add(this.currentLine);
    };

    // -------------------------
    // Limpiar dibujo
    // -------------------------
    window.clearDrawing = () => {
      this.drawGroup.clear();
      this.currentPoints = null;
      this.currentLine = null;
      this.currentMesh = null;
    };

    // -------------------------
    // Obtener posición según modo y mesh intersectado
    // -------------------------
    this.getDrawPosition = (ctrlOrPointer) => {
      const type = window.DrawingMode.type;
      const pos = new THREE.Vector3();
      let intersectedMesh = null;

      /* ---------- GROUND ---------- */
      if (type === "ground") {
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

        if (ctrlOrPointer.isVector2) {
          raycaster.setFromCamera(ctrlOrPointer, sceneEl.camera);
          raycaster.ray.intersectPlane(plane, pos);
        } else {
          ctrlOrPointer.object3D.getWorldPosition(pos);
        }

        intersectedMesh = escenario.getObject3D("mesh"); // todo el escenario como “mesh”
        return { point: pos, mesh: intersectedMesh };
      }

      /* ---------- WALL / OBJETO AÑADIDO ---------- */
      if (type === "wall") {
        const modelRoot = escenario.getObject3D("mesh");
        if (!modelRoot) return { point: null, mesh: null };

        // 🔹 Cache de meshes válidos
        if (!this._wallMeshes) {
          this._wallMeshes = [];
          modelRoot.traverse((child) => {
            if (!child.isMesh || !child.name) return;
            const name = child.name.toLowerCase();
            if (name.startsWith("walls") || name === "objetoañadido") {
              this._wallMeshes.push(child);
            }
          });
        }

        if (this._wallMeshes.length === 0) return { point: null, mesh: null };

        if (ctrlOrPointer.isVector2) {
          raycaster.setFromCamera(ctrlOrPointer, sceneEl.camera);
        } else {
          const origin = new THREE.Vector3();
          ctrlOrPointer.object3D.getWorldPosition(origin);

          const direction = new THREE.Vector3();
          ctrlOrPointer.object3D.getWorldDirection(direction);

          raycaster.set(origin, direction);
        }

        const intersects = raycaster.intersectObjects(this._wallMeshes, true);
        if (intersects.length > 0) {
          intersectedMesh = intersects[0].object;
          pos.copy(intersects[0].point);
          return { point: pos, mesh: intersectedMesh };
        }

        return { point: null, mesh: null };
      }

      /* ---------- 3D LIBRE ---------- */
      if (type === "3D") {
        if (ctrlOrPointer.isVector2) {
          raycaster.setFromCamera(ctrlOrPointer, sceneEl.camera);
          const distance = 0.2;
          pos
            .copy(raycaster.ray.origin)
            .add(raycaster.ray.direction.clone().multiplyScalar(distance));
        } else {
          const origin = new THREE.Vector3();
          const direction = new THREE.Vector3();
          ctrlOrPointer.object3D.getWorldPosition(origin);
          ctrlOrPointer.object3D.getWorldDirection(direction);
          const distance = 0.2;
          pos.copy(origin).add(direction.multiplyScalar(distance));
        }

        intersectedMesh = escenario.getObject3D("mesh");
        return { point: pos, mesh: intersectedMesh };
      }

      return { point: null, mesh: null };
    };

    // -------------------------
    // DESKTOP POINTER
    // -------------------------
    const onPointerDown = () => {
      if (!this.data.enabled) return;
      this.isPointerDown = true;
      this.currentPoints = [];
      this.currentLine = null;
      this.currentMesh = null;
    };

    const onPointerUp = () => {
      this.isPointerDown = false;
      this.currentPoints = null;
      this.currentLine = null;
      this.currentMesh = null;
    };

    const onPointerMove = (e) => {
      if (!this.data.enabled || !this.isPointerDown) return;

      const rect = sceneEl.canvas.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      pointer.isVector2 = true;

      const { point, mesh } = this.getDrawPosition(pointer);
      this.addDrawPoint(point, mesh);
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

    // -------------------------
    // VR TRIGGERS
    // -------------------------
    ["right", "left"].forEach((hand) => {
      const controller = document.querySelector(`#controller-${hand}`);
      if (!controller) return;

      controller.addEventListener("triggerdown", () => {
        this.handTriggerDown[hand] = true;
        this.currentPoints = [];
        this.currentLine = null;
        this.currentMesh = null;
      });

      controller.addEventListener("triggerup", () => {
        this.handTriggerDown[hand] = false;
        this.currentPoints = null;
        this.currentLine = null;
        this.currentMesh = null;
      });
    });
  },

  tick: function () {
    if (!this.data.enabled) return;

    ["right", "left"].forEach((hand) => {
      if (!this.handTriggerDown[hand]) return;

      const controller = document.querySelector(`#controller-${hand}`);
      if (!controller) return;

      const { point, mesh } = this.getDrawPosition(controller);
      this.addDrawPoint(point, mesh);
    });
  },
});

/* ========================== */
/* PLANE SELECT COMPONENT */
/* ========================== */
AFRAME.registerComponent("plane-selector", {
  init: function () {
    const sceneEl = this.el.sceneEl;

    sceneEl.addEventListener("IconPlaneSelector-clicked", () => {
      if (window.DrawingMode.type === "ground")
        window.DrawingMode.type = "wall";
      else if (window.DrawingMode.type === "wall")
        window.DrawingMode.type = "3D";
      else window.DrawingMode.type = "ground";

      console.log("Modo de dibujo cambiado a:", window.DrawingMode.type);
    });
  },
});
