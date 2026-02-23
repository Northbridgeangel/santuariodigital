// fly-mode.js

// ==========================
// fly-mode
// ==========================
AFRAME.registerComponent("fly-mode", {
  schema: {
    active: { type: "boolean", default: false },
  },

  init: function () {
    this.isFlying = this.data.active;
    this.el.sceneEl.isFlyMode = this.isFlying; // flag global accesible

    console.log(
      "✈️ FlyMode inicializado | Estado:",
      this.isFlying ? "Activo" : "Desactivado",
    );

    // Mostrar estado inicial en el HUD
    this.updateWingsHUD(this.isFlying);
  },

  updateWingsHUD: function (state) {
    if (!this.indicator || !this.text) return;

    if (state) {
      this.indicator.classList.add("on");
      this.indicator.classList.remove("off");
      this.text.textContent = "ON";
    } else {
      this.indicator.classList.add("off");
      this.indicator.classList.remove("on");
      this.text.textContent = "OFF";
    }
  },

  toggleFlyMode: function () {
    this.isFlying = !this.isFlying;
    this.el.sceneEl.isFlyMode = this.isFlying;
    console.log(
      this.isFlying ? "🛫 Flight Mode ACTIVADO" : "🛬 Flight Mode DESACTIVADO",
    );
    this.updateWingsHUD(this.isFlying);
  },
});





