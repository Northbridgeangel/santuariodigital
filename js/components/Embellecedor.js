// Embellecedor.js
function resaltarMesh(mesh) {
  if (!mesh || !mesh.material) return;
  // 🚪 No resaltar puertas
  if (/door|puerta/i.test(mesh.name)) return;
  
  if (mesh.material.emissive) mesh.material.emissive.setHex(0xff0000); // brillo rojo
}

function resetMesh(mesh) {
  if (!mesh || !mesh.material || !mesh.originalMaterial) return;

  // Restaurar color base y emisivo sin reemplazar el material
  if (mesh.material.color && mesh.originalMaterial.color)
    mesh.material.color.copy(mesh.originalMaterial.color);

  if (mesh.material.emissive && mesh.originalMaterial.emissive)
    mesh.material.emissive.copy(mesh.originalMaterial.emissive);

  // Si el material tiene más propiedades (metalness, roughness, etc.)
  // puedes ir añadiéndolas de la misma forma.
}
