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
        const x = gp.axes[0] || gp.axes[2] || 0; // izquierda/derecha
        const y = gp.axes[1] || gp.axes[3] || 0; // adelante/atrás

        const Speed = 0.02;

        // Solo actuamos si realmente se está moviendo
        if (Math.abs(x) > 0.01 || Math.abs(y) > 0.01) {
          // 1️⃣ Flag global flight mode
          const scene = this.el.sceneEl;
          const isFlying = scene.isFlyMode === true;

          // 2️⃣ Rig
          const rig = document.querySelector("#rig");
          if (!rig) return;

          // 3️⃣ Cámara
          const cam =
            rig.querySelector("[camera]") || rig.querySelector("a-camera");
          if (!cam) return;

          // -----------------------------------------------------------------------------
          //                           🎮 JOYSTICK IZQUIERDO
          // -----------------------------------------------------------------------------
          if (hand === "left") {
            // 🟦 SIEMPRE: Movimiento lateral izquierda/derecha relativo a cámara
            if (Math.abs(x) > 0.01) {
              const camDir = cam.object3D.getWorldDirection(
                new THREE.Vector3()
              );
              const angle = Math.atan2(camDir.x, camDir.z);

              const lateral = new THREE.Vector3(x, 0, 0);
              lateral.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);

              rig.object3D.position.add(lateral.multiplyScalar(Speed));
            }

            // 🟩 Flight mode → adelante/atrás se convierte en subir/bajar
            if (isFlying) {
              if (Math.abs(y) > 0.01) {
                rig.object3D.position.y -= y * Speed;
                // (-y) porque en tu mando: adelante=negativo, atrás=positivo
              }
              return; // No seguir al modo normal
            }

            // 🟧 Modo normal → adelante/atrás mueve hacia adelante/atrás
            const moveVector = new THREE.Vector3(0, 0, y);

            const camDir = cam.object3D.getWorldDirection(new THREE.Vector3());
            const angle = Math.atan2(camDir.x, camDir.z);

            moveVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);

            rig.object3D.position.add(moveVector.multiplyScalar(Speed));

            return;
          }

          // -----------------------------------------------------------------------------
          //                           🎮 JOYSTICK DERECHO
          // -----------------------------------------------------------------------------
          if (hand === "right") {
            // 🟥 DERECHA/IZQUIERDA → ROTAR el rig SIEMPRE
            if (Math.abs(x) > 0.01) {
              rig.object3D.rotation.y -= x * 0.1; //0.1 un speed más bajo para evitar mareos
              // negativo para que derecha rote a derecha y viceversa
            }

            // 🟥 ADELANTE/ATRÁS → MOVERSE hacia adelante/atrás SIEMPRE
            if (Math.abs(y) > 0.01) {
              const moveVector = new THREE.Vector3(0, 0, y);

              const camDir = cam.object3D.getWorldDirection(
                new THREE.Vector3()
              );
              const angle = Math.atan2(camDir.x, camDir.z);

              moveVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);

              rig.object3D.position.add(moveVector.multiplyScalar(Speed));
            }

            return;
          }
        }
      }
    }
  },
});
