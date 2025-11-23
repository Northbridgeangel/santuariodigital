//vr-controls.js
AFRAME.registerComponent("vr-locomotion", {
  schema: {
    speed: { type: "number", default: 0.05 },
    invertY: { type: "boolean", default: true }, // para invertir eje vertical si es necesario
  },

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

    // Detectar controladores conectados
    this.el.sceneEl.addEventListener("controllerconnected", (evt) => {
      const hand = evt.detail.hand || "unknown";
      console.log(`🎮 Controlador conectado: ${hand}`);
      if (hand === "left") this.controllers.left = evt.detail.target;
      else if (hand === "right") this.controllers.right = evt.detail.target;
    });

    // Detectar controladores desconectados
    this.el.sceneEl.addEventListener("controllerdisconnected", (evt) => {
      const hand = evt.detail.hand || "unknown";
      console.log(`❌ Controlador desconectado: ${hand}`);
      if (hand === "left") this.controllers.left = null;
      else if (hand === "right") this.controllers.right = null;
    });
  },

  tick: function () {
    if (!this.inVR) return;

    // Función para mover el rig según joystick
    const moveRig = (gp, hand) => {
      if (!gp || !gp.axes) return;

      // Detectar ejes dinámicamente
      let joyX = 0,
        joyY = 0;
      if (gp.axes.length >= 2) {
        joyX = gp.axes[0] || 0;
        joyY = gp.axes[1] || 0;
        if (this.data.invertY) joyY *= -1;
      }

      if (Math.abs(joyX) > 0.05 || Math.abs(joyY) > 0.05) {
        const dir = new THREE.Vector3();
        this.camera.object3D.getWorldDirection(dir);
        dir.y = 0;
        dir.normalize();

        const rightVec = new THREE.Vector3();
        rightVec.crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();

        const move = new THREE.Vector3();
        move.add(dir.multiplyScalar(-joyY * this.data.speed));
        move.add(rightVec.multiplyScalar(joyX * this.data.speed));

        this.rig.object3D.position.add(move);
      }

      console.log(
        `🕹 ${hand} joystick: X=${joyX.toFixed(2)}, Y=${joyY.toFixed(2)}`
      );

      // Botones
      if (gp.buttons[0]?.pressed) {
        console.log("✅ Botón A pulsado");
        if (hand === "right") this.simulateClick(this.controllers.right);
      }
      if (gp.buttons[1]?.pressed) console.log("✅ Botón B pulsado");
      if (gp.buttons[2]?.pressed) console.log("✅ Botón X pulsado");
      if (gp.buttons[3]?.pressed) console.log("✅ Botón Y pulsado");
    };

    // Procesar joystick derecho
    if (this.controllers.right) {
      const gpRight =
        this.controllers.right.components["laser-controls"]?.controller
          ?.gamepad;
      moveRig(gpRight, "right");
    }

    // Procesar joystick izquierdo (si quieres usarlo para otra cosa)
    if (this.controllers.left) {
      const gpLeft =
        this.controllers.left.components["laser-controls"]?.controller?.gamepad;
      moveRig(gpLeft, "left");
    }
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
