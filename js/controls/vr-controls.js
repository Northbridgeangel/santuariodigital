//vr-controls.js
//vr-controls.js
AFRAME.registerComponent("vr-controls", {
  schema: { speed: { type: "number", default: 0.05 } },

  init: function () {
    this.rig = document.querySelector("#rig");
    this.camera = document.querySelector("#camera");

    // Contenedores de controladores
    this.right = null;
    this.left = null;

    // -------------------------------
    // FUNCIONES DE CONTROLADORES
    // -------------------------------

    const locateControllers = () => {
      this.right = document.querySelector('[laser-controls][hand="right"]');
      this.left = document.querySelector('[laser-controls][hand="left"]');

      if (!this.right && !this.left) {
        console.log("[loc] No se detectan controladores VR");
      } else {
        if (this.right) console.log("[loc] Controlador detectado: right");
        if (this.left) console.log("[loc] Controlador detectado: left");
      }
    };

    const attachEvents = () => {
      if (this.right) {
        // Trigger
        this.right.addEventListener("triggerdown", () => {
          console.log("[loc] VR Trigger → CLICK");
          this.camera.dispatchEvent(new Event("click"));
        });

        // Movimiento
        this.right.addEventListener("axismove", moveRig);
      }

      if (this.left) {
        // Movimiento
        this.left.addEventListener("axismove", moveRig);
      }
    };

    // -------------------------------------
    // MOVIMIENTO — TU MISMO CÓDIGO ORIGINAL
    // -------------------------------------
    const moveRig = (e) => {
      const x = e.detail.axes[0];
      const y = e.detail.axes[1];
      if (Math.abs(x) < 0.1 && Math.abs(y) < 0.1) return;

      const dir = new THREE.Vector3();
      this.camera.object3D.getWorldDirection(dir);
      dir.y = 0;
      dir.normalize();

      const rightVec = new THREE.Vector3();
      rightVec.crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();

      const move = new THREE.Vector3();
      move.add(dir.multiplyScalar(-y * this.data.speed));
      move.add(rightVec.multiplyScalar(x * this.data.speed));

      this.rig.object3D.position.add(move);
    };

    // -------------------------------------
    // EVENTOS XR  → AQUÍ ESTÁ LA MAGIA NUEVA
    // -------------------------------------

    // Cuando la escena carga
    this.el.sceneEl.addEventListener("loaded", () => {
      console.log("[loc] Escena cargada → Buscando controladores…");
      locateControllers();
      attachEvents();
    });

    // Entras en VR
    this.el.sceneEl.addEventListener("enter-vr", () => {
      console.log("[loc] Modo VR activado → Rebuscando controladores…");
      locateControllers();
      attachEvents();
    });

    // Sales de VR
    this.el.sceneEl.addEventListener("exit-vr", () => {
      console.log("[loc] Modo VR desactivado");
    });

    // Cuando un mando se conecta
    this.el.sceneEl.addEventListener("controllerconnected", (evt) => {
      const hand =
        evt.detail.name ||
        evt.detail.component?.data?.hand ||
        "unknown";

      console.log(`[loc] Controlador conectado: ${hand}`);

      locateControllers();
      attachEvents();
    });

    // Cuando un mando se desconecta
    this.el.sceneEl.addEventListener("controllerdisconnected", (evt) => {
      const hand =
        evt.detail.name ||
        evt.detail.component?.data?.hand ||
        "unknown";

      console.log(`[loc] Controlador desconectado: ${hand}`);

      locateControllers();
    });
  },
});
