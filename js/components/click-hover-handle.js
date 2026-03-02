// click-hover-handle.js
let selectedMesh = null; // mesh actualmente activo
let hoveredMesh = null; // mesh actualmente hovered

function handleClick(mesh) {
  //-----------------------------------------
  // 🔹 Excepciones para Creator Menu y Iconos (Modo especial)
  //-----------------------------------------
  if (
    mesh.name.startsWith("Btn-creator-menú") ||
    mesh.name.startsWith("Icon")
  ) {
    // NO resetear aquí, el sistema creator-mode controla el estado
    return; // 🚫 salir, solo la lógica de resaltar se hará desde creator-mode
  }

  //-----------------------------------------
  // 🔹 Lógica genérica de selección/desselección para otros meshes
  //-----------------------------------------
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

  // 🔒 No aplicar hover a meshes activos
  if (mesh.userData?.active) return;

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
    //console.log(`🟢 HOVER: ${mesh.name}`);
  }
}

// 🔹 Reseteo cuando el cursor sale de cualquier mesh
function handleHoverExit() {
  if (!hoveredMesh) return;

  // 🔒 Si el mesh está activo (ej: Creator Menu), no lo reseteamos
  if (hoveredMesh.userData?.active) {
    console.log(
      "HoverExit sobre:",
      hoveredMesh?.name,
      "active:",
      hoveredMesh?.userData?.active,
    );
    return;
  }

  if (!selectedMesh) {
    resetMesh(hoveredMesh && hoveredMesh);
    hoveredMesh = null;
  }
}

// ==========================
// HOVER CONTROL API GLOBAL
// ==========================
window.HoverControl = window.HoverControl || {};

window.HoverControl.clearHoverFor = function (mesh) {
  if (!mesh) return;
  if (hoveredMesh === mesh) {
    hoveredMesh = null;
  }
};