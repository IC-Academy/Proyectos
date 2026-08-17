/**
 * icons.js
 * ---------------------------------------------------------------------------
 * Ilustraciones (SVG en línea, sin dependencias externas) para cada uno de
 * los 9 cuadrantes de la matriz 9-box. Puramente visual: no contiene reglas
 * de negocio (esas viven en calculations.js).
 *
 * Asignación temática:
 *  1 Black Spot   -> lámpara en la oscuridad (punto señalado, crítico)
 *  2 Sembrando    -> hoyo recién cavado en la tierra (proceso de siembra)
 *  3 Semilla      -> grano/semilla
 *  4 En Maceta    -> planta en maceta
 *  5 Sol          -> sol
 *  6 Cosecha      -> árbol maduro (fruto del crecimiento)
 *  7 Agua         -> gota de agua
 *  8 Corazón      -> corazón
 *  9 Green Spot   -> planeta / globo verde con logo IC
 * ---------------------------------------------------------------------------
 */
(function (global) {
  'use strict';

  const SVG = {
    1: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="16" fill="#12151c"/>
      <rect x="47" y="8" width="6" height="16" fill="#5b6474"/>
      <path d="M28 24h44l9 18H19z" fill="#2fb6ab"/>
      <ellipse cx="50" cy="30" rx="6" ry="4" fill="#eaf7ff"/>
      <path d="M33 46 L67 46 L80 88 L20 88 Z" fill="#ffe9a3" opacity="0.32"/>
      <ellipse cx="50" cy="86" rx="24" ry="7" fill="#04060a"/>
    </svg>`,
    2: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="16" fill="#e7efe0"/>
      <rect y="58" width="100" height="42" fill="#7bb35a"/>
      <rect y="58" width="100" height="6" fill="#5c9142"/>
      <ellipse cx="50" cy="62" rx="30" ry="10" fill="#5a3b23"/>
      <ellipse cx="50" cy="64" rx="21" ry="6" fill="#3c2716"/>
    </svg>`,
    3: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="16" fill="#f1e9df"/>
      <g transform="rotate(-25 50 50)">
        <ellipse cx="50" cy="50" rx="30" ry="19" fill="#5b3a24"/>
        <path d="M50 32 Q45 50 50 68" stroke="#2e1c11" stroke-width="4" fill="none" stroke-linecap="round"/>
      </g>
    </svg>`,
    4: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="16" fill="#eef3ec"/>
      <path d="M50 58 C38 40 30 34 26 18 C46 24 52 38 52 58 Z" fill="#4c9a4c"/>
      <path d="M50 58 C62 40 70 34 74 18 C54 24 48 38 48 58 Z" fill="#5fb15f"/>
      <path d="M34 62 L66 62 L61 92 L39 92 Z" fill="#d98a55"/>
      <rect x="33" y="58" width="34" height="7" rx="2" fill="#c97a44"/>
    </svg>`,
    5: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="16" fill="#fff8df"/>
      <g stroke="#ffcf3f" stroke-width="6" stroke-linecap="round">
        <line x1="50" y1="10" x2="50" y2="22"/><line x1="50" y1="78" x2="50" y2="90"/>
        <line x1="10" y1="50" x2="22" y2="50"/><line x1="78" y1="50" x2="90" y2="50"/>
        <line x1="22" y1="22" x2="30" y2="30"/><line x1="70" y1="70" x2="78" y2="78"/>
        <line x1="78" y1="22" x2="70" y2="30"/><line x1="30" y1="70" x2="22" y2="78"/>
      </g>
      <circle cx="50" cy="50" r="20" fill="#ffcf3f"/>
    </svg>`,
    6: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="16" fill="#eaf3e5"/>
      <rect x="46" y="62" width="8" height="26" fill="#7a5230"/>
      <circle cx="50" cy="46" r="27" fill="#4c9a4c"/>
      <circle cx="34" cy="54" r="16" fill="#5fb15f"/>
      <circle cx="66" cy="54" r="16" fill="#5fb15f"/>
    </svg>`,
    7: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="16" fill="#eaf5fb"/>
      <path d="M50 14 C66 40 78 55 78 68 A28 28 0 1 1 22 68 C22 55 34 40 50 14Z" fill="#8fd0ea"/>
      <ellipse cx="41" cy="70" rx="7" ry="10" fill="#d7f0fa" opacity="0.75"/>
    </svg>`,
    8: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="16" fill="#fdecec"/>
      <path d="M50 84 C18 60 10 40 23 26 C33 14 48 18 50 33 C52 18 67 14 77 26 C90 40 82 60 50 84Z" fill="#e5484d"/>
    </svg>`,
    9: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="16" fill="#e6eef8"/>
      <circle cx="50" cy="46" r="29" fill="#bfe3f5"/>
      <path d="M26 33 C36 28 43 39 52 35 C60 30 67 39 73 35 C71 51 60 60 50 60 C39 60 28 49 26 33Z" fill="#4c9a4c"/>
      <ellipse cx="50" cy="82" rx="21" ry="6" fill="#cfe4f2"/>
      <text x="50" y="51" font-size="13" font-weight="700" fill="#0b2545" text-anchor="middle" font-family="Arial, sans-serif">IC</text>
    </svg>`
  };

  global.EDDIcons = { SVG };
})(window);
