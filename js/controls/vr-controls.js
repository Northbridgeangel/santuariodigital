// vr-controls.js
AFRAME.registerComponent("vr-controls", {
  schema: { speed: { type: "number", default: 0.05 } },

  init: function () {
    this.rig = document.querySelector("#rig");
    this.camera = document.querySelector("#camera");

    this.right = null;
    this.left = null;

    // -------------------------------------
    // DETECTAR CONTROLADORES
    // -------------------------------------

    const locateControllers = () => {
      this.right = document.querySelector("#controller-right");
      this.left = document.querySelector("#controller-left");

      if (!this.right && !this.left) {
        console.log("[loc] No se detectan controladores VR");
      } else {
        if (this.right) console.log("[loc] Controlador detectado: right");
        if (this.left) console.log("[loc] Controlador detectado: left");
      }
    };

    // -------------------------------------
    // MOVIMIENTO — MISMO CÓDIGO TUYO
    // -------------------------------------
    const moveRig = (e) => {
      if (!e.detail || !e.detail.axes) return;

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
    // ENGANCHAR EVENTOS
    // -------------------------------------
    const attachEvents = () => {
      if (this.right) {
        this.right.addEventListener("triggerdown", () => {
          console.log("[loc] VR Trigger → CLICK");
          this.camera.dispatchEvent(new Event("click"));
        });

        this.right.addEventListener("axismove", moveRig);
      }

      if (this.left) {
        this.left.addEventListener("axismove", moveRig);
      }
    };

    // -------------------------------------
    // EVENTOS XR
    // -------------------------------------

    // Escena cargada
    this.el.sceneEl.addEventListener("loaded", () => {
      console.log("[loc] Escena cargada → buscando controladores…");
      locateControllers();
      attachEvents();
    });

    // Entras en VR
    this.el.sceneEl.addEventListener("enter-vr", () => {
      console.log("[loc] Modo VR activado → rebuscando controladores…");
      // Se reenganchan porque WebXR los activa aquí realmente
      setTimeout(() => {
        locateControllers();
        attachEvents();
      }, 300);
    });

    // Sales de VR
    this.el.sceneEl.addEventListener("exit-vr", () => {
      console.log("[loc] Modo VR desactivado");
    });

    // Mando conectado
    this.el.sceneEl.addEventListener("controllerconnected", (evt) => {
      const hand =
        evt.detail.name || evt.detail.component?.data?.hand || "unknown";

      console.log(`[loc] Controlador conectado: ${hand}`);
      locateControllers();
      attachEvents();
    });

    // Mando desconectado
    this.el.sceneEl.addEventListener("controllerdisconnected", (evt) => {
      const hand =
        evt.detail.name || evt.detail.component?.data?.hand || "unknown";

      console.log(`[loc] Controlador desconectado: ${hand}`);
      locateControllers();
    });
  },
});
