// click-hover-handle.js
let selectedMesh = null; // mesh actualmente activo
let hoveredMesh = null; // mesh actualmente hovered

//-----------------------------------------
// 🔹 Helper para obtener un ID legible de cualquier mesh
//-----------------------------------------
function getMeshId(mesh) {
  return mesh.name || mesh.el?.id || "unknown";
}

function handleClick(mesh) {
  //-----------------------------------------
  // 🔹 Excepciones para Creator Menu y Iconos (Modo especial)
  //-----------------------------------------
  if (
    mesh.name?.startsWith("Btn-creator-menú") ||
    mesh.name?.startsWith("Portal_Revelation") ||
    mesh.name?.startsWith("Icon")
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
    //console.log(
    //  `Mesh ${getMeshId(selectedMesh)} deseleccionado automáticamente`,
    //);
    selectedMesh = null;
  }

  // 🔹 Si clicamos el mismo mesh, lo deseleccionamos
  if (selectedMesh === mesh) {
    resetMesh(mesh);
    selectedMesh = null;
    //console.log(`Mesh ${getMeshId(mesh)} deseleccionado`);
    return;
  }

  // 🔹 Seleccionamos el mesh clicado
  selectedMesh = mesh;
  resaltarMesh(mesh, "click"); // aplicamos resalte click (rojo)
  //console.log(`Mesh ${getMeshId(mesh)} seleccionado`);
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

  //-----------------------------------------
  // 🔹 Solo hover para meshes que son hoverables
  //   → meshes del GLB que empiecen por "Btn" o cualquier .clickable externo
  //-----------------------------------------
  const isHoverableMesh =
    mesh.userData?.hoverable || mesh.name?.startsWith("Btn");

  if (!isHoverableMesh) {
    // 🔹 Si el mesh no es hoverable, aseguramos limpiar hover anterior
    if (hoveredMesh) resetMesh(hoveredMesh);
    hoveredMesh = null;
    return;
  }

  // 🔹 Aplicamos resalte hover SOLO si el mesh no estaba ya en hover
  if (hoveredMesh !== mesh) {
    resaltarMesh(mesh, "hover");
    hoveredMesh = mesh;
    //console.log(`🟢 HOVER: ${getMeshId(mesh)}`);
  }
}

// 🔹 Reseteo cuando el cursor sale de cualquier mesh
function handleHoverExit() {
  if (!hoveredMesh) return;

  // 🔒 Si el mesh está activo (ej: Creator Menu), no lo reseteamos
  if (hoveredMesh.userData?.active) {
    /*
    console.log(
      "HoverExit sobre:",
      getMeshId(hoveredMesh),
      "active:",
      hoveredMesh?.userData?.active,
    );
    */
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
