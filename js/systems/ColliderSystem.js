// ColliderSystem.js detecta la colisión y respeta passable
AFRAME.registerSystem("ColliderSystem", {
  init: function () {
    this.colliders = [];

    this.el.addEventListener("open-globals-ready", (ev) => {
      const { meshes } = ev.detail;

      console.log("🧱 ColliderSystem iniciado");

      meshes.forEach((mesh) => {
        const name = mesh.name.toLowerCase();

        const passable = /portal/i.test(name);
        const solid = /wall|pared|puerta|floor|ground/i.test(name);

        if (!passable && !solid) return;

        this.colliders.push({
          mesh,
          passable,
        });

        console.log(`🧱 Collider: ${mesh.name} | passable: ${passable}`);
      });

      console.log(`✅ Colliders activos: ${this.colliders.length}`);
      console.log("rig pos:", rig.object3D.position);
    });
  },

  //------------------------> Globalizar lastIntersection de cualquier collider desde cualquier script (Fly-mode)
  canMoveTo: function (targetPos, playerSize) {
    const playerBox = new THREE.Box3().setFromCenterAndSize(
      targetPos,
      playerSize,
    );

    for (const col of this.colliders) {
      if (col.passable) continue;

      const box = new THREE.Box3().setFromObject(col.mesh);

      if (playerBox.intersectsBox(box)) {
        return false; // ❌ movimiento bloqueado
      }
    }

    return true; // ✅ movimiento permitido
  },
});

//------------------------> La forma en la que me gustaría almacenar pero aún no descompusimos Flyghtmode
AFRAME.registerSystem("ColliderSystem", {
  init: function () {
    this.colliders = []; // [{ mesh, passable, box, lastIntersection, triggered }]
  },

  registerCollider: function (mesh, passable = false) {
    const box = new THREE.Box3().setFromObject(mesh);

    const collider = {
      mesh,
      passable,
      box,
      lastIntersection: false,
      triggered: false, // estado tipo fly-mode
    };

    this.colliders.push(collider);
    return collider; // devolver referencia para quien quiera guardarla
  },

  getColliderState: function (name) {
    const col = this.colliders.find((c) => c.mesh.name === name);
    if (!col) return null;
    return {
      lastIntersection: col.lastIntersection,
      triggered: col.triggered,
      passable: col.passable,
    };
  },
});
