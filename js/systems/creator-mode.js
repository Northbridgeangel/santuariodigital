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

    // -------------------------
    // STATE DRAWING
    // -------------------------
    this.isPointerDown = false;
    this.currentPoints = null;
    this.currentLine = null;
    this.currentEntity = null;
    this.currentMesh = null;

    // 🔥 AÑADIDO: smooth system
    this.lastPoint = null;
    this.minDistance = 0.012;
    this.smoothFactor = 0.35;

    this.drawGroup = new THREE.Group();
    this.drawGroup.name = "DrawGroup";

    this.handTriggerDown = { right: false, left: false };
    this.currentColor = 0xff0000;

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    // -------------------------
    // ADD DRAW GROUP
    // -------------------------
    const addDrawGroup = () => {
      const modelRoot = escenario.getObject3D("mesh");
      if (!modelRoot) return;
      modelRoot.add(this.drawGroup);
    };

    if (escenario.getObject3D("mesh")) addDrawGroup();
    escenario.addEventListener("model-loaded", addDrawGroup);

    // -------------------------
    // ACTIVATE / DEACTIVATE
    // -------------------------
    sceneEl.addEventListener("IconDraw-clicked", (evt) => {
      this.data.enabled = evt.detail.active;
      this.resetStroke();
    });

    // -------------------------
    // COLOR CHANGE
    // -------------------------
    this.setDrawColor = (color) => {
      this.resetStroke();

      // 🔥 normalización robusta (HEX number siempre)
      const normalizedColor = new THREE.Color(color).getHex();

      this.currentColor = normalizedColor;
    };

    // -------------------------
    // RESET (IMPORTANTE)
    // -------------------------
    this.resetStroke = () => {
      this.currentPoints = null;
      this.currentLine = null;
      this.currentEntity = null;
      this.currentMesh = null;
      this.lastPoint = null; // 🔥 CRÍTICO
    };

    // -------------------------
    // ADD POINT (CORE)
    // -------------------------
    this.addDrawPoint = (point, mesh) => {
      if (!point || !mesh) {
        this.resetStroke();
        return;
      }

      // cambio de mesh = nuevo stroke
      if (this.currentMesh && mesh !== this.currentMesh) {
        this.resetStroke();
      }

      this.currentMesh = mesh;

      if (!this.currentPoints) {
        this.currentPoints = [];
      }

      // -------------------------
      // DISTANCE FILTER
      // -------------------------
      if (this.lastPoint) {
        const dist = this.lastPoint.distanceTo(point);
        if (dist < this.minDistance) return;
      }

      // -------------------------
      // FIRST POINT
      // -------------------------
      if (!this.lastPoint) {
        this.lastPoint = point.clone();
        this.currentPoints.push(point.clone());
        return;
      }

      // -------------------------
      // SMOOTHING
      // -------------------------
      const smoothed = this.lastPoint.clone().lerp(point, this.smoothFactor);

      this.lastPoint = smoothed.clone();
      this.currentPoints.push(smoothed);

      if (this.currentPoints.length < 2) return;

      // -------------------------
      // GEOMETRY UPDATE
      // -------------------------
      if (this.currentLine && this.currentEntity) {
        this.currentEntity.remove(this.currentLine);
      }

      const geometry = new THREE.BufferGeometry().setFromPoints(
        this.currentPoints,
      );

      // 🎨 SOLO COLOR VISUAL (NO ES EL REAL DEL SISTEMA)
      const material = new THREE.LineBasicMaterial({
        color: this.currentColor,
      });

      this.currentLine = new THREE.Line(geometry, material);

      // 🔥 asegurar que existe la entidad antes de heredar
      const hexColor = this.currentColor;

      const baseData = this.currentEntity?.userData || {
        id: crypto.randomUUID(),
        type: "draw-line",
        points: [],
        createdAt: Date.now(),

        color: hexColor,
        baseColor: hexColor,

        mode: window.DrawingMode.type,
        mesh: mesh,
      };

      // 🔥 CLAVE: la línea también tiene identidad propia
      this.currentLine.userData = {
        ...baseData,
        segmentIndex: this.currentPoints.length,
        isSegment: true,

        // 🔥 refuerzo de consistencia
        color: this.currentColor,
        baseColor: this.currentColor,
      };

      // -------------------------
      // ENTITY CREATE
      // -------------------------
      if (!this.currentEntity) {
        this.currentEntity = new THREE.Object3D();

        this.currentEntity.userData = {
          id: crypto.randomUUID(),
          type: "draw-line",
          points: [],
          createdAt: Date.now(),

          // 💾 estado real del sistema (UNIFICADO)
          color: this.currentColor,
          baseColor: this.currentColor,
          currentColor: this.currentColor,

          mode: window.DrawingMode.type,
          mesh: mesh,
        };

        this.drawGroup.add(this.currentEntity);
      }

      // -------------------------
      // SINCRONIZACIÓN DE COLOR (OBLIGATORIA)
      // -------------------------
      this.currentEntity.userData.color = this.currentColor;
      this.currentEntity.userData.baseColor = this.currentColor;
      this.currentEntity.userData.currentColor = this.currentColor;

      // -------------------------
      // ENTITY UPDATE
      // -------------------------
      this.currentEntity.add(this.currentLine);

      this.currentEntity.userData.points = this.currentPoints.slice();
      this.currentEntity.userData.color = this.currentColor;

      // 🔥 sincronizar también con la línea activa
      if (this.currentLine) {
        this.currentLine.userData.points = this.currentPoints.slice();
        this.currentLine.userData.color = this.currentColor;
      }
    };;;

    // -------------------------
    // CLEAR DRAWING
    // -------------------------
    window.clearDrawing = () => {
      this.drawGroup.clear();
      this.resetStroke();
    };

    // -------------------------
    // POSITION SYSTEM (TU CÓDIGO INTACTO)
    // -------------------------
    this.getDrawPosition = (ctrlOrPointer) => {
      const type = window.DrawingMode.type;
      const pos = new THREE.Vector3();
      let intersectedMesh = null;

      /* ---------- GROUND ---------- */
      if (type === "ground") {
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

        // CASO DESKTOP / MOUSE
        if (ctrlOrPointer.isVector2) {
          raycaster.setFromCamera(ctrlOrPointer, sceneEl.camera);
          raycaster.ray.intersectPlane(plane, pos);
        }

        // CASO VR (MANDO)
        else {
          const origin = new THREE.Vector3();
          const direction = new THREE.Vector3();

          ctrlOrPointer.object3D.getWorldPosition(origin);
          ctrlOrPointer.object3D.getWorldDirection(direction);

          raycaster.set(origin, direction);

          raycaster.ray.intersectPlane(plane, pos);
        }

        intersectedMesh = escenario.getObject3D("mesh");
        return { point: pos, mesh: intersectedMesh };
      }

      /* ---------- WALL ---------- */
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
              name === "mybackground" ||
              // 🔥 nuevos muros permitidos
              name === "muro_hab_entrada" ||
              name.startsWith("myentrance") ||
              name.startsWith("muro_entrada") ||
              name === "muro_gal_salida" ||
              name === "murolienzo001" ||
              name === "murolienzo002" ||
              name === "muro_hab_salida"
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

      /* ---------- 3D ---------- */
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
    // POINTER EVENTS
    // -------------------------
    const onPointerDown = () => {
      if (!this.data.enabled) return;
      this.isPointerDown = true;
      this.resetStroke();
    };

    const onPointerUp = () => {
      this.isPointerDown = false;
      this.resetStroke();
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
        this.resetStroke();
      });

      controller.addEventListener("triggerup", () => {
        this.handTriggerDown[hand] = false;
        this.resetStroke();
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

    // 🔥 SNAPSHOT ESTABLE (clave para export fiable)
    this.lastSelectionSnapshot = [];

    this.lastClickTime = 0;

    raycaster.params.Line.threshold = this.data.threshold;

    /* ================================
       HELPERS
    ================================ */

    const getDrawGroup = () => {
      const modelRoot = escenario.getObject3D("mesh");
      if (!modelRoot) return null;
      return modelRoot.getObjectByName("DrawGroup");
    };

    const syncSelection = () => {
      this.lastSelectionSnapshot = [...this.selectedLines];

      if (this.selectedLines.length === 0) {
        sceneEl.emit("lines-cleared");
        return;
      }

      sceneEl.emit("lines-selected", {
        lines: this.selectedLines,
      });
    };

    /* ================================
       DEBUG CENTRAL
    ================================ */
    const debugLine = (line, data) => {
      console.log("================================");
      console.log("🟢 LINE SELECTED");

      console.log({
        id: data.id,
        color: line.material?.color?.getHex?.(),
        type: data.type,
        mode: data.mode,
        mesh: data.mesh?.name,
      });

      const posAttr = line.geometry?.attributes?.position;

      if (posAttr) {
        const pos = posAttr.array;

        console.log("📍 POINT COUNT:", pos.length / 3);

        console.log("📍 FIRST POINT:", {
          x: pos[0],
          y: pos[1],
          z: pos[2],
        });
      }

      console.log("================================");
    };

    /* ================================
       SELECCIÓN
    ================================ */

    const selectLine = (line) => {
      if (!line) return;
      if (this.selectedLines.includes(line)) return;

      this.selectedLines.push(line);

      const SELECTION_COLOR = 0x00ffff;

      // 🔥 BASE REAL (fuente única de verdad)
      const base =
        line.userData.baseColor ??
        line.userData.currentColor ??
        line.userData.color ??
        line.material.color.getHex();

      // 🔥 FIX CRÍTICO: persistencia correcta del color REAL
      line.userData.baseColor = base;
      line.userData.currentColor = base;
      line.userData.color = base;

      line.userData.isSelected = true;

      // 🔥 SOLO VISUAL (NO MODIFICA EL ESTADO REAL)
      line.material.color.set(SELECTION_COLOR);

      line.material.userData = line.material.userData || {};
      line.material.userData.highlight = true;

      const data = line.userData || line.parent?.userData || {};

      debugLine(line, data);

      sceneEl.emit("stroke-selected", {
        id: data.id,
        type: data.type,
        mode: data.mode,
        mesh: data.mesh?.name,

        // 🔥 IMPORTANTE: export usa el color REAL, no el de selección
        color: base,

        pointCount: line.geometry?.attributes?.position
          ? line.geometry.attributes.position.array.length / 3
          : 0,
      });

      syncSelection();
    };
    const deselectLine = (line) => {
      this.selectedLines = this.selectedLines.filter((l) => l !== line);

      const base = line.userData.baseColor ?? line.userData.color ?? 0xffffff;

      line.material.color.set(base);

      line.userData.isSelected = false;

      syncSelection();
    };

    const deleteLine = (line) => {
      if (line.parent) line.parent.remove(line);

      this.selectedLines = this.selectedLines.filter((l) => l !== line);

      syncSelection();
    };

    /* ================================
       INTERSECCIÓN
    ================================ */

    const getIntersectedLine = (source) => {
      const drawGroup = getDrawGroup();
      if (!drawGroup) return null;

      const lines = [];

      drawGroup.traverse((child) => {
        if (child.isLine) lines.push(child);
      });

      // 🖱 MOUSE / TOUCH
      if (source?.clientX !== undefined) {
        const rect = sceneEl.canvas.getBoundingClientRect();

        pointer.x = ((source.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((source.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(pointer, sceneEl.camera);

        const intersects = raycaster.intersectObjects(lines, false);
        return intersects.length ? intersects[0].object : null;
      }

      // 🕹 VR CONTROLLER
      if (source?.object3D) {
        const origin = new THREE.Vector3();
        const direction = new THREE.Vector3();

        source.object3D.getWorldPosition(origin);
        source.object3D.getWorldDirection(direction);

        raycaster.set(origin, direction);

        const intersects = raycaster.intersectObjects(lines, false);
        return intersects.length ? intersects[0].object : null;
      }

      return null;
    };

    /* ================================
       INPUT HANDLER
    ================================ */

    const handlePointerDown = (source) => {
      if (!this.data.enabled) return;

      const now = performance.now();
      const timeSinceLastClick = now - this.lastClickTime;

      const clickedLine = getIntersectedLine(source);

      // 🔥 DOBLE CLICK → DELETE
      if (timeSinceLastClick < this.data.doubleClickDelay) {
        if (clickedLine && this.selectedLines.includes(clickedLine)) {
          deleteLine(clickedLine);
          this.lastClickTime = 0;
          return;
        }
      }

      // 🔥 TOGGLE SELECT
      if (clickedLine) {
        if (this.selectedLines.includes(clickedLine)) {
          deselectLine(clickedLine);
        } else {
          selectLine(clickedLine);
        }
      }

      this.lastClickTime = now;
    };

    /* ================================
       EVENT BINDING
    ================================ */

    sceneEl.addEventListener("renderstart", () => {
      sceneEl.canvas.addEventListener("pointerdown", (e) => {
        handlePointerDown(e);
      });

      ["right", "left"].forEach((hand) => {
        const ctrl = document.querySelector(`#controller-${hand}`);
        if (!ctrl) return;

        ctrl.addEventListener("triggerdown", () => {
          handlePointerDown(ctrl);
        });
      });
    });
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

    // 🔥 MULTI-SELECCIÓN
    this.selectedLines = [];

    // 🔥 offsets relativos del grupo (CLAVE para no perder distancias)
    this.groupOffsets = new Map();

    this.cameraObj = sceneEl.camera?.el?.object3D || null;

    this.GizmoOption = "Circle";
    this.visualSelected = false;

    // 🔥 MOVE STATE
    this.isMoving = false;
    this.moveOffset = new THREE.Vector3();

    /* -------------------------
    MATERIALS
    ------------------------- */

    this.materialNormalMesh = new THREE.MeshBasicMaterial({
      color: this.data.materialNormal,
      toneMapped: false,
    });

    this.materialSelectedMesh = new THREE.MeshBasicMaterial({
      color: this.data.materialSelected,
      toneMapped: false,
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

    /* -------------------------
    VISUALES DEL GIZMO
    ------------------------- */

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

    /* -------------------------
    CENTRO DEL GRUPO (VISUAL)
    ------------------------- */

    const computeGroupCenter = (lines) => {
      const center = new THREE.Vector3(0, 0, 0);

      lines.forEach((line) => {
        const pos = line.geometry.attributes.position.array;
        const mid = Math.floor(pos.length / 6) * 3;

        center.add(new THREE.Vector3(pos[mid], pos[mid + 1], pos[mid + 2]));
      });

      center.divideScalar(lines.length);
      return center;
    };

    /* -------------------------
    CREAR GIZMO
    ------------------------- */

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

      /* -------------------------
      SWITCH MODOS
      ------------------------- */

      const clickHandler = () => {
        if (!this.selectedLines.length) return;

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

      const addInteraction = (el, handler) => {
        el.addEventListener("click", handler);

        ["right", "left"].forEach((hand) => {
          const ctrl = document.querySelector(`#controller-${hand}`);
          if (!ctrl) return;

          ctrl.addEventListener("triggerdown", () => {
            const raycaster = new THREE.Raycaster();
            const origin = new THREE.Vector3();
            const direction = new THREE.Vector3();

            ctrl.object3D.getWorldPosition(origin);
            ctrl.object3D.getWorldDirection(direction);
            raycaster.set(origin, direction);

            const intersects = raycaster.intersectObject(el.object3D, true);

            if (intersects.length > 0) handler();
          });
        });
      };

      addInteraction(circleVisual, clickHandler);
      addInteraction(moveVisual, clickHandler);

      /* -------------------------
      DRAG MOVE VR
      ------------------------- */

      ["right", "left"].forEach((hand) => {
        const ctrl = document.querySelector(`#controller-${hand}`);
        if (!ctrl) return;

        ctrl.addEventListener("triggerdown", () => {
          if (!this.selectedLines.length) return;
          if (this.GizmoOption !== "Move") return;

          const raycaster = new THREE.Raycaster();
          const origin = new THREE.Vector3();
          const direction = new THREE.Vector3();

          ctrl.object3D.getWorldPosition(origin);
          ctrl.object3D.getWorldDirection(direction);
          raycaster.set(origin, direction);

          const intersects = raycaster.intersectObject(
            moveVisual.object3D,
            true,
          );

          if (!intersects.length) return;

          this.isMoving = true;
          this.visualSelected = true;

          applyMaterialToVisual(moveVisual, true);

          const gizmoPos = new THREE.Vector3();
          const ctrlPos = new THREE.Vector3();

          this.gizmo.object3D.getWorldPosition(gizmoPos);
          ctrl.object3D.getWorldPosition(ctrlPos);

          this.moveOffset.copy(gizmoPos).sub(ctrlPos);
        });

        ctrl.addEventListener("triggerup", () => {
          if (!this.isMoving) return;

          this.isMoving = false;
          this.visualSelected = false;

          applyMaterialToVisual(moveVisual, false);

          if (this.selectedLines.length) {
            updateLinesPosition(
              this.selectedLines,
              this.gizmo.object3D.position,
            );
          }
        });
      });

      /* -------------------------
      DESKTOP DRAG
      ------------------------- */

      moveVisual.addEventListener("mousedown", () => {
        if (this.GizmoOption !== "Move") return;

        this.isMoving = true;
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
        applyMaterialToVisual(moveVisual, false);

        if (this.selectedLines.length) {
          updateLinesPosition(this.selectedLines, this.gizmo.object3D.position);
        }
      });
    };

    /* -------------------------
    MOVIMIENTO GRUPO (CORREGIDO)
    ------------------------- */

    const updateLinesPosition = (lines, newCenter) => {
      lines.forEach((line) => {
        const geometry = line.geometry;
        const pos = geometry.attributes.position.array;

        // 🔥 offset guardado en selección (clave para mantener distancias)
        const offset = this.groupOffsets.get(line);
        if (!offset) return;

        // nuevo centro de esta línea manteniendo estructura del grupo
        const targetCenter = {
          x: newCenter.x + offset.x,
          y: newCenter.y + offset.y,
          z: newCenter.z + offset.z,
        };

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

        const dx = targetCenter.x - cx;
        const dy = targetCenter.y - cy;
        const dz = targetCenter.z - cz;

        for (let i = 0; i < pos.length; i += 3) {
          pos[i] += dx;
          pos[i + 1] += dy;
          pos[i + 2] += dz;
        }

        geometry.attributes.position.needsUpdate = true;
        geometry.computeBoundingSphere();
        geometry.computeBoundingBox();
      });
    };

    /* -------------------------
    SELECCIÓN DE LÍNEAS
    ------------------------- */

    sceneEl.addEventListener("lines-selected", (evt) => {
      const lines = evt.detail.lines;
      if (!lines || !lines.length) return;

      this.selectedLines = lines;

      const center = computeGroupCenter(lines);

      // 🔥 GUARDAR OFFSETS RELATIVOS (CLAVE FIX)
      this.groupOffsets.clear();

      lines.forEach((line) => {
        const pos = line.geometry.attributes.position.array;

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

        this.groupOffsets.set(line, {
          x: cx - center.x,
          y: cy - center.y,
          z: cz - center.z,
        });
      });

      if (!this.gizmo) {
        createGizmo(center.x, center.y, center.z);
      } else {
        this.gizmo.object3D.position.copy(center);
      }
    });

    /* -------------------------
    DESELECCIÓN / DELETE
    ------------------------- */

    const handleClear = (lines) => {
      if (!lines || !lines.length) {
        if (this.gizmo) {
          this.gizmo.remove();
          this.gizmo = null;
        }

        this.selectedLines = [];
        this.groupOffsets.clear();
        return;
      }

      this.selectedLines = lines;

      const center = computeGroupCenter(lines);

      if (this.gizmo) {
        this.gizmo.object3D.position.copy(center);
      }
    };

    sceneEl.addEventListener("lines-deselected", (evt) =>
      handleClear(evt.detail.lines),
    );

    sceneEl.addEventListener("line-deleted", (evt) =>
      handleClear(evt.detail.lines),
    );

    sceneEl.addEventListener("lines-cleared", () => {
      if (this.gizmo) {
        this.gizmo.remove();
        this.gizmo = null;
      }

      this.selectedLines = [];
      this.groupOffsets.clear();
    });

    /* -------------------------
    TICK
    ------------------------- */

    this.tick = () => {
      if (!this.gizmo || !this.cameraObj) return;

      const camPos = new THREE.Vector3();
      this.cameraObj.getWorldPosition(camPos);

      this.gizmo.object3D.lookAt(camPos);

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
    radius: { type: "number", default: 0.025 },
  },

  init: function () {
    const sceneEl = this.el.sceneEl;

    this.drawSystem = sceneEl.components["pointer-draw"];
    if (!this.drawSystem) {
      console.warn("pointer-draw no encontrado");
      return;
    }

    // -------------------------
    // STATE
    // -------------------------
    this.isDrawing = false;

    this.handTriggerDown = { right: false, left: false };

    this.pointer = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();

    // -------------------------
    // ACTIVATE / DEACTIVATE
    // -------------------------
    sceneEl.addEventListener("IconErase-clicked", (evt) => {
      this.data.enabled = !!evt.detail.active;

      this.isDrawing = false;
      this.handTriggerDown = { right: false, left: false };
    });

    // -------------------------
    // DESKTOP INPUT
    // -------------------------
    const updateMousePointer = (e) => {
      const rect = sceneEl.canvas.getBoundingClientRect();

      this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.pointer.isVector2 = true;
    };

    const onPointerDown = (e) => {
      if (!this.data.enabled) return;

      this.isDrawing = true;
      updateMousePointer(e);
    };

    const onPointerUp = () => {
      this.isDrawing = false;
    };

    const onPointerMove = (e) => {
      if (!this.data.enabled) return;
      updateMousePointer(e);
    };

    sceneEl.addEventListener(
      "renderstart",
      () => {
        const canvas = sceneEl.canvas;

        canvas.addEventListener("pointerdown", onPointerDown);
        canvas.addEventListener("pointerup", onPointerUp);
        canvas.addEventListener("pointermove", onPointerMove);
      },
      { once: true },
    );

    // -------------------------
    // VR INPUT (TRIGGERS)
    // -------------------------
    ["right", "left"].forEach((hand) => {
      const ctrl = document.querySelector(`#controller-${hand}`);
      if (!ctrl) return;

      ctrl.addEventListener("triggerdown", () => {
        this.handTriggerDown[hand] = true;
        this.isDrawing = true;
      });

      ctrl.addEventListener("triggerup", () => {
        this.handTriggerDown[hand] = false;

        const anyActive = Object.values(this.handTriggerDown).some((v) => v);
        if (!anyActive) this.isDrawing = false;
      });
    });
  },

  // =========================================================
  // LOOP PRINCIPAL
  // =========================================================
  tick: function () {
    if (!this.data.enabled || !this.drawSystem || !this.isDrawing) return;

    // -------------------------
    // VR MODE (RAYCAST REAL TIME)
    // -------------------------
    let activeHand = null;

    if (this.handTriggerDown.right) activeHand = "right";
    else if (this.handTriggerDown.left) activeHand = "left";

    if (activeHand) {
      const ctrl = document.querySelector(`#controller-${activeHand}`);
      if (!ctrl) return;

      const raycaster = new THREE.Raycaster();
      const origin = new THREE.Vector3();
      const direction = new THREE.Vector3();

      ctrl.object3D.getWorldPosition(origin);
      ctrl.object3D.getWorldDirection(direction);

      raycaster.set(origin, direction);

      this.eraseAt({ raycaster });
      return;
    }

    // -------------------------
    // DESKTOP MODE
    // -------------------------
    if (this.pointer?.isVector2) {
      this.eraseAt(this.pointer);
    }
  },

  // =========================================================
  // ERASE CORE
  // =========================================================
  eraseAt: function (input) {
    if (!this.drawSystem?.drawGroup) return;

    let point = null;

    // -------------------------
    // VR RAYCAST MODE
    // -------------------------
    if (input.raycaster) {
      const intersects = input.raycaster.intersectObject(
        this.drawSystem.drawGroup,
        true,
      );

      if (!intersects.length) return;
      point = intersects[0].point;
    }

    // -------------------------
    // DESKTOP MODE
    // -------------------------
    else {
      const result = this.drawSystem.getDrawPosition(input);
      if (!result) return;
      point = result.point;
    }

    if (!point) return;

    const radiusSq = this.data.radius * this.data.radius;

    const drawGroup = this.drawSystem.drawGroup;
    const entities = drawGroup.children.slice();

    entities.forEach((entity) => {
      if (!entity) return;

      entity.traverse((child) => {
        if (!child.isLine || !child.geometry?.attributes?.position) return;

        const positions = child.geometry.attributes.position.array;
        const newPoints = [];

        const worldPos = new THREE.Vector3();

        for (let i = 0; i < positions.length; i += 3) {
          worldPos.set(positions[i], positions[i + 1], positions[i + 2]);

          entity.localToWorld(worldPos);

          const dx = worldPos.x - point.x;
          const dy = worldPos.y - point.y;
          const dz = worldPos.z - point.z;

          const distSq = dx * dx + dy * dy + dz * dz;

          if (distSq > radiusSq) {
            entity.worldToLocal(worldPos);
            newPoints.push(worldPos.clone());
          }
        }

        if (newPoints.length < 2) {
          entity.remove(child);
          return;
        }

        child.geometry.setFromPoints(newPoints);
        child.geometry.attributes.position.needsUpdate = true;
        child.geometry.computeBoundingSphere();
      });
    });
  },
});
/* ========================== 
COLOR PICKER VR (TRIGGER + RAYCAST MANUAL)
Sin dependencia de raycaster de A-Frame
========================== */

AFRAME.registerComponent("color-picker", {
  init: function () {
    const sceneEl = this.el.sceneEl;

    // -------------------------
    // CREAR WHEEL (UNO SOLO)
    // -------------------------
    const size = 512;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    const radius = size / 2;

    // 🎨 rueda de color
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

    // 🎨 gradiente central
    const grad = ctx.createRadialGradient(
      radius,
      radius,
      0,
      radius,
      radius,
      radius,
    );
    grad.addColorStop(0, "white");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // -------------------------
    // ENTITY VISUAL
    // -------------------------
    this.wheelEl = document.createElement("a-entity");
    this.wheelEl.setAttribute("geometry", {
      primitive: "circle",
      radius: 0.12,
    });

    this.wheelEl.setAttribute("material", {
      src: canvas,
      shader: "flat",
      side: "double",
      transparent: true,
    });

    this.wheelEl.object3D.visible = false;
    this.el.appendChild(this.wheelEl);

    // -------------------------
    // ESTADO
    // -------------------------
    this.active = false;

    const setActive = (state) => {
      this.active = state;
      this.wheelEl.object3D.visible = state;

      if (state) {
        // posicionar delante de la cámara
        const cam = sceneEl.camera.el.object3D;
        const dir = new THREE.Vector3();
        cam.getWorldDirection(dir);

        const pos = new THREE.Vector3();
        cam.getWorldPosition(pos);

        pos.add(dir.multiplyScalar(0.5));
        pos.y -= 0.15;

        this.wheelEl.object3D.position.copy(pos);
        this.wheelEl.object3D.lookAt(cam.position);
      }
    };

    // -------------------------
    // EVENTO UI
    // -------------------------
    sceneEl.addEventListener("IconColorPicker-clicked", (evt) => {
      setActive(!!evt.detail.active);
    });

    // -------------------------
    // SELECCIÓN POR TRIGGER (VR)
    // -------------------------
    const selectColorFromController = (controller) => {
      if (!this.active) return;

      const raycaster = new THREE.Raycaster();
      const origin = new THREE.Vector3();
      const direction = new THREE.Vector3();

      controller.object3D.getWorldPosition(origin);
      controller.object3D.getWorldDirection(direction);

      raycaster.set(origin, direction);

      const intersects = raycaster.intersectObject(this.wheelEl.object3D, true);

      if (!intersects.length) return;

      const intersection = intersects[0];

      if (!intersection.uv) return;

      const uv = intersection.uv;

      const x = Math.floor(uv.x * size);
      const y = Math.floor((1 - uv.y) * size);

      const pixel = ctx.getImageData(x, y, 1, 1).data;

      const color = new THREE.Color(
        `rgb(${pixel[0]},${pixel[1]},${pixel[2]})`,
      ).getHex();

      // 🔥 SIEMPRE pasar por API (NO tocar variable directa)
      const draw = document.querySelector("[pointer-draw]");
      if (draw?.components?.["pointer-draw"]) {
        draw.components["pointer-draw"].setDrawColor(color);
      }

      console.log("🎨 Color seleccionado:", color);
    };

    // -------------------------
    // HOOK CONTROLLERS
    // -------------------------
    ["right", "left"].forEach((hand) => {
      const ctrl = document.querySelector(`#controller-${hand}`);
      if (!ctrl) return;

      ctrl.addEventListener("triggerdown", () => {
        selectColorFromController(ctrl);
      });
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
    grad.addColorStop(1, "rgba(0,0,0,0)"); //en vez de transparente
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

    // ==========================
    // TRACKING VR (CLAVE)
    // ==========================
    this.currentIntersection = null;

    this.el.addEventListener("raycaster-intersected", (evt) => {
      this.currentIntersection = evt.detail.intersection;
    });

    this.el.addEventListener("raycaster-intersected-cleared", () => {
      this.currentIntersection = null;
    });

    // Detector de color (UNIFICADO)
    const handleSelect = (evt) => {
      if (!this.active) return;

      const intersection = evt.detail?.intersection || this.currentIntersection;

      if (!intersection || !intersection.uv) return;

      const uv = intersection.uv;

      const x = Math.floor(uv.x * size);
      const y = Math.floor((1 - uv.y) * size);

      const pixel = ctx.getImageData(x, y, 1, 1).data;

      const color = `rgb(${pixel[0]},${pixel[1]},${pixel[2]})`;

      const draw = document.querySelector("[pointer-draw]");
      if (draw?.components?.["pointer-draw"]) {
        draw.components["pointer-draw"].currentColor = color;
      }

      console.log("Color seleccionado:", color);
    };

    // INPUT UNIFICADO XR
    this.el.addEventListener("click", handleSelect);
    this.el.addEventListener("triggerdown", handleSelect);
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
