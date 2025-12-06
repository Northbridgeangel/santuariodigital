// vr-controls.js -> sistema PAD
AFRAME.registerComponent("test-joystick", {
  schema: {
    pads: { default: {} }, // left, right, unknown
  },

  init: function () {
    console.log("🟢 Componente Test Joystick Quest inicializado");

    this.xrSessionActive = false;

    this.el.sceneEl.addEventListener("enter-vr", () => {
      const session = this.el.sceneEl.xrSession;
      if (!session) return;

      this.xrSessionActive = true;
      console.log("🟢 Session WebXR activa");

      session.addEventListener("inputsourceschange", (evt) => {
        // ➕ AÑADIDOS
        evt.added.forEach((source) => {
          if (!source.gamepad) return;

          const hand = source.handedness || "unknown";

          // Creamos la estructura SOLO UNA VEZ
          this.data.pads[hand] = {
            source: source,
            axes: source.gamepad.axes,
            buttons: source.gamepad.buttons,
          };

          console.log(`🎮 Gamepad añadido: ${hand}`);
        });

        // ➖ ELIMINADOS
        evt.removed.forEach((source) => {
          if (!source.gamepad) return;

          const hand = source.handedness || "unknown";

          if (this.data.pads[hand]) {
            console.log(`❌ Gamepad eliminado: ${hand}`);
            delete this.data.pads[hand];
          }
        });
      });
    });

    this.el.sceneEl.addEventListener("exit-vr", () => {
      this.xrSessionActive = false;
      this.data.pads = {};
      console.log("🔴 Saliendo de VR");
    });
  },

  tick: function () {
    if (!this.xrSessionActive) return;

    const pads = this.data.pads;

    // Leemos SIN RECREAR NADA
    for (const hand in pads) {
      const pad = pads[hand];
      const gp = pad.source.gamepad;

      // 🔘 Botones
      gp.buttons.forEach((btn, i) => {
        if (btn.pressed) {
          console.log(`🎯 Botón XR ${hand} #${i} pulsado`);
        }
      });

      // 🕹 Joystick
      if (gp.axes.length >= 2) {
        //?? = solo salta si el valor es null o undefined, no si es 0
        const x = gp.axes[0] ?? gp.axes[2] ?? 0;
        const y = gp.axes[1] ?? gp.axes[3] ?? 0;

        const Speed = 0.02;

        if (Math.abs(x) > 0.01 || Math.abs(y) > 0.01) {
          // 1️⃣ Obtener flag global de vuelo
          const scene = this.el.sceneEl;
          const isFlying = scene.isFlyMode === true;

          // 2️⃣ Obtener rig
          const rig = document.querySelector("#rig");
          if (!rig) return;

          // 3️⃣ Obtener cámara dentro del rig
          const cam =
            rig.querySelector("[camera]") || rig.querySelector("a-camera");
          if (!cam) return;

          // 4️⃣ Si estamos en modo vuelo Y este es el joystick izquierdo:
          if (isFlying && hand === "left") {
            // Movimiento vertical (y → altura)
            rig.object3D.position.y += y * Speed; // y+ sube, y- baja

            // Lateralidad izquierda/derecha sigue igual que antes: orientada a la cámara
            if (Math.abs(x) > 0.01) {
              const camDir = cam.object3D.getWorldDirection(
                new THREE.Vector3()
              );
              const angle = Math.atan2(camDir.x, camDir.z);

              const lateral = new THREE.Vector3(x, 0, 0);
              lateral.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);

              rig.object3D.position.add(lateral.multiplyScalar(Speed));
            }

            return; // Muy importante: no seguir al movimiento normal
          }

          // 5️⃣ Si NO estamos en vuelo (modo normal para ambos mandos)
          const moveVector = new THREE.Vector3(x, 0, y); // y adelante positivo

          // Orientar a la cámara
          const camDir = cam.object3D.getWorldDirection(new THREE.Vector3());
          const angle = Math.atan2(camDir.x, camDir.z);

          moveVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);

          // Aplicar movimiento
          rig.object3D.position.add(moveVector.multiplyScalar(Speed));
        }
      }
    }
  },
});
