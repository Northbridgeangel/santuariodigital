# WebXR Creative Environment Showcase for Adaptive Architecture and User Agency (Bachelor's Thesis)

**Autora:** Cristina Guerrero Domingo  
**Tutor:** José Luis Rubio Tamayo  
**Fecha:** Mayo 2026

---

## 🌐 Descripción del Proyecto / Project Description

**Santuario Digital** es un sistema WebXR multiplataforma diseñado para la creación espacial, la interacción corpórea y el desarrollo de entornos adaptativos (_A multiplatform XR system for spatial creation, embodied interaction, and adaptive environments_). Este proyecto combina la robustez de **A-Frame**, **Three.js** y una arquitectura de **JavaScript modular** para materializar una tesis práctica sobre la fusión entre el arte digital, la interacción web 3D y la reflexión personal.

Santuario Digital trasciende la definición de una herramienta creativa tradicional; se configura como un **entorno espacial habitable** donde el usuario se convierte en un agente activo dentro del sistema, explorando, construyendo y transformando el espacio a través de múltiples modalidades XR. En lugar de funcionar como una interfaz convencional, el entorno opera simultáneamente como **medio y estructura**, disolviendo la frontera entre la interacción técnico-algorítmica, la narrativa y la arquitectura.

---

### 📌 Conceptos Clave / Key Concepts

- **User Agency as a Core Design Principle**: La agencia del usuario como eje central y motor de la experiencia.
- **Embodied Interaction in VR Environments**: Interacción corpórea que traslada la conciencia física al espacio virtual.
- **Spatial UI as a Narrative Structure**: La interfaz espacial desplegada como una estructura narrativa e intuitiva.
- **Adaptive System Behavior in XR**: Comportamiento adaptativo del sistema que responde dinámicamente al usuario.
- **Cross-Device Continuity (Desktop → VR → AR)**: Continuidad absoluta de la experiencia y persistencia entre dispositivos.
- **Environment-as-Interface Paradigm**: El paradigma del entorno como la interfaz misma, eliminando menús intrusivos.

---

## 🎯 Enfoque Conceptual y Paradigma de Diseño

El proyecto diluye intencionalmente las fronteras entre la interacción técnica, la narrativa espacial y el diseño arquitectónico, articulándose bajo los siguientes pilares conceptuales:

### 🧩 Pilares de Interacción y Arquitectura XR

- **Agencia del Usuario como Eje del Diseño**: El visitante no es un espectador pasivo; es un agente activo dotado de la capacidad de explorar, construir y transformar el espacio físico-virtual en tiempo real.
- **Interacción Corpórea (_Embodied Interaction_)**: La lógica de los componentes de navegación y control busca trasladar la conciencia física y el gesto humano al entorno virtual, permitiendo que la interacción se sienta natural, visceral e intuitiva.
- **La Interfaz Espacial como Estructura Narrativa**: El espacio se despliega como un relato interactivo. Cada componente visual (HUD, mallas, sistemas de dibujo) funciona como una capa de información que el usuario descubre y moldea a través de su trayectoria.
- **Arquitectura Adaptativa y Continuidad Multidispositivo**: El sistema responde dinámicamente al comportamiento del usuario y garantiza una transición fluida y sin rupturas entre modalidades de acceso (**Desktop → VR → AR**). El entorno muta formal y funcionalmente para optimizar la experiencia según el hardware del usuario.

---

## ⚙️ Stack Tecnológico y Especificaciones Técnicas

La arquitectura del software ha sido seleccionada estratégicamente para garantizar la interoperabilidad y la computación en tiempo real directamente en entornos web, eliminando barreras de instalación al usuario final.

- **Core Engine & Frameworks:**
  - **A-Frame (WebXR Framework):** Abstracción basada en Entidad-Componente (ECS) para la estructuración y declaración del espacio inmersivo 3D.
  - **Three.js:** Motor gráfico subyacente de bajo nivel en WebGL encargado del renderizado de escenas, cálculo de matrices de transformación y optimización de materiales.
- **Lenguajes y Paradigmas de Programación:**
  - **JavaScript (ES6+ Modular):** Lógica nativa estructurada mediante módulos desacoplados para la gestión independiente de componentes, controles y sistemas globales.
  - **HTML5 / CSS3:** Maquetación estructural del contenedor WebXR y diseño de la interfaz adaptativa para el panel de depuración multidispositivo.
- **Assets y Formatos Estándar:**
  - **GLTF/GLB (Graphics Language Transmission Format):** Formato estándar de transmisión de mallas 3D optimizado para la web, manteniendo geometrías compactas, materiales PBR y texturas eficientes de bajo impacto en memoria de GPU.
  - **SVG (Scalable Vector Graphics):** Elementos HUD nativos en formato vectorial para garantizar una resolución nítida e independiente de la densidad de píxeles del dispositivo (pantalla o visores XR).

---

## 📁 Estructura del Repositorio

