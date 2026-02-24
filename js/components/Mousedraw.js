//DE MOMENTO LO HACEMOS CON INTERACTIVE SISTEM PERO DEJAMOS POR AQUÍ PARA ACTIVAR EL MODO
//Lo tenemos en el ascene
AFRAME.registerComponent('mouse-draw', {
  schema: {
    color: { default: '#ff0000' },
    size: { default: 0.025 }
  },

  init: function () {
    this.drawing = false;
    this.container = document.createElement('a-entity');
    this.container.setAttribute('id', 'draw-container');
    this.el.appendChild(this.container);

    this.el.addEventListener('mousedown', () => {
      this.drawing = true;
    });

    this.el.addEventListener('mouseup', () => {
      this.drawing = false;
    });

    this.el.addEventListener('mousemove', (evt) => {
      if (!this.drawing) return;
      if (!evt.detail.intersection) return;

      const point = evt.detail.intersection.point;

      const dot = document.createElement('a-sphere');
      dot.setAttribute('radius', this.data.size);
      dot.setAttribute('color', this.data.color);
      dot.setAttribute('position', point);

      this.container.appendChild(dot);
    });
  }
});
