AFRAME.registerComponent("drawing-persistence-controls", {
  init: function () {
    const sceneEl = this.el;

    this.fileInput = document.createElement("input");
    this.fileInput.type = "file";
    this.fileInput.accept = ".json";
    this.fileInput.style.display = "none";
    document.body.appendChild(this.fileInput);

    const extractPoints = (line) => {
      const posAttr = line.geometry?.attributes?.position;
      if (!posAttr) return [];

      const arr = posAttr.array;
      const points = [];

      for (let i = 0; i < arr.length; i += 3) {
        points.push({
          x: arr[i],
          y: arr[i + 1],
          z: arr[i + 2],
        });
      }

      return points;
    };

    const exportFile = (data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `drawing_export_${Date.now()}.json`;
      a.click();

      setTimeout(() => URL.revokeObjectURL(url), 1000);
    };

    sceneEl.addEventListener("mesh-clicked", (event) => {
      const mesh = event.detail?.mesh;
      if (!mesh) return;

      /* =========================
         SAVE
      ========================= */
      if (mesh?.name?.includes("Btn-save-drawing")) {
        const selector = sceneEl.components["line-selector"];

        if (!selector) {
          console.warn("❌ line-selector no existe");
          return;
        }

        // 🔥 FIX CRÍTICO: SNAPSHOT, NO LIVE ARRAY
        const selectedLines = selector.lastSelectionSnapshot || [];

        if (selectedLines.length === 0) {
          console.warn("⚠️ No hay líneas seleccionadas");
          return;
        }

        const exportData = selectedLines.map((line) => {
          const data = line.userData || {};

          return {
            id: data.id || THREE.MathUtils.generateUUID(),
            type: data.type || "line",
            mode: data.mode || null,

            mesh: data.mesh?.name || null,

            color:
              line.userData.baseColor != null
                ? `#${new THREE.Color(line.userData.baseColor).getHexString()}`
                : line.userData.color != null
                  ? `#${new THREE.Color(line.userData.color).getHexString()}`
                  : null,

            points: extractPoints(line),

            meta: {
              version: 1,
              createdAt: data.createdAt || null,
            },
          };
        });

        exportFile(exportData);
      }

      /* =========================
         LOAD
      ========================= */
      if (mesh?.name?.includes("Btn-load-drawing")) {
        this.fileInput.click();
      }
    });

    this.fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();

      reader.onload = (event) => {
        let data;

        try {
          data = JSON.parse(event.target.result);
        } catch (err) {
          console.error("❌ JSON inválido:", err);
          return;
        }

        console.log("📥 IMPORTING LINES:", data);

        const escenario = window.OpenCentralGlobals.core.escenario;
        const modelRoot = escenario.getObject3D("mesh");
        const drawGroup = modelRoot?.getObjectByName("DrawGroup");

        if (!drawGroup) {
          console.warn("❌ DrawGroup no encontrado");
          return;
        }

        data.forEach((lineData) => {
          const points = lineData.points;

          if (!points || points.length < 2) return;

          const geometry = new THREE.BufferGeometry();

          const vertices = [];

          points.forEach((p) => {
            vertices.push(p.x, p.y, p.z);
          });

          geometry.setAttribute(
            "position",
            new THREE.Float32BufferAttribute(vertices, 3),
          );

          const material = new THREE.LineBasicMaterial({
            color: lineData.color || "#00ffff",
          });

          const line = new THREE.Line(geometry, material);

          line.userData = {
            id: lineData.id,
            type: lineData.type,
            mode: lineData.mode,
            mesh: { name: lineData.mesh },
          };

          drawGroup.add(line);
        });

        console.log("✅ IMPORT COMPLETED:", data.length, "lines");
      };

      reader.readAsText(file);
      this.fileInput.value = "";
    });
  },
});
