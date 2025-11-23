//vr-controls.js
AFRAME.registerComponent("joystick-locomotion", {
  schema: {
    speed: { type: "number", default: 1.5 },
  },

  init() {
    this.rig = document.querySelector("#rig");
    this.camera = document.querySelector("#camera");
    this.left = document.querySelector("#controller-left");
    this.right = document.querySelector("#controller-right");

    this.joystick = { x: 0, y: 0 };

    const joystickMove = (evt) => {
      const axes = evt.detail.axis;
      if (!axes) return;

      this.joystick.x = axes[0];
      this.joystick.y = axes[1];

      console.log(
        `[joy] Axes → x:${this.joystick.x.toFixed(
          2
        )}  y:${this.joystick.y.toFixed(2)}`
      );
    };

    this.left.addEventListener("axismove", joystickMove);
    this.right.addEventListener("axismove", joystickMove);

    console.log("[joy] Locomoción por joystick inicializada ✔️");
  },

  tick(time, delta) {
    if (!this.rig || !this.camera) return;

    if (Math.abs(this.joystick.x) < 0.05 && Math.abs(this.joystick.y) < 0.05)
      return;

    const dt = delta / 1000;
    const speed = this.data.speed;

    const cameraObj = this.camera.object3D;
    const rigObj = this.rig.object3D;

    const forward = new THREE.Vector3();
    cameraObj.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3();
    right
      .crossVectors(forward, new THREE.Vector3(0, 1, 0))
      .negate()
      .normalize();

    const moveX = right.multiplyScalar(this.joystick.x * speed * dt);
    const moveZ = forward.multiplyScalar(-this.joystick.y * speed * dt);

    rigObj.position.add(moveX);
    rigObj.position.add(moveZ);
  },
});
