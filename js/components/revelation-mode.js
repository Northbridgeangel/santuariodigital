AFRAME.registerComponent("revelation-mode", {
  init: function () {
    this.particles = document.querySelector("#magic-particles");
    this.orb = document.querySelector("#scene-orb");
    this.glb = document.querySelector("#escenario");
    this.sky = document.querySelector("#Main-sky");
    this.hudWings = document.querySelector("#hud-wings");
    this.hudCube = document.querySelector("#hud-cube");

    this.active = false;
    this.states = ["default", "lightcontrol", "superlight", "relaxing"];
    this.currentIndex = 0;

    this.originalSnapshot = new Map();
    this.originalSkySnapshot = new Map();

    const scene = this.el.sceneEl;

    // 🔹  Función para mostrar/ocultar HUD y modos
    this.setHUD = (hudVisible) => {
      [this.hudWings, this.hudCube].forEach((hud) => {
        if (!hud) return;

        // Restaurar posición y rotación desde snapshot
        if (!this.hudSnapshot) this.hudSnapshot = new Map();

        if (!this.hudSnapshot.has(hud.id)) {
          // Guardar snapshot inicial del padre + hijos
          const children = Array.from(hud.children);
          this.hudSnapshot.set(hud.id, {
            parent: {
              position: hud.getAttribute("position"),
              rotation: hud.getAttribute("rotation"),
              visible: hud.object3D.visible,
            },
            children: children.map((c) => ({
              el: c,
              position: c.getAttribute("position"),
              rotation: c.getAttribute("rotation"),
              visible: c.object3D.visible,
            })),
          });
        }

        // Mostrar u ocultar padre
        hud.object3D.visible = hudVisible;

        // Restaurar posición y rotación del padre si se muestra
        if (hudVisible) {
          const snap = this.hudSnapshot.get(hud.id);
          hud.setAttribute("position", snap.parent.position);
          hud.setAttribute("rotation", snap.parent.rotation);

          // Restaurar hijos
          snap.children.forEach((childSnap) => {
            const c = childSnap.el;
            c.setAttribute("position", childSnap.position);
            c.setAttribute("rotation", childSnap.rotation);
            c.object3D.visible = true;

            // Reiniciar animación si tiene <a-animation> o animation
            const anim =
              c.querySelector("a-animation") || c.getAttribute("animation");
            if (anim) {
              c.removeAttribute("animation");
              void c.offsetWidth; // forzar reflow para reiniciar
              c.setAttribute("animation", anim);
            }
          });
        }
      });

      // 🔹 Activar o desactivar componentes de escena
      ["fly-mode", "activate-ar"].forEach((comp) => {
        // Eliminamos cualquier estado previo
        scene.removeAttribute(comp);

        // Solo activamos si HUD visible o estamos en default
        if (hudVisible) {
          scene.setAttribute(comp, {}); // {}: usa la configuración por defecto
        }
      });
    };

    // Guardar snapshot del GLB
    if (this.glb) {
      this.glb.addEventListener("model-loaded", () => {
        const root = this.glb.getObject3D("mesh");
        if (!root) return;

        root.traverse((child) => {
          if (!child.isMesh) return;
          if (
            child.name === "Portal_Revelation" ||
            child.name === "transparentfloor"
          )
            return;

          this.originalSnapshot.set(child.uuid, {
            mesh: child,
            visible: child.visible,
            opacity: child.material?.opacity ?? 1,
            transparent: child.material?.transparent ?? false,
          });
        });
        console.log("✔ Snapshot seguro del GLB guardado");
      });
    }

    // Guardar snapshot del Sky
    if (this.sky && this.sky.getObject3D("mesh")) {
      const skyMesh = this.sky.getObject3D("mesh");
      skyMesh.traverse((m) => {
        if (m.isMesh) {
          this.originalSkySnapshot.set(m.uuid, {
            mesh: m,
            visible: m.visible,
            opacity: m.material.opacity,
            transparent: m.material.transparent,
          });
        }
      });
      console.log("✔ Snapshot del Sky guardado");
    }

    // Click en orb → avanzar estado
    if (this.orb) {
      this.orb.addEventListener("click", () => {
        if (!this.glb) return;
        const root = this.glb.getObject3D("mesh");
        if (!root) return;

        // 🔹 Forzar default si active = false
        let state;
        if (!this.active) {
          state = "default";
          this.currentIndex = 0;
        } else {
          this.currentIndex = (this.currentIndex + 1) % this.states.length;
          state = this.states[this.currentIndex];
        }

        // 🔹 Ejecutar estado
        switch (state) {
          case "default":
            this.originalSnapshot.forEach((snap) => {
              const child = snap.mesh;
              child.visible = snap.visible;
              if (child.material) {
                child.material.opacity = snap.opacity;
                child.material.transparent = snap.transparent;
                child.material.needsUpdate = true;
              }
            });
            this.originalSkySnapshot.forEach((snap) => {
              const m = snap.mesh;
              m.visible = snap.visible;
              m.material.opacity = snap.opacity;
              m.material.transparent = snap.transparent;
              m.material.needsUpdate = true;
            });
            if (this.particles)
              this.particles.setAttribute("visible", this.active);

            this.setHUD(true); // HUDs visibles, modes enabled
            this.el.sceneEl.setAttribute("background", "color: #000000");
            break;

          case "lightcontrol":
            this.originalSnapshot.forEach((snap) => {
              const child = snap.mesh;
              child.visible = snap.visible;
              if (child.material) {
                child.material.opacity = 0.5;
                child.material.transparent = true;
                child.material.needsUpdate = true;
              }
            });
            if (this.sky) this.sky.setAttribute("visible", true);
            if (this.particles)
              this.particles.setAttribute("visible", this.active);

            this.setHUD(false); // HUDs ocultos, modes disabled
            this.el.sceneEl.setAttribute("background", "color: #000000");
            break;

          case "superlight":
            this.originalSnapshot.forEach(
              (snap) => (snap.mesh.visible = false),
            );
            if (this.sky && this.sky.getObject3D("mesh")) {
              this.sky.getObject3D("mesh").traverse((m) => {
                if (m.isMesh) {
                  m.visible = true;
                  m.material.opacity = 0.5;
                  m.material.transparent = true;
                  m.material.needsUpdate = true;
                }
              });
            }
            if (this.particles)
              this.particles.setAttribute("visible", this.active);

            this.setHUD(false); // HUDs ocultos, modes disabled
            this.el.sceneEl.setAttribute("background", "color: #000000");
            break;

          case "relaxing":
            this.originalSnapshot.forEach(
              (snap) => (snap.mesh.visible = false),
            );
            if (this.sky && this.sky.getObject3D("mesh")) {
              this.sky.getObject3D("mesh").traverse((m) => {
                if (m.isMesh) m.visible = false;
              });
            }
            if (this.particles) this.particles.setAttribute("visible", false);

            this.setHUD(false); // HUDs ocultos, modes disabled
            this.el.sceneEl.setAttribute("background", "color: #000000");
            break;
        }

        console.log("Orb state:", state);
      });
    }
  },

  toggleRevelation: function () {
    if (!this.particles || !this.orb) return;

    this.active = !this.active;

    // 🔹 Forzar partículas y estado default si se desactiva
    if (!this.active) {
      this.currentIndex = 0;
      if (this.particles) this.particles.setAttribute("visible", false);

      if (this.glb) {
        const event = new Event("click");
        this.orb.dispatchEvent(event); // fuerza default
      }
    } else {
      if (this.particles) this.particles.setAttribute("visible", true);
    }

    this.orb.setAttribute("visible", this.active);
  },
});