```text
santuariodigital/
├─ assets/
│  ├─ escenario.glb                        # Modelo 3D principal del entorno
│  ├─ environment.png                      # Textura o imagen de fondo para el entorno
│  ├─ Textura-de-pregunta.png              # Textura visual para interacciones o elementos tipo trivia
│  └─ Wings-HUD.svg                        # Elemento gráfico vectorial para la interfaz de usuario en pantalla (HUD)
├─ js/
│  ├─ Main.js                              # Script principal de inicialización: bootstrap, main sys y config
│  ├─ debug-overlay.js                     # Script para facilitar debug multidispositivo
│  ├─ components/                          # Componentes personalizados de A-Frame
│  │  ├─ activate-ar.js                    # Lógica para activar y gestionar el modo de Realidad Aumentada
│  │  ├─ changenote.js                     # Gestión o visualización de notas de cambio dentro de la escena
│  │  ├─ check-player.js                   # Verificación de estado, posición o colisiones del jugador
│  │  ├─ click-hover-handle.js             # Lógica de interacción al hacer click o pasar el cursor
│  │  ├─ Embellecedor.js                   # Ajustes visuales y embellecimiento
│  │  ├─ mirrormaterial.js                 # Script que añade el material espejo
│  │  ├─ revelation-mode.js                # Lógica para activar un modo de revelación o visualización especial
│  │  └─ uploadingmg.js                    # Gestión de carga de imágenes dinámicas en la escena
│  ├─ controls/                            # Controles de navegación multidispositivo
│  │  ├─ desktopControl.js                 # Navegación desktop scroll-fly-smooth y smooth-wasd
│  │  ├─ mobileControl.js                  # Navegación móvil swipe y touch-hold
│  │  ├─ vr-controls.js                    # Navegación en vr con el set metaquest
│  │  ├─ fly-mode.js                       # Navegación vertical, check-player/check-door. Cliente de Doorsystem.
│  │  └─ drawing-persistence-controls.js   # Controles para la persistencia de trazos en el espacio 3D
│  └─ systems/                             # Sistemas globales de escena
│     ├─ InteractionSystem.js              # Sistema sensor de mallas y eventos click-hover
│     ├─ DoorSystem.js                     # Sistema de gestión de puertas
│     └─ creator-mode.js                   # Sistema global para gestionar el modo creador o edición en vivo
├─ rendimiento/                            # Carpeta dedicada a pruebas y métricas de optimización
├─ index.html                              # Escena principal de A-Frame
├─ LICENSE                                 # Licencia legal del proyecto
├─ Meshes.md                               # Documentación técnica sobre las mallas 3D utilizadas
└─ Readme.md                               # Guía general e instrucciones del proyecto
```

---

## 🧩 Estado del Desarrollo y Último Lanzamiento (Last Release)

El sistema base se encuentra completamente consolidado y validado en su versión actual, habiendo alcanzado los hitos clave de interacción, adaptabilidad y control multidispositivo.

### 🎬 Video Walkthrough & Demostración

Se ha generado un video demostrativo completo que sirve como escaparate técnico (_Showcase_) del sistema. El contenido audiovisual incluye:

- **System walkthrough**: Recorrido técnico detallado por la arquitectura del software y su inicialización.
- **Spatial interaction study**: Análisis práctico del comportamiento del usuario y la respuesta de las mallas ante los eventos.
- **XR adaptive architecture showcase**: Demostración real de la mutación del entorno y la continuidad de la experiencia al cambiar de dispositivo (Desktop → VR → AR).

### 🛠️ Funcionalidades Consolidadas en esta Versión

- **Arquitectura de Sistemas Globales**: Implementación de `InteractionSystem.js` (sensor de mallas y eventos globales) y `DoorSystem.js` para la gestión de estados y accesos.
- **Módulos de Control Avanzado**: Despliegue de navegación híbrida (`desktopControl.js`, `mobileControl.js`, `vr-controls.js`) y persistencia de trazos en el espacio (`drawing-persistence-controls.js`).
- **Componentes Narrativos y de Control**: Integración del sistema de edición en vivo (`creator-mode.js`), carga dinámica de imágenes (`uploadingmg.js`) y lógicas de revelación visual (`revelation-mode.js`).

---

## 🎓 Proceso de Presentación del TFG

El proyecto se encuentra en su **fase final de redacción y preparación para la defensa académica**. La demo técnica actual responde con total solidez, lo que permite afrontar los hitos administrativos con un sistema completamente funcional y testeado.

### 📋 Próximos Pasos Institucionales

1. **Fechas Límite y Calendario Oficial**: Coordinación final con la tutoría para confirmar los plazos definitivos de entrega de la memoria y asignación de la fecha de defensa del TFG.
2. **Cierre de Documentación**: Consolidación del marco teórico, la justificación metodológica del paradigma _environment-as-interface_ y el análisis de rendimiento indexado en `/rendimiento`.

---

## 💡 Autoría y derechos

© 2026 Cristina Guerrero Domingo. Todos los derechos reservados.
Consulte el archivo LICENSE para conocer los términos de uso.
