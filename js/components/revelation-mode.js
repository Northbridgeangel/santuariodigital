AFRAME.registerComponent("revelation-mode", {
  init: function () {
    // Referencia a la entidad de partículas
    this.particles = document.querySelector("#magic-particles");
    if (!this.particles) {
      console.warn("⚠️ magic-particles no encontrado");
    }

    this.active = false;
  },

  // Función pública para activar/desactivar las partículas
  toggleRevelation: function () {
    if (!this.particles) return;

    this.active = !this.active;
    this.particles.setAttribute("visible", this.active);

    // Opcional: si quieres reiniciar el particle system al activarlo
    if (this.active) {
      this.particles.components["particle-system"]?.emit?.(); // fuerza reinicio si el componente lo soporta
    }
  },
});
