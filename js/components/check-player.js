// ==========================
// check-player
// ==========================
AFRAME.registerComponent("check-player", {
  schema: {
    targetRig: { type: "selector", default: "#rig" },
    targetDoor: { type: "selector", default: "#escenario" },
    colliderName: { type: "string", default: "Portal_blanco_collider" },
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
      doorSize.z,
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
