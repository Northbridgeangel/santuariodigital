// click-hover-handle.js
let selectedMesh = null; // mesh actualmente activo
let hoveredMesh = null; // mesh actualmente hovered

function handleClick(mesh) {
  // 🔹 Si ya había un mesh seleccionado distinto, lo reseteamos
  if (selectedMesh && selectedMesh !== mesh) {
    resetMesh(selectedMesh);
    console.log(`Mesh ${selectedMesh.name} deseleccionado automáticamente`);
    selectedMesh = null;
  }

  // 🔹 Si clicamos el mismo mesh, lo deseleccionamos
  if (selectedMesh === mesh) {
    resetMesh(mesh);
    selectedMesh = null;
    console.log(`Mesh ${mesh.name} deseleccionado`);
    return;
  }

  // 🔹 Seleccionamos el mesh clicado
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
    hoveredMesh = null;
  }

  // 🔹 Solo hover para meshes que empiecen por "Btn"
  if (!mesh.name.startsWith("Btn")) {
    if (hoveredMesh) resetMesh(hoveredMesh);
    hoveredMesh = null;
    return;
  }

  // 🔹 Aplicamos resalte hover SOLO si el mesh no estaba ya en hover
  if (hoveredMesh !== mesh) {
    resaltarMesh(mesh, "hover");
    hoveredMesh = mesh;
    console.log(`🟢 HOVER: ${mesh.name}`);
  }
}

// 🔹 Reseteo cuando el cursor sale de cualquier mesh
function handleHoverExit() {
  if (!selectedMesh && hoveredMesh) {
    resetMesh(hoveredMesh);
    hoveredMesh = null;
  }
}
