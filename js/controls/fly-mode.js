// fly-mode.js

// ==========================
// check-player
// ==========================
AFRAME.registerComponent("check-player", {
  schema: {
    targetRig: { type: "selector", default: "#rig" },
    targetDoor: { type: "selector", default: "#escenario" },
    colliderName: { type: "string", default: "Puerta_blanca_collider" },
  },

  init: function () {
    this.rig = this.data.targetRig;
    if (!this.rig)
      return console.error("❌ No se encontró el rig para check-player");

    this.movable = this.rig.querySelector("a-entity[camera]") || this.rig;
    this.prevPos = new THREE.Vector3();
    this.movable.object3D.getWorldPosition(this.prevPos);
    this.moving = false;
    this.epsilon = 0.001;
    this.doorMesh = null;
    this.playerSize = new THREE.Vector3(); // <-- tamaño del jugador (minSize por defecto)

    const escenario = this.data.targetDoor;
    if (!escenario) return console.error("❌ No se encontró el escenario");

    escenario.addEventListener("model-loaded", () => {
      const mesh = escenario.getObject3D("mesh");
      if (!mesh) return console.error("❌ Mesh del escenario no disponible");

      mesh.traverse((child) => {
        if (child.name === this.data.colliderName && child.isMesh) {
          this.doorMesh = child;
        }
      });

      if (!this.doorMesh)
        return console.error("❌ Collider de la puerta no encontrado");

      this.setPlayerVolume(this.doorMesh);
    });
  },

  tick: function () {
    const worldPos = new THREE.Vector3();
    this.movable.object3D.getWorldPosition(worldPos);
    const distance = worldPos.distanceTo(this.prevPos);

    if (distance > this.epsilon) {
      //if (!this.moving) console.log("🟢 Move Start");
      this.moving = true;
      //console.log(`📍 Posición del rig: x=${worldPos.x.toFixed(2)}, y=${worldPos.y.toFixed(2)}, z=${worldPos.z.toFixed(2)}`);
    } else if (this.moving) {
      //console.log("🔴 Move End");
      this.moving = false;
    }

    this.prevPos.copy(worldPos);
  },

  setPlayerVolume: function (doorMesh) {
    const doorBox = new THREE.Box3().setFromObject(doorMesh);
    const doorSize = new THREE.Vector3();
    doorBox.getSize(doorSize);

    // Tamaño mínimo del jugador (por defecto)
    const minSize = new THREE.Vector3(
      doorSize.x / 2,
      doorSize.y / 2,
      doorSize.z
    );
    this.playerSize.copy(minSize); // <-- guardamos el minSize

    //const minVolume = minSize.x * minSize.y * minSize.z;
    //const maxSize = new THREE.Vector3(doorSize.x, doorSize.y, doorSize.z * 12);
    //const maxVolume = maxSize.x * maxSize.y * maxSize.z;

    //console.log("📏 Collider tamaño:", doorSize, "| Volumen:", (doorSize.x*doorSize.y*doorSize.z).toFixed(3));
    //console.log("📏 PlayerVolume mínimo:", minSize, "| Volumen:", minVolume.toFixed(3));
    //console.log("📏 PlayerVolume máximo:", maxSize, "| Volumen:", maxVolume.toFixed(3));
  },
});

// ==========================
// fly-mode
// ==========================
AFRAME.registerComponent("fly-mode", {
  schema: {
    active: { type: "boolean", default: false },
  },

  init: function () {
    this.isFlying = this.data.active;
    this.el.sceneEl.isFlyMode = this.isFlying; // flag global accesible
    // Referencias directas al Head-Up Display de Wings ON/OFF existente en el HTML
    this.indicator = document.getElementById("flyModeIndicator");
    this.text = document.getElementById("flyModeText");

    console.log(
      "🪶 FlyMode inicializado | Estado:",
      this.isFlying ? "Activo" : "Desactivado"
    );

    // Mostrar estado inicial en el HUD
    this.updateWingsHUD(this.isFlying);
  },

  updateWingsHUD: function (state) {
    if (!this.indicator || !this.text) return;

    if (state) {
      this.indicator.classList.add("on");
      this.indicator.classList.remove("off");
      this.text.textContent = "ON";
    } else {
      this.indicator.classList.add("off");
      this.indicator.classList.remove("on");
      this.text.textContent = "OFF";
    }
  },

  toggleFlyMode: function () {
    this.isFlying = !this.isFlying;
    this.el.sceneEl.isFlyMode = this.isFlying;
    console.log(
      this.isFlying ? "🛫 Flight Mode ACTIVADO" : "🛬 Flight Mode DESACTIVADO"
    );
    this.updateWingsHUD(this.isFlying);
  },
});


