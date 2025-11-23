AFRAME.registerComponent("vr-controls", {
  schema: { speed: { type: "number", default: 0.05 } },

  init: function () {
    this.rig = document.querySelector("#rig");
    this.camera = document.querySelector("#camera");

    this.leftCtrl = null;
    this.rightCtrl = null;
    this.leftGamepad = null;
    this.rightGamepad = null;

    const log = (msg) => console.log(`%c${msg}`, "color:#0ff");

    // ============================================================
    // LOCALIZAR MANDOS
    // ============================================================
    const locate = () => {
      this.leftCtrl = document.querySelector('[laser-controls][hand="left"]');
      this.rightCtrl = document.querySelector('[laser-controls][hand="right"]');

      if (this.leftCtrl && this.leftCtrl.components["tracked-controls"]) {
        this.leftGamepad =
          this.leftCtrl.components["tracked-controls"].controller;
        log("[CTRL] Controlador LEFT detectado");
      }

      if (this.rightCtrl && this.rightCtrl.components["tracked-controls"]) {
        this.rightGamepad =
          this.rightCtrl.components["tracked-controls"].controller;
        log("[CTRL] Controlador RIGHT detectado");
      }

      if (!this.leftCtrl && !this.rightCtrl) {
        log("[CTRL] No se detectan controladores VR");
      }
    };

    // ============================================================
    // MOVIMIENTO (LOCUS VIA JOYSTICK)
    // ============================================================
    const movePlayer = () => {
      const gp = this.leftGamepad || this.rightGamepad;
      if (!gp || !gp.axes) return;

      const x = gp.axes[2] ?? gp.axes[0];
      const y = gp.axes[3] ?? gp.axes[1];

      if (Math.abs(x) < 0.1 && Math.abs(y) < 0.1) return;

      log(`[MOVE] Joystick → X:${x.toFixed(2)} Y:${y.toFixed(2)}`);

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

    // ============================================================
    // DETECCIÓN DE BOTONES (A, B, X, Y, TRIGGER, JOYSTICK…)
    // ============================================================
    const detectButtons = () => {
      const padR = this.rightGamepad;
      const padL = this.leftGamepad;

      const btn = (pad, index, name) => {
        if (!pad || !pad.buttons || !pad.buttons[index]) return;
        if (pad.buttons[index].pressed) log(`[BTN] ${name} PRESSED`);
      };

      // Right controller buttons
      btn(padR, 0, "A");
      btn(padR, 1, "B");
      btn(padR, 3, "Right Joystick Click");
      btn(padR, 4, "Right Trigger");
      btn(padR, 5, "Right Grip");

      // Left controller buttons
      btn(padL, 0, "X");
      btn(padL, 1, "Y");
      btn(padL, 3, "Left Joystick Click");
      btn(padL, 4, "Left Trigger");
      btn(padL, 5, "Left Grip");
    };

    // ============================================================
    // CLICK CON BOTÓN A → CLICK REAL SOBRE LA MALLA
    // ============================================================
    const clickCast = () => {
      if (!this.rightGamepad || !this.rightGamepad.buttons) return;

      const AButton = this.rightGamepad.buttons[0];
      if (!AButton || !AButton.pressed) return;

      log("[BTN] A PRESSED → intentando CLICK");

      // Raycaster del controlador derecho
      const rc = this.rightCtrl.components.raycaster;
      if (!rc) return;

      const hits = rc.intersections;
      if (hits.length > 0) {
        log(
          `[OBJ] Click en: ${
            hits[0].object.el.id || hits[0].object.el.className
          }`
        );
        hits[0].object.el.emit("click");
      }
    };

    // ============================================================
    // LOOP PRINCIPAL
    // ============================================================
    this.tick = () => {
      locate();
      movePlayer();
      detectButtons();
      clickCast();
    };

    // ============================================================
    // EVENTOS XR
    // ============================================================
    this.el.sceneEl.addEventListener("enter-vr", () => {
      log("[VR] Entrando en modo VR");
      locate();
    });

    this.el.sceneEl.addEventListener("exit-vr", () => {
      log("[VR] Saliendo del modo VR");
    });

    this.el.sceneEl.addEventListener("controllerconnected", (evt) => {
      log(`[CTRL] Controller conectado: ${evt.detail.name}`);
      locate();
    });

    this.el.sceneEl.addEventListener("controllerdisconnected", (evt) => {
      log(`[CTRL] Controller desconectado: ${evt.detail.name}`);
      locate();
    });
  },
});
