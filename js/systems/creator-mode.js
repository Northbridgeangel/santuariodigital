// ==========================
// CREATOR MODE SYSTEM
// ==========================
AFRAME.registerSystem("creator-mode", {
  schema: {},

  init: function () {
    const escenario = window.OpenCentralGlobals.core.escenario;
    const sceneEl = this.el.sceneEl;

    this.creatorModeActive = false;
    this.listeners = [];
    this.iconMeshes = null;
    this.creatorMenu = []; // Todas las mallas del menú Creator
    this.selectedIcon = null;

    // ==========================
    // FUNCIONES AUXILIARES
    // ==========================
    const setRayVisible = (visible) => {
      ["right", "left"].forEach((hand) => {
        const ctrl = document.querySelector(`#controller-${hand}`);
        if (!ctrl) return;
        const rayLine = ctrl.getObject3D("line");
        if (rayLine) rayLine.visible = visible;
      });
    };

    const toggleMeshState = (meshes, active) => {
      // Acepta un mesh individual o un array de meshes
      const meshArray = Array.isArray(meshes) ? meshes : [meshes];

      meshArray.forEach((mesh) => {
        if (!mesh) return;

        mesh.userData.active = active;

        if (active) {
          resaltarMesh(mesh, "click");

          // 🔥 Sacarlo del sistema hover cuando pasa a activo persistente
          if (window.HoverControl?.clearHoverFor) {
            window.HoverControl.clearHoverFor(mesh);
          }
        } else {
          resetMesh(mesh);
        }
      });
    };

    const updateCreatorUI = () => {
      if (!this.iconMeshes || !this.creatorMenu) return;

      const anyIconVisible = Object.values(this.iconMeshes).some((group) =>
        group.some((m) => m && m.visible),
      );

      // Desactivar icono seleccionado si los iconos se ocultan
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

      // Ajustar rayos según Icon-Draw activo
      if (
        this.selectedIcon &&
        this.selectedIcon.some((m) => m.name === "Icon-Draw")
      ) {
        setRayVisible(false);
      } else {
        setRayVisible(true);
      }
    };

    // ==========================
    // SETUP ICONOS Y MENÚ CREATOR
    // ==========================
    const setupIcons = () => {
      const modelRoot = escenario.getObject3D("mesh");
      if (!modelRoot) return;

      // 🔹 Cada icono ahora es un array de mallas (aunque tenga una sola)
      this.iconMeshes = {
        draw: [modelRoot.getObjectByName("Icon-Draw")],
        color: [
          modelRoot.getObjectByName("Icon-Colorpicker_Mesh"),
          modelRoot.getObjectByName("Icon-Colorpicker_Mesh_1"),
        ],
        eraser: [modelRoot.getObjectByName("Icon-Eraser")],
        plane: [modelRoot.getObjectByName("Icon-PlaneSelector")],
      };

      // 🔹 Inicializar visibilidad y estados
      Object.values(this.iconMeshes).forEach((group) => {
        group.forEach((m) => {
          if (!m) return;
          m.visible = false; // 🔹 ahora invisible al principio
          m.userData.active = false;
          m.userData.interactable = true;
          window.OpenCentralGlobals.core.interactiveMeshes.push(m);
        });
      });

      this.creatorMenu = Object.values(modelRoot.children).filter((m) =>
        m.name.startsWith("Btn-creator-menú"),
      );

      //console.log("🎨 Iconos y menú Creator inicializados");
    };

    if (escenario.getObject3D("mesh")) setupIcons();
    escenario.addEventListener("model-loaded", setupIcons);

    // ==========================
    // EVENTO CLICK GLOBAL
    // ==========================
    sceneEl.addEventListener("mesh-clicked", (evt) => {
      const mesh = evt.detail.mesh;
      if (!mesh) return;

      // --------------------------
      // TOGGLE CREATOR MENU
      // --------------------------
      if (mesh.name.startsWith("Btn-creator-menú")) {
        const isMenuActive = !this.creatorModeActive;
        this.creatorModeActive = isMenuActive;

        // Mostrar/ocultar iconos
        Object.values(this.iconMeshes).forEach((group) => {
          group.forEach((m) => {
            if (m) m.visible = isMenuActive;
          });
        });

        // Resaltar o resetear todas las mallas del menú
        toggleMeshState(this.creatorMenu, isMenuActive);

        updateCreatorUI();
        return;
      }

      // --------------------------
      // ICON-TOOL CLICK
      // --------------------------
      if (
        mesh.name.startsWith("Icon") &&
        Object.values(this.iconMeshes).some((group) =>
          group.some((m) => m.visible),
        )
      ) {
        // 🔹 Determinar grupo completo del icono clicado
        let iconGroup = null;
        for (const key in this.iconMeshes) {
          if (this.iconMeshes[key].some((m) => m === mesh)) {
            iconGroup = this.iconMeshes[key];
            break;
          }
        }
        if (!iconGroup) return;

        // Desactivar icono anterior
        if (this.selectedIcon && this.selectedIcon !== iconGroup) {
          toggleMeshState(this.selectedIcon, false);

          if (this.selectedIcon.some((m) => m.name === "Icon-Draw")) {
            sceneEl.emit("IconDraw-clicked", {
              active: false,
              mesh: this.selectedIcon,
            });
          }
        }

        // Activar/desactivar icono clicado
        const isActive = !mesh.userData.active;
        toggleMeshState(iconGroup, isActive);
        this.selectedIcon = isActive ? iconGroup : null;

        if (iconGroup.some((m) => m.name === "Icon-Draw")) {
          sceneEl.emit("IconDraw-clicked", {
            active: isActive,
            mesh: iconGroup,
          });
        }

        /*console.log(
          `🎯 Icono ${mesh.name} ${isActive ? "ACTIVADO" : "DESACTIVADO"}`,
        );*/
    
        updateCreatorUI();
        return;
      }
    });

    // ==========================
    // TICK VR (DIBUJO)
    // ==========================
    this.tick = () => {
      if (
        !this.selectedIcon ||
        !this.selectedIcon.some((m) => m.name === "Icon-Draw")
      )
        return;

      const drawSystem = sceneEl.components["pointer-draw"];
      if (!drawSystem) return;

      ["left", "right"].forEach((hand) => {
        const ctrl = document.querySelector(`#controller-${hand}`);
        if (!ctrl || ctrl.hasDrawListener) return; // evita múltiples listeners (rendimiento)

        ctrl.hasDrawListener = true;

        ctrl.addEventListener("triggerdown", () => {
          if (!drawSystem.data.enabled) return;

          const pos = new THREE.Vector3();
          ctrl.object3D.getWorldPosition(pos);

          drawSystem.addDrawPoint(pos); // ya no crea geometría nueva cada vez (rendimiento)
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

// ==========================
// POINTER DRAW COMPONENT OPTIMIZADO PARA VR
// ==========================
AFRAME.registerComponent("pointer-draw", {
  schema: { enabled: { type: "boolean", default: false } },

  init: function () {
    const sceneEl = this.el.sceneEl;
    const escenario = window.OpenCentralGlobals.core.escenario;

    // -------------------------
    // ESTADO DE DIBUJO
    // -------------------------
    this.isPointerDown = false; // mouse / touch
    this.drawPoints = []; // puntos acumulados
    this.drawLine = null; // línea actual
    this.drawGroup = new THREE.Group();
    this.drawGroup.name = "DrawGroup";

    // -------------------------
    // FLAGS VR para trigger continuo
    // -------------------------
    this.handTriggerDown = { right: false, left: false }; // 🔹 nuevo: trackea trigger presionado

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
    // SOLO se activa/desactiva desde IconDraw-clicked
    // -------------------------
    sceneEl.addEventListener("IconDraw-clicked", (evt) => {
      this.data.enabled = evt.detail.active;
      this.isPointerDown = evt.detail.active;
    });

    // -------------------------
    // Función para añadir puntos al dibujo
    // -------------------------
    this.addDrawPoint = (point) => {
      this.drawPoints.push(point.clone());
      if (this.drawPoints.length < 2) return; // 🔹 No dibujar si menos de 2 puntos

      if (this.drawLine) this.drawGroup.remove(this.drawLine);

      // 🔹 Dibujar línea continua usando BufferGeometry
      const geometry = new THREE.BufferGeometry().setFromPoints(
        this.drawPoints,
      );

      const material = new THREE.LineBasicMaterial({ color: 0xff0000 });
      this.drawLine = new THREE.Line(geometry, material);
      this.drawGroup.add(this.drawLine);
    };

    // -------------------------
    // Limpiar dibujo completo
    // -------------------------
    window.clearDrawing = () => {
      this.drawPoints = [];
      if (this.drawLine) {
        this.drawGroup.remove(this.drawLine);
        this.drawLine = null;
      }
    };

    // -------------------------
    // Eventos pointer (desktop / mobile)
    // -------------------------
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

    // -------------------------
    // ESCUCHA TRIGGER VR (continuo)
    // -------------------------
    ["right", "left"].forEach((hand) => {
      const controllerEl = document.querySelector(`#controller-${hand}`);
      if (!controllerEl) return;

      // 🔹 Trigger down: activa flag
      controllerEl.addEventListener("triggerdown", () => {
        this.handTriggerDown[hand] = true;
      });

      // 🔹 Trigger up: desactiva flag
      controllerEl.addEventListener("triggerup", () => {
        this.handTriggerDown[hand] = false;
      });
    });
  },

  tick: function () {
    if (!this.data.enabled) return;

    const sceneEl = this.el.sceneEl;

    // 🔹 Prioridad mano derecha, luego izquierda
    ["right", "left"].forEach((hand) => {
      if (!this.handTriggerDown[hand]) return;

      const controllerEl = document.querySelector(`#controller-${hand}`);
      if (!controllerEl) return;

      // 🔹 Obtener posición del controlador
      const pos = new THREE.Vector3();
      controllerEl.object3D.getWorldPosition(pos);

      this.addDrawPoint(pos); // 🔹 añade punto continuo mientras trigger está presionado
    });
  },
});