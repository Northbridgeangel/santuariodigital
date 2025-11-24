//vr-controls.js
AFRAME.registerComponent("vr-locomotion", {
  schema: { speed: { type: "number", default: 0.05 } },

  init: function () {
    this.rig = document.querySelector("#rig");
    this.camera = document.querySelector("#camera");

    this.controllers = { left: null, right: null };
    this.inVR = false;
    this.raycaster = new THREE.Raycaster();

    // Entrar/salir de VR
    this.el.sceneEl.addEventListener("enter-vr", () => {
      this.inVR = true;
      console.log("🟢 Entrando en VR");
    });
    this.el.sceneEl.addEventListener("exit-vr", () => {
      this.inVR = false;
      console.log("🔴 Saliendo de VR");
    });

    // Detectar controladores conectados por id
    this.el.sceneEl.addEventListener("controllerconnected", (evt) => {
      const id = evt.detail.target.id;
      console.log(`🎮 Controlador conectado: ${id}`);
      if (id === "controller-left") this.controllers.left = evt.detail.target;
      if (id === "controller-right") this.controllers.right = evt.detail.target;
    });

    // Detectar controladores desconectados
    this.el.sceneEl.addEventListener("controllerdisconnected", (evt) => {
      const id = evt.detail.target.id;
      console.log(`❌ Controlador desconectado: ${id}`);
      if (id === "controller-left") this.controllers.left = null;
      if (id === "controller-right") this.controllers.right = null;
    });
  },

  tick: function () {
    if (!this.inVR) return;

    const moveRig = (controllerEl) => {
      if (!controllerEl) return;

      // Comprobar que el gamepad exista
      const gp = controllerEl.components["laser-controls"]?.controller?.gamepad;
      if (!gp) return;

      // Detectar axes: si existen 2/3 los usamos, si no 0/1
      const x = gp.axes[2] !== undefined ? gp.axes[2] : gp.axes[0] || 0;
      const y = gp.axes[3] !== undefined ? gp.axes[3] : gp.axes[1] || 0;

      if (Math.abs(x) > 0.05 || Math.abs(y) > 0.05) {
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
      }

      console.log(
        `🕹 Joystick (${controllerEl.id}): X=${x.toFixed(2)}, Y=${y.toFixed(2)}`
      );

      // Detectar botones A/B/X/Y
      if (gp.buttons[0]?.pressed) {
        console.log("✅ Botón A pulsado");
        this.simulateClick(controllerEl);
      }
      if (gp.buttons[1]?.pressed) console.log("✅ Botón B pulsado");
      if (gp.buttons[2]?.pressed) console.log("✅ Botón X pulsado");
      if (gp.buttons[3]?.pressed) console.log("✅ Botón Y pulsado");
    };

    // Procesar joystick derecho
    moveRig(this.controllers.right);
    // Si quieres, también joystick izquierdo:
    // moveRig(this.controllers.left);
  },

  simulateClick: function (controllerEl) {
    if (!controllerEl) return;

    const origin = new THREE.Vector3();
    const direction = new THREE.Vector3(0, 0, -1);

    controllerEl.object3D.getWorldPosition(origin);
    controllerEl.object3D.getWorldDirection(direction);

    this.raycaster.set(origin, direction);
    const intersects = this.raycaster.intersectObjects(
      this.el.sceneEl.object3D.children,
      true
    );

    for (let inter of intersects) {
      if (inter.object.el?.classList.contains("interactable")) {
        console.log("🎯 Click en malla:", inter.object.el.id);
        inter.object.el.emit("click");
        break;
      }
    }
  },
});