// ==========================
// check-door
// ==========================
AFRAME.registerComponent("check-door", {
  schema: {
    targetDoor: { type: "selector", default: "#escenario" },
    targetRig: { type: "selector", default: "#rig" },
    colliderName: { type: "string", default: "Puerta_blanca_collider" },
    playerComponent: { type: "selector", default: "#rig" }, // referencia al check-player
  },

  init: function () {
    this.movable =
      this.data.targetRig.querySelector("a-entity[camera]") ||
      this.data.targetRig;
    const escenario = this.data.targetDoor;
    if (!escenario) return console.error("❌ No se encontró el escenario");

    escenario.addEventListener("model-loaded", () => {
      const mesh = escenario.getObject3D("mesh");
      if (!mesh) return console.error("❌ Mesh del escenario no disponible");

      let doorMesh = null;
      mesh.traverse((child) => {
        if (child.name === this.data.colliderName && child.isMesh)
          doorMesh = child;
      });

      if (!doorMesh || !doorMesh.geometry) return; //console.error("❌ Collider de la puerta no encontrado");

      this.colliderBox = new THREE.Box3().setFromObject(doorMesh);

      const center = new THREE.Vector3();
      this.colliderBox.getCenter(center);
      const size = new THREE.Vector3();
      this.colliderBox.getSize(size);

      //console.log("📏 Tamaño del collider:", size);
      //console.log("📍 Centro del collider:", center);

      this.triggered = false;

      // Obtenemos referencia al componente check-player
      this.playerComp = this.data.playerComponent.components["check-player"];
      //if (!this.playerComp) console.error("❌ check-player no encontrado en rig");
    });

    // Estado inicial
    this.triggered = false; // estado ON/OFF
    this.lastIntersection = false; // para detectar cambios
    this.hudInitialized = false;

    // Referencias HUD
    this.hudWings = document.querySelector("#hud-wings");
    this.hudText = document.querySelector("#hud-wings-text");
  },

  tick: function () {
    if (!this.colliderBox || !this.playerComp) return;

    const rigPos = new THREE.Vector3();
    this.movable.object3D.getWorldPosition(rigPos);

    const rigBox = new THREE.Box3().setFromCenterAndSize(
      rigPos,
      this.playerComp.playerSize
    );

    const hudWings = this.hudWings;
    const hudText = this.hudText;

const updateHUDWings = (state) => {
  if (!hudWings || !hudText) return;

  // Fondo del HUD
  hudWings.object3D.traverse((obj) => {
    if (obj.isMesh) {
      if (state === "ON") {
        obj.material = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 1,
          emissive: 0xffffff,
          emissiveIntensity: 1,
          side: THREE.DoubleSide,
        });
      } else {
        obj.material = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.5,
          side: THREE.DoubleSide,
        });
      }
      obj.material.needsUpdate = true;
    }
  });

  // Texto 3D volumétrico (text-geometry)
  hudText.setAttribute("text-geometry", "value", state);
  if (
    hudText.components["text-geometry"] &&
    hudText.components["text-geometry"].mesh
  ) {
    if (state === "ON") {
      hudText.components["text-geometry"].mesh.material =
        new THREE.MeshStandardMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 1,
          emissive: 0xffffff,
          emissiveIntensity: 1,
          side: THREE.DoubleSide,
        });
    } else {
      hudText.components["text-geometry"].mesh.material =
        new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.5,
          side: THREE.DoubleSide,
        });
    }
    hudText.components["text-geometry"].mesh.material.needsUpdate = true;
  }
};

    // Inicializar HUD la primera vez
    if (!this.hudInitialized) {
      updateHUDWings("OFF");
      this.hudInitialized = true;
    }

    // Detectamos cruce del collider
    const isIntersecting = rigBox.intersectsBox(this.colliderBox);

    if (isIntersecting && !this.lastIntersection) {
      // Cruce detectado → toggle
      this.triggered = !this.triggered;

      updateHUDWings(this.triggered ? "ON" : "OFF");

      const flyComp = this.el.sceneEl.components["fly-mode"];
      if (flyComp) flyComp.toggleFlyMode();
      else
        console.warn("⚠️ No se encontró el componente fly-mode en la escena");
    }

    // Guardamos estado para el siguiente frame
    this.lastIntersection = isIntersecting;
  },
});
