//vr-controls.js
AFRAME.registerComponent("vr-controls", {
  schema: {
    speed: { type: "number", default: 0.05 }, // velocidad de movimiento
  },

  init: function () {
    console.log("🎮 VR Controls inicializado");

    this.rig = document.querySelector("#rig");
    this.camera = document.querySelector("#camera");

    this.right = document.querySelector('[laser-controls][hand="right"]');
    this.left = document.querySelector('[laser-controls][hand="left"]');

    if (!this.right || !this.left) {
      console.warn("⚠️ No se encontraron ambos controladores VR");
      return;
    }

    // ===========================
    // CLICK (Trigger derecho)
    // ===========================
    this.right.addEventListener("triggerdown", () => {
      console.log("🔵 VR Trigger → CLICK");
      const clickEvt = new Event("click");
      this.camera.dispatchEvent(clickEvt);
    });

    // ===========================
    // 1️⃣ Evento que controla el movimiento
    // ===========================
    const moveRig = (e) => {
      // e.detail.axes[0] = X, e.detail.axes[1] = Y del thumbstick

      // ===========================
      // 2️⃣ Lectura de ejes y deadzone
      // ===========================
      const x = e.detail.axes[0]; // movimiento horizontal del joystick (izquierda/derecha)
      const y = e.detail.axes[1]; // movimiento vertical del joystick (adelante/detrás)

      // Deadzone para evitar micro-movimientos
      if (Math.abs(x) < 0.1 && Math.abs(y) < 0.1) return; //Si el joystick está demasiado cerca del centro, no hacemos nada.

      // ===========================
      // 3️⃣ Calculamos dirección de la cámara
      // ===========================
      const dir = new THREE.Vector3();
      this.camera.object3D.getWorldDirection(dir);
      dir.y = 0; // mantener movimiento en plano horizontal
      dir.normalize();

      // Vector lateral perpendicular a la vista
      const rightVec = new THREE.Vector3();
      rightVec.crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();

      // ===========================
      // 4️⃣ Calculamos movimiento final
      // ===========================
      const move = new THREE.Vector3();

      move.add(dir.multiplyScalar(-y * this.data.speed)); // adelante / detrás
      move.add(rightVec.multiplyScalar(x * this.data.speed)); // derecha / izquierda
      // arriba / abajo no está aplicado, si quieres subir o bajar puedes usar rig.position.y

      // ===========================
      // 5️⃣ Aplicamos movimiento al rig
      // ===========================
      this.rig.object3D.position.add(move);
    };

    // ===========================
    // 6️⃣ Escucha movimientos del joystick
    // ===========================
    this.right.addEventListener("axismove", moveRig);
    this.left.addEventListener("axismove", moveRig);
  },
});
