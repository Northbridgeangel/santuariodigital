# Santuario Digital – Entorno Inmersivo de Introspección y Creatividad (TFG)

**Autora:** Cristina Guerrero Domingo
**Tutor:** José Luis Rubio Tamayo
**Fecha:** Octubre 2025  

---

## 🌐 Descripción del proyecto

**Santuario Digital** es un entorno inmersivo desarrollado en **WebXR** que busca fomentar la introspección, la creatividad y la conexión entre arte y tecnología.  
El proyecto combina **A-Frame**, **Three.js** y **JavaScript modular** para crear una experiencia interactiva donde el usuario puede explorar distintos espacios, abrir puertas, descubrir imágenes simbólicas y activar interfaces dinámicas.

Este TFG propone una fusión entre **arte digital**, **interacción web 3D** y **reflexión personal**, integrando principios estéticos, técnicos y conceptuales en una misma experiencia.

---

## 🧩 Estado actual del desarrollo

Actualmente, el entorno cuenta con:

- Un **sistema funcional de eventos click** sobre los objetos 3D.  
- Un módulo de gestión de interacción (`handleClick.js`) que permite reconocer y activar cada mesh por separado.  
- Un sistema de **selección y respuesta visual** que prepara la base para futuras interacciones más complejas.

### Próximas implementaciones:
1. **Apertura y cierre de puertas** mediante animaciones o estados controlados.  
2. **Sustitución dinámica de imágenes** (por ejemplo, al interactuar con una obra o símbolo).  
3. **Interfaz central activa**, que funcionará como un menú dinámico (añadir, editar, mover, eliminar, salir).  
4. Refinamiento de materiales, posiciones y jerarquías de meshes para mejorar la integración visual.  

---

## 📅 Organización y próximos pasos

En la próxima reunión con el tutor se abordarán los siguientes puntos:

1. **Fechas límite del TFG:**  
   Confirmar la fecha oficial de entrega y defensa para ajustar el calendario de desarrollo y documentación.

2. **Plan de trabajo y distribución de tareas:**  
   - Definir prioridades técnicas (interacción, animación, interfaz).  
   - Coordinar los plazos de desarrollo de cada módulo.  
   - Acordar el flujo de comunicación y revisión de avances.

3. **Siguientes reuniones:**  
   Establecer un calendario de encuentros regulares que permita avanzar con seguridad, sin presión, pero con constancia.

4. **Comunicación del progreso:**  
   Transmitir que la **demo va bien**, que el sistema base ya responde correctamente a la interacción, pero que seguimos en fase de desarrollo con una visión más amplia a nivel artístico y funcional.  
   El objetivo es mantener una sensación de trabajo sólido y organizado, sin generar expectativas prematuras.

---

## 🎯 Enfoque conceptual

El proyecto no solo busca crear una experiencia inmersiva, sino también **un espacio simbólico de autodescubrimiento**.  
Cada elemento del entorno —una puerta, una imagen, una interfaz— funciona como metáfora visual y sensorial del proceso creativo y de la relación entre lo humano y lo digital.

---

## ⚙️ Tecnologías utilizadas y nota de funcionamiento

- **A-Frame (WebXR Framework)**  
- **Three.js**  
- **JavaScript (modular)**  
- **GLTF/GLB** para modelos 3D  
- **HTML / CSS**

Nota del funcionamiento: Ignorar los warnings de framebuffer si la escena se ve correcta; si se notasen errores gráficos, revisar tamaños de canvas y skybox.

---

## 📁 Estructura de archivos
/santuariodigital/
├─ assets/
│  ├─ escenario.glb              # Modelo 3D principal del entorno
│  └─ environment.hdr            # Mapa HDR para iluminación ambiental
├─ js/
│  ├─ Main.js                    # Script principal de inicialización
│  └─ components/                # Componentes personalizados de A-Frame
│     ├─ DetectorClickHover.js   # Detección de eventos click y hover
│     ├─ Embellecedor.js         # Ajustes visuales y embellecimiento
│     └─ handleClick.js          # Lógica de interacción al hacer click
│  └─ controls/                  # Controles de movimiento según dispositivo
│     ├─ desktopControl.js       # Movimiento desktop scroll-fly-smooth y smooth-wasd
│     └─ mobileControl.js        # Movimiento móvil swipe y touch-hold
└─ index.html                    # Escena principal de A-Frame

---

## 💡 Autoría y derechos
© 2025 Cristina Guerrero Domingo. Todos los derechos reservados.
Consulte el archivo LICENSE para conocer los términos de uso.
