/* ========================== */
/* WINDOWS GLOBALS PARA CREATOR MODE */
/* ========================== */
window.DrawingMode = {
  type: "3D", // "ground" = plano suelo 2D, "wall" = 2D pared, "3D" = 3D libre
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

        // ------------------- DRAW -------------------
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

        // ------------------- PLANE -------------------
        if (iconKey === "plane") {
          if (!drawPlaneGroup.some((m) => m.userData.active)) return;
          toggleMeshState(drawPlaneGroup, true);
          this.selectedIcon = drawPlaneGroup;
          updateCreatorUI();
          sceneEl.emit("IconPlaneSelector-clicked", { mesh: mesh });
          return;
        }

        // ------------------- ERASER -------------------
        if (iconKey === "eraser") {
          const eraserActive = this.iconMeshes.eraser.some(
            (m) => m.userData.active,
          );

          if (eraserActive) {
            toggleMeshState(this.iconMeshes.eraser, false);
            sceneEl.emit("IconErase-clicked", { mesh: mesh, active: false });
            this.selectedIcon = null;
          } else {
            if (prevSelected && prevSelected !== this.iconMeshes.eraser)
              toggleMeshState(prevSelected, false);

            toggleMeshState(this.iconMeshes.eraser, true);
            sceneEl.emit("IconErase-clicked", { mesh: mesh, active: true });
            this.selectedIcon = this.iconMeshes.eraser;
          }
          updateCreatorUI();
          return;
        }

        // ------------------- OTROS ICONOS -------------------
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

/* ==========================
POINTER DRAW COMPONENT OPTIMIZADO PARA VR + MODO PLANE SELECTOR 
========================== */
/* ==========================
POINTER DRAW COMPONENT OPTIMIZADO PARA VR + MODO PLANE SELECTOR
========================== */
AFRAME.registerComponent("pointer-draw", {
  schema: {
    enabled: { type: "boolean", default: false },
  },

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

      const material = new THREE.LineBasicMaterial({
        color: 0xff0000,
      });

      this.currentLine = new THREE.Line(geometry, material);

      /* -------------------------------------------------
      NUEVO BLOQUE
      Guardamos metadata de la línea para poder editar,
      seleccionar o exportar el dibujo más adelante
      ------------------------------------------------- */
      this.currentLine.userData = {
        type: "draw-line",
        points: this.currentPoints.slice(),
        createdAt: Date.now(),
      };

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

            if (
              name.startsWith("walls") ||
              name === "selfnotemesh" ||
              name === "objetoañadido" ||
              name === "mybackground"
            ) {
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

/* ==========================
LINE SELECTOR COMPONENT
- Selecciona varias líneas dibujadas con pointer-draw.

- CLICK: Selecciona y deselecciona la linea.

- DOBLE CLICK: Si la línea ya está seleccionada → se borra.

- Se aplica material seleccionado o el heredado

- Se emite lines-selected para el gizmo (eliminar o transferir)

========================== */

AFRAME.registerComponent("line-selector", {
  schema: {
    enabled: { type: "boolean", default: true },
    threshold: { type: "number", default: 0.005 },
    doubleClickDelay: { type: "number", default: 300 },
  },

  init: function () {
    const sceneEl = this.el.sceneEl;
    const escenario = window.OpenCentralGlobals.core.escenario;

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    this.selectedLines = [];
    this.lastClickTime = 0;

    raycaster.params.Line.threshold = this.data.threshold;

    const getDrawGroup = () => {
      const modelRoot = escenario.getObject3D("mesh");
      if (!modelRoot) return null;
      return modelRoot.getObjectByName("DrawGroup");
    };

    const emitSelection = () => {
      sceneEl.emit("lines-selected", {
        lines: this.selectedLines,
      });
    };

    const selectLine = (line) => {
      if (!line) return;

      if (!this.selectedLines.includes(line)) {
        if (!line.userData.originalColor) {
          line.userData.originalColor = line.material.color.clone();
        }

        this.selectedLines.push(line);
        line.material.color.set(0x00ffff);

        emitSelection();
      }
    };

    const deselectLine = (line) => {
      this.selectedLines = this.selectedLines.filter((l) => l !== line);

      if (line.userData.originalColor) {
        line.material.color.copy(line.userData.originalColor);
      }

      sceneEl.emit("lines-deselected", {
        line: line,
        lines: this.selectedLines,
      });
    };

    const deleteLine = (line) => {
      if (line.parent) line.parent.remove(line);

      this.selectedLines = this.selectedLines.filter((l) => l !== line);

      sceneEl.emit("line-deleted", {
        line: line,
        lines: this.selectedLines,
      });
    };

    const getIntersectedLine = (e) => {
      const drawGroup = getDrawGroup();
      if (!drawGroup) return null;

      const rect = sceneEl.canvas.getBoundingClientRect();

      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, sceneEl.camera);

      const lines = [];

      drawGroup.traverse((child) => {
        if (child.isLine) lines.push(child);
      });

      const intersects = raycaster.intersectObjects(lines, false);

      return intersects.length ? intersects[0].object : null;
    };

    const onPointerDown = (e) => {
      if (!this.data.enabled) return;

      if (e.target.classList.contains("clickable")) return;

      const now = performance.now();
      const timeSinceLastClick = now - this.lastClickTime;

      const clickedLine = getIntersectedLine(e);

      /* -------------------------
      DOBLE CLICK → BORRAR
      ------------------------- */

      if (timeSinceLastClick < this.data.doubleClickDelay) {
        if (clickedLine && this.selectedLines.includes(clickedLine)) {
          deleteLine(clickedLine);
          this.lastClickTime = 0;
          return;
        }
      }

      /* -------------------------
      CLICK NORMAL → TOGGLE
      ------------------------- */

      if (clickedLine) {
        if (this.selectedLines.includes(clickedLine)) {
          deselectLine(clickedLine);
        } else {
          selectLine(clickedLine);
        }
      }

      this.lastClickTime = now;
    };

    sceneEl.addEventListener(
      "renderstart",
      () => sceneEl.canvas.addEventListener("pointerdown", onPointerDown),
      { once: true },
    );
  },
});

/* ==========================
LINE GIZMO COMPONENT
Gizmo flotante para líneas seleccionadas

========================== */

AFRAME.registerComponent("line-gizmo", {
  schema: {
    iconSrc: { type: "string", default: "assets/icons/icono-mover.glb" },
    materialNormal: { type: "color", default: "#ff4444" },
    materialSelected: { type: "color", default: "#88ffff" },
  },

  init: function () {
    const sceneEl = this.el.sceneEl;

    this.gizmo = null;
    this.selectedLine = null;

    this.cameraObj = sceneEl.camera?.el?.object3D || null;

    this.GizmoOption = "Circle";
    this.visualSelected = false;

    this.materialNormalMesh = new THREE.MeshBasicMaterial({
      color: this.data.materialNormal,
      toneMapped: false,
      flatShading: true,
    });

    this.materialSelectedMesh = new THREE.MeshBasicMaterial({
      color: this.data.materialSelected,
      toneMapped: false,
      flatShading: true,
    });

    const applyMaterialToVisual = (visual, selected = false) => {
      const obj3D = visual.getObject3D("mesh");
      if (!obj3D) return;

      const mat = selected
        ? this.materialSelectedMesh
        : this.materialNormalMesh;

      obj3D.traverse((child) => {
        if (child.isMesh) child.material = mat;
      });
    };

    const createCircleVisual = () => {
      const circle = document.createElement("a-entity");

      circle.setObject3D(
        "mesh",
        new THREE.Mesh(
          new THREE.CircleGeometry(0.0125, 32),
          this.materialNormalMesh,
        ),
      );

      circle.classList.add("clickable");

      return circle;
    };

    const createMoveVisual = () => {
      const move = document.createElement("a-entity");

      move.setAttribute("gltf-model", this.data.iconSrc);
      move.setAttribute("scale", "0.09 0.09 0.09");
      move.setAttribute("rotation", "0 90 0");

      move.classList.add("clickable");

      move.addEventListener("model-loaded", () => {
        applyMaterialToVisual(move, this.visualSelected);
      });

      return move;
    };

    const getLineMidpoint = (line) => {
      const pos = line.geometry.attributes.position.array;
      const mid = Math.floor(pos.length / 6) * 3;

      return {
        x: pos[mid],
        y: pos[mid + 1],
        z: pos[mid + 2],
      };
    };

    const moveGizmoToLine = (line) => {
      const p = getLineMidpoint(line);

      if (!this.gizmo) {
        createGizmo(p.x, p.y, p.z);
      } else {
        this.gizmo.object3D.position.set(p.x, p.y, p.z);
      }

      this.selectedLine = line;
    };

    const createGizmo = (x, y, z) => {
      const gizmo = document.createElement("a-entity");

      const circleVisual = createCircleVisual();
      const moveVisual = createMoveVisual();

      circleVisual.object3D.visible = true;
      moveVisual.object3D.visible = false;

      gizmo.appendChild(circleVisual);
      gizmo.appendChild(moveVisual);

      gizmo.object3D.position.set(x, y, z);

      this.el.appendChild(gizmo);

      this.gizmo = gizmo;

      const clickHandler = () => {
        if (!this.selectedLine) return;

        if (this.GizmoOption === "Circle") {
          this.GizmoOption = "Move";

          circleVisual.object3D.visible = false;
          moveVisual.object3D.visible = true;

          this.visualSelected = false;

          applyMaterialToVisual(moveVisual, false);
        } else {
          if (!this.visualSelected) {
            this.visualSelected = true;
            applyMaterialToVisual(moveVisual, true);
          } else {
            this.GizmoOption = "Circle";

            moveVisual.object3D.visible = false;
            circleVisual.object3D.visible = true;

            this.visualSelected = false;
          }
        }
      };

      circleVisual.addEventListener("click", clickHandler);
      moveVisual.addEventListener("click", clickHandler);
    };

    /* -------------------------
    SELECCIÓN
    ------------------------- */

    sceneEl.addEventListener("lines-selected", (evt) => {
      const lines = evt.detail.lines;

      if (!lines || !lines.length) return;

      const line = lines[lines.length - 1]; // última seleccionada

      moveGizmoToLine(line);
    });

    /* -------------------------
    DESELECCIÓN
    ------------------------- */

    sceneEl.addEventListener("lines-deselected", (evt) => {
      const lines = evt.detail.lines;

      if (!lines || !lines.length) {
        if (this.gizmo) {
          this.gizmo.remove();
          this.gizmo = null;
        }

        this.selectedLine = null;
        return;
      }

      const line = lines[lines.length - 1];

      moveGizmoToLine(line);
    });

    /* -------------------------
    ELIMINACIÓN
    ------------------------- */

    sceneEl.addEventListener("line-deleted", (evt) => {
      const lines = evt.detail.lines;

      if (!lines || !lines.length) {
        if (this.gizmo) {
          this.gizmo.remove();
          this.gizmo = null;
        }

        this.selectedLine = null;
        return;
      }

      moveGizmoToLine(lines[lines.length - 1]);
    });

    /* -------------------------
    MIRAR A CÁMARA
    ------------------------- */

    this.tick = () => {
      if (!this.gizmo || !this.cameraObj) return;

      const camPos = new THREE.Vector3();
      this.cameraObj.getWorldPosition(camPos);

      this.gizmo.object3D.lookAt(camPos);
    };
  },
});

/* ========================== 
PLANE SELECT COMPONENT OPTIMIZADO 
========================== */
AFRAME.registerComponent("plane-selector", {
  init: function () {
    const sceneEl = this.el.sceneEl;

    // Función para actualizar el visual de los iconos según el tipo actual
    const updateVisual = () => {
      const modelRoot =
        window.OpenCentralGlobals.core.escenario.getObject3D("mesh");
      if (!modelRoot) return;

      const meshGround = modelRoot.getObjectByName("Icon-PlaneSelector_Mesh_1");
      const meshWall = modelRoot.getObjectByName("Icon-PlaneSelector_Mesh_2");
      const mesh3D = modelRoot.getObjectByName("Icon-PlaneSelector_Mesh");

      // 🔹 Reset todos primero
      [meshGround, meshWall, mesh3D].forEach((m) => {
        if (m) resetMesh(m);
      });

      // 🔹 Activar solo los correspondientes al tipo actual
      switch (window.DrawingMode.type) {
        case "ground":
          if (meshGround) resaltarMesh(meshGround, "click");
          break;
        case "wall":
          if (meshWall) resaltarMesh(meshWall, "click");
          break;
        case "3D":
          [mesh3D, meshGround, meshWall].forEach((m) => {
            if (m) resaltarMesh(m, "click");
          });
          break;
      }
    };

    // 🔹 Aseguramos que al iniciar la escena, el visual coincide con el tipo actual
    updateVisual();

    // 🔹 Cambiar tipo y actualizar visual al hacer click
    sceneEl.addEventListener("IconPlaneSelector-clicked", () => {
      // Cambiar tipo según ciclo ground → wall → 3D → ground
      if (window.DrawingMode.type === "ground")
        window.DrawingMode.type = "wall";
      else if (window.DrawingMode.type === "wall")
        window.DrawingMode.type = "3D";
      else window.DrawingMode.type = "ground";

      console.log("Modo de dibujo cambiado a:", window.DrawingMode.type);

      // Actualizar visual
      updateVisual();
    });
  },
});

/* ========================== 
POINTER ERASER COMPONENT
========================== */
AFRAME.registerComponent("pointer-eraser", {
  schema: {
    enabled: { type: "boolean", default: false },
    radius: { type: "number", default: 0.1 },
  },

  init: function () {
    const sceneEl = this.el.sceneEl;
    this.drawSystem = sceneEl.components["pointer-draw"];
    if (!this.drawSystem) {
      console.warn("pointer-draw no encontrado");
      return;
    }

    this.isPointerDown = false;
    this.handTriggerDown = { right: false, left: false };
    this.pointer = new THREE.Vector2();

    // ACTIVACIÓN DESDE CREATOR MODE
    sceneEl.addEventListener("IconErase-clicked", (evt) => {
      this.data.enabled = !!evt.detail.active;
      this.isPointerDown = false;
    });

    // DESKTOP
    const onPointerDown = () => {
      if (this.data.enabled) this.isPointerDown = true;
    };
    const onPointerUp = () => (this.isPointerDown = false);

    const onPointerMove = (e) => {
      if (!this.data.enabled || !this.isPointerDown) return;
      const rect = sceneEl.canvas.getBoundingClientRect();
      this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      this.pointer.isVector2 = true;

      this.eraseAt(this.pointer);
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

    // VR
    ["right", "left"].forEach((hand) => {
      const ctrl = document.querySelector(`#controller-${hand}`);
      if (!ctrl) return;
      ctrl.addEventListener("triggerdown", () => {
        this.handTriggerDown[hand] = true;
      });
      ctrl.addEventListener("triggerup", () => {
        this.handTriggerDown[hand] = false;
      });
    });
  },

  tick: function () {
    if (!this.data.enabled) return;
    if (!this.drawSystem) return;

    ["right", "left"].forEach((hand) => {
      if (!this.handTriggerDown[hand]) return;
      const ctrl = document.querySelector(`#controller-${hand}`);
      if (!ctrl) return;
      this.eraseAt(ctrl);
    });
  },

  // BORRADO REAL
  eraseAt: function (ctrlOrPointer) {
    if (!this.drawSystem || !this.drawSystem.drawGroup) return;

    const { point } = this.drawSystem.getDrawPosition(ctrlOrPointer);
    if (!point) return;

    // Recorremos todas las líneas ya existentes
    const lines = this.drawSystem.drawGroup.children.slice(); // copia para iterar
    lines.forEach((line) => {
      if (!line.geometry || !line.geometry.attributes.position) return;

      const positions = line.geometry.attributes.position.array;
      const newPoints = [];

      for (let i = 0; i < positions.length; i += 3) {
        const p = new THREE.Vector3(
          positions[i],
          positions[i + 1],
          positions[i + 2],
        );
        if (p.distanceTo(point) > this.data.radius) newPoints.push(p);
      }

      if (newPoints.length < 2) {
        // eliminar línea completa si quedan menos de 2 puntos
        this.drawSystem.drawGroup.remove(line);
      } else {
        // actualizar geometría existente sin crear nada
        line.geometry.setFromPoints(newPoints);
        line.geometry.attributes.position.needsUpdate = true;
      }
    });
  },
});
