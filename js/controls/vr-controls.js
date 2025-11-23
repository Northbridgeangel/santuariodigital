//vr-controls.js
AFRAME.registerComponent("vr-locomotion", {
  schema: {
    speed: { type: "number", default: 0.05 }, // velocidad de locomoción
  },

  init: function () {
    this.rig = document.querySelector("#rig");
    this.camera = document.querySelector("#camera");
    this.right = document.querySelector("#controller-right");
    this.left = document.querySelector("#controller-left");

    this.inVR = false;

    // Mostrar logs al entrar y salir de VR
    this.el.sceneEl.addEventListener("enter-vr", () => {
      this.inVR = true;
      console.log("🟢 Entrando en VR");
    });
    this.el.sceneEl.addEventListener("exit-vr", () => {
      this.inVR = false;
      console.log("🔴 Saliendo de VR");
    });

    // Detectar controladores
    this.el.sceneEl.addEventListener("controllerconnected", (evt) => {
      console.log("🎮 Controlador conectado:", evt.detail.name);
    });
    this.el.sceneEl.addEventListener("controllerdisconnected", (evt) => {
      console.log("❌ Controlador desconectado:", evt.detail.name);
    });

    // Raycaster para clicks con botón A
    this.raycaster = new THREE.Raycaster();
  },

  tick: function () {
    if (!this.inVR) return;

    // Recolectar gamepads de los controladores
    const gpRight =
      this.right?.components["laser-controls"]?.controller?.gamepad;
    const gpLeft = this.left?.components["laser-controls"]?.controller?.gamepad;

    // Mover rig según joystick derecho (si existe)
    if (gpRight) {
      const x = gpRight.axes[2] || 0; // horizontal
      const y = gpRight.axes[3] || 0; // vertical
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

      // Mostrar joystick en consola
      console.log("🕹 Joystick Right:", x.toFixed(2), y.toFixed(2));

      // Botón A (índice 0 normalmente)
      if (gpRight.buttons[0]?.pressed) {
        console.log("✅ Botón A pulsado");
        this.simulateClick(this.right);
      }
      if (gpRight.buttons[1]?.pressed) console.log("✅ Botón B pulsado");
      if (gpRight.buttons[2]?.pressed) console.log("✅ Botón X pulsado");
      if (gpRight.buttons[3]?.pressed) console.log("✅ Botón Y pulsado");
    }

    // Podrías hacer lo mismo para el joystick izquierdo si quieres mover otra cosa
  },

  simulateClick: function (controllerEl) {
    // Raycast hacia objetos interactables
    const origin = new THREE.Vector3();
    const direction = new THREE.Vector3(0, 0, -1); // frente al controlador

    controllerEl.object3D.getWorldPosition(origin);
    controllerEl.object3D.getWorldDirection(direction);

    this.raycaster.set(origin, direction);
    const scene = this.el.sceneEl.object3D;
    const intersects = this.raycaster.intersectObjects(scene.children, true);

    for (let inter of intersects) {
      if (inter.object.el?.classList.contains("interactable")) {
        console.log("🎯 Click en malla:", inter.object.el.id);
        inter.object.el.emit("click");
        break; // solo el primero
      }
    }
  },
});
