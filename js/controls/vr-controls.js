//vr-controls.js
AFRAME.registerComponent("vr-controls", {
  schema: { speed: { type: "number", default: 0.05 } },

  init: function () {
    // Asegúrate de que este ID coincide EXACTO con tu rig
    this.rig = document.querySelector("#rig") || document.querySelector("#Rig");
    this.camera = document.querySelector("#camera");

    this.leftCtrl = null;
    this.rightCtrl = null;
    this.leftPad = null;
    this.rightPad = null;

    console.log("[VR] Componente cargado");

    // -----------------------------------------
    // LOCALIZAR CONTROLADORES UNA SOLA VEZ
    // -----------------------------------------
    const locateControllers = () => {
      this.leftCtrl = document.querySelector('[laser-controls][hand="left"]');
      this.rightCtrl = document.querySelector('[laser-controls][hand="right"]');

      if (this.leftCtrl && this.leftCtrl.components["tracked-controls"]) {
        this.leftPad = this.leftCtrl.components["tracked-controls"].controller;
        console.log("[CTRL] Controlador LEFT detectado");
      }

      if (this.rightCtrl && this.rightCtrl.components["tracked-controls"]) {
        this.rightPad =
          this.rightCtrl.components["tracked-controls"].controller;
        console.log("[CTRL] Controlador RIGHT detectado");
      }

      if (!this.leftCtrl && !this.rightCtrl) {
        console.log("[CTRL] No se detectan controladores");
      }
    };

    // -----------------------------------------
    // MOVIMIENTO DEL RIG
    // -----------------------------------------
    const moveRig = () => {
      const gp = this.leftPad || this.rightPad;

      if (!gp || !gp.axes) return;

      // Quest 2/3 suele usar axes[2] y [3]
      const x = gp.axes[2] ?? gp.axes[0];
      const y = gp.axes[3] ?? gp.axes[1];

      if (Math.abs(x) < 0.1 && Math.abs(y) < 0.1) return;

      console.log("Joystick: X=" + x.toFixed(2) + " | Y=" + y.toFixed(2));

      const forward = new THREE.Vector3();
      this.camera.object3D.getWorldDirection(forward);
      forward.setY(0).normalize();

      const right = new THREE.Vector3();
      right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

      const movement = new THREE.Vector3();
      movement.add(forward.multiplyScalar(-y * this.data.speed));
      movement.add(right.multiplyScalar(x * this.data.speed));

      if (this.rig) {
        this.rig.object3D.position.add(movement);
      }
    };

    // -----------------------------------------
    // CLICK SOBRE MALLAS CON BOTÓN A
    // -----------------------------------------
    const clickCast = () => {
      if (!this.rightPad || !this.rightPad.buttons) return;

      const AButton = this.rightPad.buttons[0];
      if (!AButton || !AButton.pressed) return;

      console.log("[BTN] A presionado → click lanzado");

      if (!this.rightCtrl) return;

      const raycaster = this.rightCtrl.components.raycaster;
      if (!raycaster) return;

      const hits = raycaster.intersections;
      if (hits.length > 0) {
        const el = hits[0].object.el;
        console.log("[OBJ] Click en: " + (el.id || el.className));
        el.emit("click");
      }
    };

    // -----------------------------------------
    // LOOP PRINCIPAL (solo cosas dinámicas)
    // -----------------------------------------
    this.tick = () => {
      moveRig();
      clickCast();
    };

    // -----------------------------------------
    // EVENTOS XR
    // -----------------------------------------
    this.el.sceneEl.addEventListener("loaded", () => {
      console.log("[VR] Escena cargada");
      locateControllers();
    });

    this.el.sceneEl.addEventListener("enter-vr", () => {
      console.log("[VR] Entrando en VR");
      locateControllers();
    });

    this.el.sceneEl.addEventListener("controllerconnected", (evt) => {
      console.log("[CTRL] Conectado: " + evt.detail.name);
      locateControllers();
    });

    this.el.sceneEl.addEventListener("controllerdisconnected", (evt) => {
      console.log("[CTRL] Desconectado: " + evt.detail.name);
      locateControllers();
    });
  },
});
