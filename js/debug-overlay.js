//debug-overlay.js
// debug-overlay.js
document.addEventListener("DOMContentLoaded", () => {
  const panel = document.getElementById("debug-console");
  const toggle = document.getElementById("debug-toggle");
  const logDiv = document.getElementById("debug-log");
  const input = document.getElementById("debug-input");

  // Mostrar/Ocultar panel
  toggle.addEventListener("click", () => {
    const show = panel.style.display === "none";
    panel.style.display = show ? "block" : "none";
    toggle.style.background = show ? "#070" : "#111";
  });

  // Función para crear span con colores según tipo de contenido
  function formatValue(value, isData = false) {
    const span = document.createElement("span");
    const dataColor = "#f48fb1"; // rosa para valores
    const textColor = "#4fc3f7"; // azul para texto normal

    if (
      value === null ||
      value === undefined ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      span.textContent = value;
      span.style.color = isData ? dataColor : textColor;
    } else if (typeof value === "string") {
      span.textContent = value;
      span.style.color = isData ? dataColor : textColor;
    } else if (Array.isArray(value)) {
      span.appendChild(document.createTextNode("["));
      value.forEach((v, i) => {
        span.appendChild(formatValue(v, true));
        if (i < value.length - 1) span.appendChild(document.createTextNode(", "));
      });
      span.appendChild(document.createTextNode("]"));
    } else if (typeof value === "object") {
      span.appendChild(document.createTextNode("{"));
      const keys = Object.keys(value);
      keys.forEach((k, i) => {
        const keySpan = document.createElement("span");
        keySpan.textContent = k + ": ";
        keySpan.style.color = textColor; // keys → color de texto
        span.appendChild(keySpan);
        span.appendChild(formatValue(value[k], true)); // values → rosa
        if (i < keys.length - 1) span.appendChild(document.createTextNode(", "));
      });
      span.appendChild(document.createTextNode("}"));
    } else {
      span.textContent = value;
      span.style.color = isData ? dataColor : textColor;
    }
    return span;
  }

  // Función para escribir en la Debug Overlay
  function write(type, args) {
    const line = document.createElement("div");
    line.style.margin = "2px 0";

    // Prefijo según tipo
    const prefix = document.createElement("span");
    prefix.textContent = `[${type}] `;
    let color;
    if (type === "log") color = "#4fc3f7";
    else if (type === "warn") color = "#ffeb3b";
    else if (type === "error") color = "#ff5252";
    else if (type === "cmd") color = "#90caf9";
    else if (type === "res") color = "#69f0ae";
    prefix.style.color = color;
    line.appendChild(prefix);

    args.forEach((arg, i) => {
      const span = document.createElement("span");

      if (["warn", "error", "res"].includes(type)) {
        // Texto normal del log → color del tipo, valores internos → rosa
        if (typeof arg === "string" && !/^\[.*\]$/.test(arg)) {
          span.textContent = arg;
          span.style.color = color; // mismo que el prefijo
        } else {
          span.appendChild(formatValue(arg, true)); // rosa
        }
      } else {
        // log normal → azul texto, rosa para valores internos
        if (typeof arg === "string") {
          if (/^\[.*\]$/.test(arg) || /^\d+$/.test(arg)) {
            span.appendChild(formatValue(eval(arg), true));
          } else {
            span.appendChild(formatValue(arg, false));
          }
        } else {
          span.appendChild(formatValue(arg, true));
        }
      }

      line.appendChild(span);
      if (i < args.length - 1) line.appendChild(document.createTextNode(" "));
    });

    logDiv.appendChild(line);
    logDiv.scrollTop = logDiv.scrollHeight;
  }

  // Sobrescribir console.log / warn / error
  ["log", "warn", "error"].forEach((type) => {
    const original = console[type];
    console[type] = function (...args) {
      original.apply(console, args);
      write(type, args);
    };
  });

  // Log propio para diferenciar de logs externos
  console.mylog = function (...args) {
    write("log", args);
  };

  // Línea de comandos
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const command = input.value.trim();
      if (command === "") return;

      write("cmd", ["> " + command]);

      try {
        const result = window.eval(command);
        if (result !== undefined) write("res", ["Resultado:", result]);
      } catch (err) {
        write("error", [err.message]);
      }

      input.value = "";
    }
  });
});