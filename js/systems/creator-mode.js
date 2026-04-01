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
    const sceneEl = this.el;

    this.creatorModeActive = false;
    this.iconMeshes = null;
    this.creatorMenu = [];
    this.selectedIcon = null;

    // Estado centralizado de iconos
    this.iconState = {
      draw: false,
      plane: false,
      eraser: false,
      color: false,
    };

    // -----------------------
    // FUNCIONES DE AYUDA
    // -----------------------
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
          if (window.HoverControl?.clearHoverFor)
            window.HoverControl.clearHoverFor(mesh);
        } else {
          resetMesh(mesh);
        }
      });
    };

    // -----------------------
    // DRAW LISTENERS
    // -----------------------
    const addDrawListeners = () => {
      ["right", "left"].forEach((hand) => {
        const ctrl = document.querySelector(`#controller-${hand}`);
        if (!ctrl || ctrl.hasDrawListener) return;

        ctrl.hasDrawListener = true;
        ctrl._drawHandler = () => {
          const drawSystem = sceneEl.components["pointer-draw"];
          if (!drawSystem?.data.enabled) return;
          const pos = new THREE.Vector3();
          ctrl.object3D.getWorldPosition(pos);
          drawSystem.addDrawPoint(pos);
        };
        ctrl.addEventListener("triggerdown", ctrl._drawHandler);
      });
    };

    const removeDrawListeners = () => {
      ["right", "left"].forEach((hand) => {
        const ctrl = document.querySelector(`#controller-${hand}`);
        if (!ctrl || !ctrl.hasDrawListener) return;
        ctrl.hasDrawListener = false;
        ctrl.removeEventListener("triggerdown", ctrl._drawHandler);
        ctrl._drawHandler = null;
      });
    };

    // -----------------------
    // ACTIVACIÓN / DESACTIVACIÓN ICONOS
    // -----------------------
    const activateDraw = () => {
      const drawPlaneGroup = [
        ...this.iconMeshes.draw,
        ...this.iconMeshes.plane,
      ];
      toggleMeshState(drawPlaneGroup, true);
      this.iconState.draw = true;
      this.iconState.plane = true;
      this.selectedIcon = drawPlaneGroup;
      setRayVisible(false);
      addDrawListeners();
      sceneEl.emit("IconDraw-clicked", { active: true, mesh: drawPlaneGroup });
    };

    const deactivateDraw = () => {
      const drawPlaneGroup = [
        ...this.iconMeshes.draw,
        ...this.iconMeshes.plane,
      ];
      toggleMeshState(drawPlaneGroup, false);
      this.iconState.draw = false;
      this.iconState.plane = false;
      this.selectedIcon = null;
      setRayVisible(true);
      removeDrawListeners();
      sceneEl.emit("IconDraw-clicked", { active: false, mesh: drawPlaneGroup });
    };

    const activateEraser = () => {
      toggleMeshState(this.iconMeshes.eraser, true);
      this.iconState.eraser = true;
      this.selectedIcon = this.iconMeshes.eraser;
      sceneEl.emit("IconErase-clicked", {
        active: true,
        mesh: this.iconMeshes.eraser[0],
      });
    };

    const deactivateEraser = () => {
      toggleMeshState(this.iconMeshes.eraser, false);
      this.iconState.eraser = false;
      this.selectedIcon = null;
      sceneEl.emit("IconErase-clicked", {
        active: false,
        mesh: this.iconMeshes.eraser[0],
      });
    };

    const activateColor = () => {
      toggleMeshState(this.iconMeshes.color, true);
      this.iconState.color = true;
      this.selectedIcon = this.iconMeshes.color;
      sceneEl.emit("IconColorPicker-clicked", {
        active: true,
        mesh: this.iconMeshes.color,
      });
    };

    const deactivateColor = () => {
      toggleMeshState(this.iconMeshes.color, false);
      this.iconState.color = false;
      this.selectedIcon = null;
      sceneEl.emit("IconColorPicker-clicked", {
        active: false,
        mesh: this.iconMeshes.color,
      });
    };

    // -----------------------
    // DESACTIVAR TODOS LOS ICONOS
    // -----------------------
    const deactivateAllIcons = () => {
      if (this.iconState.draw) deactivateDraw();
      if (this.iconState.eraser) deactivateEraser();
      if (this.iconState.color) deactivateColor();
      // Plane se desactiva automáticamente con Draw
    };

    // -----------------------
    // CONFIGURACIÓN DE ICONOS
    // -----------------------
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

    // -----------------------
    // CLICK EN MESH
    // -----------------------
    sceneEl.addEventListener("mesh-clicked", (evt) => {
      const mesh = evt.detail.mesh;
      if (!mesh) return;

      // CREATOR MENU
      if (mesh.name.startsWith("Btn-creator-menú")) {
        this.creatorModeActive = !this.creatorModeActive;

        if (!this.creatorModeActive) {
          // Salimos del Creator Mode → desactivamos todo
          deactivateAllIcons();
        }

        Object.values(this.iconMeshes).forEach((group) =>
          group.forEach((m) => (m.visible = this.creatorModeActive)),
        );
        toggleMeshState(this.creatorMenu, this.creatorModeActive);
        setRayVisible(!this.creatorModeActive);
        return;
      }

      const prevSelected = this.selectedIcon;

      // DRAW
      if (this.iconMeshes.draw.includes(mesh)) {
        if (this.iconState.draw) deactivateDraw();
        else {
          if (prevSelected) {
            if (prevSelected.includes(this.iconMeshes.eraser[0]))
              deactivateEraser();
            else if (prevSelected.includes(this.iconMeshes.color[0]))
              deactivateColor();
            else deactivateDraw();
          }
          activateDraw();
        }
        return;
      }

      // PLANE (solo activo si Draw activo)
      if (this.iconMeshes.plane.includes(mesh)) {
        if (!this.iconState.draw) return;
        this.selectedIcon = [...this.iconMeshes.draw, ...this.iconMeshes.plane];
        sceneEl.emit("IconPlaneSelector-clicked", { mesh: mesh });
        return;
      }

      // ERASER
      if (this.iconMeshes.eraser.includes(mesh)) {
        if (this.iconState.eraser) deactivateEraser();
        else {
          if (prevSelected) {
            if (prevSelected.includes(this.iconMeshes.draw[0]))
              deactivateDraw();
            else if (prevSelected.includes(this.iconMeshes.color[0]))
              deactivateColor();
          }
          activateEraser();
        }
        return;
      }

      // COLOR PICKER
      if (this.iconMeshes.color.includes(mesh)) {
        if (this.iconState.color) deactivateColor();
        else {
          if (prevSelected) {
            if (prevSelected.includes(this.iconMeshes.draw[0]))
              deactivateDraw();
            else if (prevSelected.includes(this.iconMeshes.eraser[0]))
              deactivateEraser();
          }
          activateColor();
        }
        return;
      }
    });

    // -----------------------
    // TICK VR (DIBUJO)
    // -----------------------
    this.tick = () => {
      if (!this.iconState.draw) return;
      const drawSystem = sceneEl.components["pointer-draw"];
      if (!drawSystem) return;

      ["right", "left"].forEach((hand) => {
        const ctrl = document.querySelector(`#controller-${hand}`);
        if (!ctrl || ctrl.hasDrawListener) return;
        addDrawListeners();
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
    this.currentColor = 0xff0000; // 🔹 Color inicial rojo

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
    // Cambiar color dinámicamente
    // -------------------------
    this.setDrawColor = (colorHex) => {
      // 🔹 Si hay línea en curso, la finalizamos
      if (this.currentLine) {
        this.currentPoints = null;
        this.currentLine = null;
        this.currentMesh = null;
      }
      this.currentColor = colorHex;
    };

    // -------------------------
    // Añadir punto al dibujo
    // -------------------------
    this.addDrawPoint = (point, mesh) => {
      if (!point || !mesh) {
        this.currentPoints = null;
        this.currentLine = null;
        this.currentMesh = null;
        return;
      }

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
        color: this.currentColor, // 🔹 ahora dinámico
      });

      this.currentLine = new THREE.Line(geometry, material);

      // 🔹 Metadata para edición, selección o exportación
      this.currentLine.userData = {
        type: "draw-line",
        points: this.currentPoints.slice(),
        createdAt: Date.now(),
        color: this.currentColor,
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
        intersectedMesh = escenario.getObject3D("mesh");
        return { point: pos, mesh: intersectedMesh };
      }

      /* ---------- WALL / OBJETO ---------- */
      if (type === "wall") {
        const modelRoot = escenario.getObject3D("mesh");
        if (!modelRoot) return { point: null, mesh: null };

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
            )
              this._wallMeshes.push(child);
          });
        }

        if (this._wallMeshes.length === 0) return { point: null, mesh: null };

        if (ctrlOrPointer.isVector2) {
          raycaster.setFromCamera(ctrlOrPointer, sceneEl.camera);
        } else {
          const origin = new THREE.Vector3();
          const direction = new THREE.Vector3();
          ctrlOrPointer.object3D.getWorldPosition(origin);
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

    // 🔥 MOVE STATE
    this.isMoving = false;
    this.moveOffset = new THREE.Vector3();

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

      // 🔥 FIX IMPORTANTE
      line.frustumCulled = false;
    };

    const updateLinePosition = (line, newCenter) => {
      const geometry = line.geometry;
      const pos = geometry.attributes.position.array;

      let cx = 0,
        cy = 0,
        cz = 0;
      const count = pos.length / 3;

      for (let i = 0; i < pos.length; i += 3) {
        cx += pos[i];
        cy += pos[i + 1];
        cz += pos[i + 2];
      }

      cx /= count;
      cy /= count;
      cz /= count;

      const dx = newCenter.x - cx;
      const dy = newCenter.y - cy;
      const dz = newCenter.z - cz;

      for (let i = 0; i < pos.length; i += 3) {
        pos[i] += dx;
        pos[i + 1] += dy;
        pos[i + 2] += dz;
      }

      geometry.attributes.position.needsUpdate = true;

      // 🔥 CLAVE: evitar desaparición
      geometry.computeBoundingSphere();
      geometry.computeBoundingBox();
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

      /* -------------------------
      DRAG MOVE
      ------------------------- */

      moveVisual.addEventListener("mousedown", () => {
        if (this.GizmoOption !== "Move") return;

        this.isMoving = true;

        // 🔵 ACTIVAR COLOR AZUL (grabbing)
        applyMaterialToVisual(moveVisual, true);

        const gizmoPos = new THREE.Vector3();
        const camPos = new THREE.Vector3();

        this.gizmo.object3D.getWorldPosition(gizmoPos);
        this.cameraObj.getWorldPosition(camPos);

        this.moveOffset.copy(gizmoPos).sub(camPos);
      });

      window.addEventListener("mouseup", () => {
        if (!this.isMoving) return;

        this.isMoving = false;

        // 🔴 VOLVER A ROJO (idle)
        applyMaterialToVisual(moveVisual, false);

        if (this.selectedLine) {
          updateLinePosition(this.selectedLine, this.gizmo.object3D.position);
        }
      });
    };

    /* -------------------------
    SELECCIÓN
    ------------------------- */

    sceneEl.addEventListener("lines-selected", (evt) => {
      const lines = evt.detail.lines;
      if (!lines || !lines.length) return;

      const line = lines[lines.length - 1];
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

      moveGizmoToLine(lines[lines.length - 1]);
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
    TICK
    ------------------------- */

    this.tick = () => {
      if (!this.gizmo || !this.cameraObj) return;

      const camPos = new THREE.Vector3();
      this.cameraObj.getWorldPosition(camPos);

      // mirar a cámara
      this.gizmo.object3D.lookAt(camPos);

      // mover con cámara
      if (this.isMoving && this.GizmoOption === "Move") {
        const newPos = new THREE.Vector3().copy(camPos).add(this.moveOffset);

        this.gizmo.object3D.position.copy(newPos);
      }
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
    radius: { type: "number", default: 0.045 },
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

/* ========================== 
COLOR PICKER COMPONENT
========================== */
AFRAME.registerComponent("color-picker", {
  init: function () {
    // Referencias a elementos
    const wheelEl = document.createElement("a-entity");
    wheelEl.setAttribute("color-wheel", "");
    this.el.appendChild(wheelEl);

    this.wheel = wheelEl.components["color-wheel"];

    // Estado inicial
    this.active = false;

    // Función para mostrar/ocultar picker
    this.toggle = (state) => {
      this.active = state;
      if (this.wheel) this.wheel.setActive(state);
    };

    // Eventos del icono del Creator Mode
    const sceneEl = this.el.sceneEl;

    // Cuando el icono de color es clicado
    sceneEl.addEventListener("IconColorPicker-clicked", (evt) => {
      this.toggle(!!evt.detail.active);
    });

    // Cuando se cierra el Creator Mode
    sceneEl.addEventListener("creator-mode-toggled", (evt) => {
      if (!evt.detail.active) this.toggle(false);
    });

    // Actualización del color en tiempo real (opcional)
    sceneEl.addEventListener("wheel-color-selected", (evt) => {
      const draw = document.querySelector("[pointer-draw]");
      if (draw && draw.components["pointer-draw"]) {
        draw.components["pointer-draw"].currentColor = evt.detail.color;
      }
    });

    // Posicionamiento del wheel cerca del cursor o controlador VR
    this.el.addEventListener("mouseenter", (evt) => {
      if (!this.active) return;
      // Posicionar wheel frente al usuario
      const camera = sceneEl.camera.el;
      const camPos = camera.object3D.position;
      wheelEl.object3D.position.set(camPos.x, camPos.y - 0.2, camPos.z - 0.5);
      wheelEl.object3D.lookAt(camPos);
    });
  },
});

/* ========================== 
COLOR WHEEL COMPONENT
========================== */
AFRAME.registerComponent("color-wheel", {
  init: function () {
    const size = 512;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    const radius = size / 2;

    // Rueda de color
    for (let angle = 0; angle < 360; angle++) {
      const start = ((angle - 1) * Math.PI) / 180;
      const end = (angle * Math.PI) / 180;
      ctx.beginPath();
      ctx.moveTo(radius, radius);
      ctx.arc(radius, radius, radius, start, end);
      ctx.closePath();
      ctx.fillStyle = `hsl(${angle},100%,50%)`;
      ctx.fill();
    }

    // Gradiente central
    const grad = ctx.createRadialGradient(
      radius,
      radius,
      0,
      radius,
      radius,
      radius,
    );
    grad.addColorStop(0, "white");
    grad.addColorStop(1, "transparent");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // Asignar material
    this.el.setAttribute("material", {
      src: canvas,
      shader: "flat",
      side: "double",
      transparent: true,
    });

    // Estado inicial
    this.active = false;
    this.el.object3D.visible = false;

    // Función pública para toggle
    this.setActive = (state) => {
      this.active = state;
      this.el.object3D.visible = state;
    };

    // Detector de color
    this.el.addEventListener("click", (evt) => {
      if (!evt.detail.intersection) return;
      const uv = evt.detail.intersection.uv;
      const x = Math.floor(uv.x * size);
      const y = Math.floor((1 - uv.y) * size);
      const pixel = ctx.getImageData(x, y, 1, 1).data;
      const color = `rgb(${pixel[0]},${pixel[1]},${pixel[2]})`;

      const draw = document.querySelector("[pointer-draw]");
      if (draw && draw.components["pointer-draw"]) {
        draw.components["pointer-draw"].currentColor = color;
      }

      console.log("Color seleccionado:", color);
    });

    // Escuchar eventos de icon-picker
    const sceneEl = this.el.sceneEl;
    sceneEl.addEventListener("IconColorPicker-clicked", (evt) => {
      this.setActive(!!evt.detail.active);
    });

    // Ocultar wheel si se cierra Creator Mode
    sceneEl.addEventListener("creator-mode-toggled", (evt) => {
      if (!evt.detail.active) {
        this.setActive(false);
      }
    });
  },
});
