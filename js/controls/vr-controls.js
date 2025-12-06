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

        // Solo actuamos si realmente se está moviendo algo
        if (Math.abs(x) > 0.01 || Math.abs(y) > 0.01) {
          // ---------------------------------------------------
          // GLOBALS: Scene, Rig, Camera
          // ---------------------------------------------------
          const scene = this.el.sceneEl;
          const isFlying = scene.isFlyMode === true;

          const rig = document.querySelector("#rig");
          if (!rig) return;

          const cam =
            rig.querySelector("[camera]") || rig.querySelector("a-camera");
          if (!cam) return;

          // ---------------------------------------------------
          // GLOBALS: Dirección real de cámara (YAW + PITCH)
          // ---------------------------------------------------
          const camDir = cam.object3D.getWorldDirection(new THREE.Vector3());
          camDir.normalize();

          const yaw = Math.atan2(camDir.x, camDir.z);
          const pitch = Math.asin(camDir.y);

          // ---------------------------------------------------
          //                      🎮 JOYSTICK IZQUIERDO
          // ---------------------------------------------------
          if (hand === "left") {
            // 🟦 (Siempre) Movimiento lateral izquierda/derecha relativo al YAW
            if (Math.abs(x) > 0.01) {
              const lateral = new THREE.Vector3(x, 0, 0);
              lateral.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
              rig.object3D.position.add(lateral.multiplyScalar(Speed));
            }

            // 🟩 (Flight Mode) Adelante/atrás → Subir/bajar con PITCH real
            if (isFlying) {
              if (Math.abs(y) > 0.01) {
                // Vector vertical que sigue el pitch real de la cámara
                const vertical = new THREE.Vector3(0, y, 0);

                // Aplicamos pitch para subir/bajar según inclinación de la cámara
                vertical.applyAxisAngle(new THREE.Vector3(1, 0, 0), pitch);

                // Aplicamos yaw si quieres que gire con la cámara horizontal
                // vertical.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);

                // Acumular (NO resetea)
                rig.object3D.position.add(vertical.multiplyScalar(Speed));
              }
            }

            // 🟧 (Modo normal) Adelante/atrás mueve hacia adelante/atrás con yaw
            else {
              if (Math.abs(y) > 0.01) {
                const forward = new THREE.Vector3(0, 0, y);
                forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
                rig.object3D.position.add(forward.multiplyScalar(Speed));
              }
            }
          }

          // ---------------------------------------------------
          //                      🎮 JOYSTICK DERECHO
          // ---------------------------------------------------
          if (hand === "right") {
            // 🟥 Rotación del rig (yaw)
            if (Math.abs(x) > 0.01) {
              rig.object3D.rotation.y -= x * 0.1;
            }

            // 🟥 Movimiento hacia adelante/atrás relativo al YAW
            if (Math.abs(y) > 0.01) {
              const forward = new THREE.Vector3(0, 0, y);
              forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
              rig.object3D.position.add(forward.multiplyScalar(Speed));
            }
          }
        }
      }
    }
  },
});
