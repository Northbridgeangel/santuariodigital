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

    // 🔹 Función auxiliar: desactiva HUD y Fly/AR
    this.disableHUDandModes = () => {
      if (this.hudWings) {
        this.hudWings.object3D.visible = false;
        if (this.hudWings.components) {
          Object.keys(this.hudWings.components).forEach((c) =>
            this.hudWings.removeAttribute(c),
          );
        }
      }
      if (this.hudCube) {
        this.hudCube.object3D.visible = false;
        if (this.hudCube.components) {
          Object.keys(this.hudCube.components).forEach((c) =>
            this.hudCube.removeAttribute(c),
          );
        }
      }

      const scene = this.el.sceneEl;
      ["fly-mode", "activate-ar"].forEach((comp) => {
        if (scene.components[comp]) {
          this[`_${comp}Comp`] = scene.components[comp];
          scene.removeAttribute(comp);
        }
      });
    };

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
              this.particles.setAttribute("visible", this.active); // solo si active
            if (this.hudWings) this.hudWings.object3D.visible = this.active;
            if (this.hudCube) this.hudCube.object3D.visible = this.active;
            this.el.sceneEl.setAttribute("background", "color: #000000");
            break;

          case "lightcontrol":
            this.originalSnapshot.forEach((snap) => {
              const child = snap.mesh;
              if (snap.visible) {
                child.visible = true;
                if (child.material) {
                  child.material.opacity = 0.5;
                  child.material.transparent = true;
                  child.material.needsUpdate = true;
                }
              } else child.visible = false;
            });
            if (this.sky) this.sky.setAttribute("visible", true);
            if (this.particles)
              this.particles.setAttribute("visible", this.active);
            this.el.sceneEl.setAttribute("background", "color: #000000");
            this.disableHUDandModes();
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
            this.el.sceneEl.setAttribute("background", "color: #000000");
            this.disableHUDandModes();
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
            this.el.sceneEl.setAttribute("background", "color: #000000");
            this.disableHUDandModes();
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
