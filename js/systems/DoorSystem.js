// js/systems/DoorSystem.js

// ==========================
// check-door (multi collider)
// Portales: usan intersección entre Box3 y disparan HUD / fly mode.
// Sensores de puerta (Btn-pta): se abre/cierra la puerta según proximidad del jugador.
// ==========================
AFRAME.registerComponent("check-door", {
  schema: {
    targetRig: { type: "selector", default: "#rig" },
  },

  init: function () {
    // ==========================
    // 1️⃣ Referencia al jugador
    // ==========================
    this.rig =
      this.data.targetRig.querySelector("a-entity[camera]") ||
      this.data.targetRig;

    this.colliders = [];
    this.playerComp = null;

    // ==========================
    // 2️⃣ Esperar core listo
    // ==========================
    window.OpenCentralGlobals.core.sceneEl.addEventListener(
      "open-globals-ready",
      () => this.setupColliders(),
    );
  },

  // ==========================
  // SETUP COLLIDERS
  // ==========================
  setupColliders: function () {
    const core = window.OpenCentralGlobals.core;

    this.playerComp = this.data.targetRig.components["check-player"];
    if (!this.playerComp) {
      console.warn("⚠️ check-player no encontrado en rig");
      return;
    }

    core.interactiveMeshes.forEach((mesh) => {
      let type = null;
      if (mesh.name.startsWith("Portal")) type = "portal";
      if (mesh.name.startsWith("Btn-pta")) type = "sensor";

      const box =
        type === "portal" ? new THREE.Box3().setFromObject(mesh) : null;

      // ==========================
      // Guardar posición inicial puertas
      // ==========================
      if (mesh.name.startsWith("Puerta")) {
        if (!mesh.initialPosition) {
          mesh.initialPosition = mesh.position.clone();
          mesh.targetPosition = mesh.initialPosition.clone();
        }
      }

      // ==========================
      // CONFIGURAR SENSOR → PUERTA
      // ==========================
      if (type === "sensor") {
        const door = this.findNearestDoor(mesh);

        if (door) {
          mesh.controlledDoor = door;

          // 🔹 Calcular ancho REAL una sola vez (LOCAL)
          if (!door.geometry.boundingBox) {
            door.geometry.computeBoundingBox();
          }

          const localBox = door.geometry.boundingBox.clone();
          const size = new THREE.Vector3();
          localBox.getSize(size);

          const horizontalX = size.x;
          const horizontalZ = size.z;

          let ejeAncho = horizontalX > horizontalZ ? "x" : "z"; //comprobación del valor y toggle del eje
          let anchoLocal = Math.max(horizontalX, horizontalZ); //Math->Resolve real numbers  of x and z?

          // 🔹 Guardamos datos en la puerta (no recalcular cada tick)
          door._doorData = {
            ejeAncho,
            anchoLocal,
          };

          /*console.log(`🚪 Puerta vinculada: ${door.name}`);
          console.log("📏 LOCAL SIZE:", size);
          console.log("📐 Eje ancho:", ejeAncho);
          console.log("📐 Ancho local:", anchoLocal);*/
        }
      }

      this.colliders.push({
        name: mesh.name,
        mesh,
        box,
        type,
        triggered: false,
        lastIntersection: false,
      });
    });

    /*console.log(
      "🚪 check-door inicializado | Colliders:",
      this.colliders.map((c) => c.name),
    );*/

    this.initializeHUD();
  },

  // ==========================
  // 3️⃣ HUD INIT (solo portales con materiales reales)
  // ==========================
  initializeHUD: function () {
  // Wings
  this.hudWings = document.querySelector("#hud-wings");
  this.hudText = document.querySelector("#hud-wings-text");
  this.wingsMaterial = this.getMaterialByName("Alabastro blanco");

  if (this.hudWings && this.hudText) {
    this.updateHUD(this.hudWings, this.hudText, "OFF", this.wingsMaterial);
  }

  // Cube
  this.hudCube = document.querySelector("#hud-cube");
  this.hudCubeText = document.querySelector("#hud-cube-text");
  this.cubeMaterial = this.getMaterialByName("Alabastro rosa");

  if (this.hudCube && this.hudCubeText) {
    this.updateHUD(this.hudCube, this.hudCubeText, "OFF", this.cubeMaterial);
  }

  // Stars (dejamos comentado por ahora)
  /*
  this.hudStars = document.querySelector("#hud-stars");
  this.hudStarsText = document.querySelector("#hud-stars-text");
  this.starsMaterial = this.getMaterialByName("Cristal dorado");
  if (this.hudStars && this.hudStarsText) {
      this.updateHUD(this.hudStars, this.hudStarsText, "OFF", this.starsMaterial);
  }
  */
  },

  // ==========================
  // Función para buscar material por nombre
  // ==========================
  getMaterialByName: function (materialName) {
    let foundMat = null;
    this.el.sceneEl.object3D.traverse((obj) => {
      if (obj.isMesh) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((mat) => {
          if (mat.name === materialName) foundMat = mat;
        });
      }
    });
    return foundMat;
  },

  // ==========================
  // Actualizar HUD con material
  // ==========================
  updateHUD: function (hud, text, state, material) {
    if (!hud || !text || !material) return;

    hud.object3D.traverse((obj) => {
      if (obj.isMesh) {
        obj.material = material.clone(); // clonamos para no tocar el original
        obj.material.opacity = state === "ON" ? 1 : 0.5;
        obj.material.needsUpdate = true;
      }
    });

    text.setAttribute("text-geometry", "value", state);
  },

  // ==========================
  // BUSCAR PUERTA MÁS CERCANA
  // ==========================
  findNearestDoor: function (sensorMesh) {
    const core = window.OpenCentralGlobals.core;

    let nearestDoor = null;
    let minDistance = Infinity;

    const sensorWorldPos = new THREE.Vector3();
    sensorMesh.getWorldPosition(sensorWorldPos);

    core.interactiveMeshes.forEach((mesh) => {
      if (mesh.name.startsWith("Puerta")) {
        const doorWorldPos = new THREE.Vector3();
        mesh.getWorldPosition(doorWorldPos);

        const distance = sensorWorldPos.distanceTo(doorWorldPos);
        if (distance < minDistance) {
          minDistance = distance;
          nearestDoor = mesh;
        }
      }
    });

    return nearestDoor;
  },

  // ==========================
  // TICK
  // ==========================
  tick: function () {
    if (!this.colliders.length || !this.playerComp) return;

    const rigPos = new THREE.Vector3();
    this.rig.object3D.getWorldPosition(rigPos);

    const rigBox = new THREE.Box3().setFromCenterAndSize(
      rigPos,
      this.playerComp.playerSize,
    );

    const lerpFactor = 0.0025;

    this.colliders.forEach((collider) => {
      let isIntersecting = false;

      // ==========================
      // PORTALES
      // ==========================
      if (collider.type === "portal") {
        if (!collider.box) return;

        isIntersecting = rigBox.intersectsBox(collider.box);

        if (isIntersecting && !collider.lastIntersection) {
          collider.triggered = !collider.triggered;

          if (collider.name === "Portal_blanco_collider") {
            this.updateHUD(
              this.hudWings,
              this.hudText,
              collider.triggered ? "ON" : "OFF",
              this.wingsMaterial,
            );
            const flyComp = this.el.sceneEl.components["fly-mode"];
            if (flyComp) flyComp.toggleFlyMode();
          }

          if (collider.name === "Portal_alabastro_collider") {
            this.updateHUD(
              this.hudCube,
              this.hudCubeText,
              collider.triggered ? "ON" : "OFF",
              this.cubeMaterial,
            );
            const arComp = this.el.sceneEl.components["activate-ar"];
            if (arComp) arComp.toggleAR();
          }

          // Para Stars (de momento comentado)
          // if (collider.name === "Portal_dorado_collider") {
          //   this.updateHUD(this.hudStars, this.hudStarsText, collider.triggered ? "ON" : "OFF", this.starsMaterial);
          // }
        }
      }

      // ==========================
      // SENSORES: se activan si intersectan o fueron clickados
      // ==========================
      if (collider.type === "sensor") {
        const sensorPos = new THREE.Vector3();
        collider.mesh.getWorldPosition(sensorPos);

        const dx = rigPos.x - sensorPos.x;
        const dz = rigPos.z - sensorPos.z;
        const radius = 0.28;

        isIntersecting = Math.sqrt(dx * dx + dz * dz) < radius;

        const door = collider.mesh.controlledDoor;
        if (!door || !door._doorData) return;

        // 🔹 D1. Sensor activo si intersecta o fue clickado
        const sensorActive = isIntersecting || selectedMesh === collider.mesh;

        if (sensorActive && !collider.lastIntersection) {
          if (selectedMesh === collider.mesh && collider.triggered) {
            // D2. Click en sensor y puerta abierta → cerrar
            door.targetPosition = door.initialPosition.clone();
            collider.triggered = false;
            console.log(`Sensor ${collider.name} clickeado → CERRANDO puerta`);
          } else {
            // Abrir puerta
            const { ejeAncho, anchoLocal } = door._doorData;

            const worldRight = new THREE.Vector3(-1, 0, 0).applyQuaternion(
              door.quaternion,
            );
            const worldForward = new THREE.Vector3(0, 0, -1).applyQuaternion(
              door.quaternion,
            );
            const worldDirection = ejeAncho === "x" ? worldRight : worldForward;

            let scaleFactor = ejeAncho === "x" ? door.scale.x : door.scale.z;
            const offset = worldDirection.multiplyScalar(
              anchoLocal * scaleFactor,
            );

            door.targetPosition = door.initialPosition.clone().add(offset);
            collider.triggered = true;

            console.log(`Sensor ${collider.name} → ABRIENDO puerta`);
          }

          // Deseleccionamos sensor si fue clickado
          if (selectedMesh === collider.mesh) {
            resetMesh(collider.mesh);
            selectedMesh = null;
            console.log(`Sensor ${collider.name} deseleccionado tras click`);
          }
        } else if (!sensorActive && collider.lastIntersection) {
          door.targetPosition = door.initialPosition.clone();
          collider.triggered = false;
          console.log(`Sensor ${collider.name} → CERRADO`);
        }

        if (door.position && door.targetPosition) {
          door.position.lerp(door.targetPosition, lerpFactor);
        }
      }

      collider.lastIntersection = isIntersecting;
    });
  },
});
