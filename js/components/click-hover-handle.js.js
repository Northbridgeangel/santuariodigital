// click-hover-handle.js
let selectedMesh = null; // mesh actualmente activo
let hoveredMesh = null; // mesh actualmente hovered

function handleClick(mesh) {
  // Caso 1: el mesh clicado ya está seleccionado
  if (selectedMesh === mesh) {
    resetMesh(mesh); // deseleccionamos
    selectedMesh = null;
    console.log(`Mesh ${mesh.name} deseleccionado`);
    return;
  }

  // Caso 2: otro mesh ya seleccionado
  if (selectedMesh && selectedMesh !== mesh) {
    console.log(
      `⚠️ Otro mesh (${selectedMesh.name}) está activo, no se puede clicar hasta desactivarlo.`
    );
    return;
  }

  // Caso 3: ningún mesh seleccionado
  selectedMesh = mesh;
  resaltarMesh(mesh, "click"); // aplicamos resalte click (rojo)
  console.log(`Mesh ${mesh.name} seleccionado`);
}

function handleHover(mesh) {
  // Si hay algo seleccionado distinto, no hacemos hover
  if (selectedMesh) return;

  // 🔹 Si el cursor sale de un mesh anterior, reseteamos
  if (hoveredMesh && hoveredMesh !== mesh) {
    resetMesh(hoveredMesh);
  }

  // 🔹 Solo hover para meshes que empiecen por "Btn"
  if (!mesh.name.startsWith("Btn")) {
    if (hoveredMesh) resetMesh(hoveredMesh);
    hoveredMesh = null;
    return;
  }

  // 🔹 Aplicamos resalte hover
  resaltarMesh(mesh, "hover");
  hoveredMesh = mesh;
}

// 🔹 Reseteo cuando el cursor sale de cualquier mesh
function handleHoverExit() {
  if (!selectedMesh && hoveredMesh) {
    resetMesh(hoveredMesh);
    hoveredMesh = null;
  }
}
