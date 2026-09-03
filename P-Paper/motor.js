/**
 * motor.js — Núcleo matemático del generador de paisajes abstractos de ondas.
 *
 * Puro y determinista: misma config → mismo plan y mismo y(x) para todo x.
 * Sin DOM ni globals: corre en Node (tests) y en el navegador (app.html).
 *
 * Modelo de capas (de atrás a delante), definido por `plan(config)`:
 *   1. cielo          — degradado vertical
 *   2. montana ×n    — siluetas rugosas (lejano → cercano)
 *   3. sol            — masa radial luminosa
 *   4. linea          — franja clara del horizonte
 *   5. onda ×n       — ondas "seda" translúcidas (tras → frente)
 *   6. bandaSup/Der  — bordes oscuros (marco/encuadre)
 */
(function (raiz) {
  'use strict';

  const TAU = Math.PI * 2;

  /**
   * PRNG determinista (mulberry32).
   * Devuelve una función que produce flotantes en [0, 1).
   */
  function mulberry32(semilla) {
    let a = (semilla >>> 0) || 1;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t = (t + Math.imul(t ^ (t >>> 7), t | 61)) ^ t;
      t = (t ^ (t >>> 14)) >>> 0;
      return t / 4294967296;
    };
  }

  /** '#rrggbb' o '#rgb' → {r,g,b} en 0..255 */
  function hexARgb(hex) {
    let h = String(hex).replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    const n = parseInt(h, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  /** {r,g,b} → '#rrggbb' */
  function rgbAHex(rgb) {
    const c = (0x1000000 + (rgb.r << 16) + (rgb.g << 8) + rgb.b).toString(16).slice(1);
    return '#' + c;
  }

  /** Interpola linealmente dos colores hex; t acotado a 0..1 */
  function interpolarColor(a, b, t) {
    const ca = hexARgb(a);
    const cb = hexARgb(b);
    const k = Math.max(0, Math.min(1, t));
    return rgbAHex({
      r: Math.round(ca.r + (cb.r - ca.r) * k),
      g: Math.round(ca.g + (cb.g - ca.g) * k),
      b: Math.round(ca.b + (cb.b - ca.b) * k)
    });
  }

  /**
   * Paleta de n colores interpolados de colorTras (capa trasera) a colorFrente.
   * n < 1 → [], n === 1 → [colorFrente].
   */
  function generarPaleta(colorTras, colorFrente, n) {
    if (n < 1) return [];
    const out = [];
    for (let i = 0; i < n; i++) {
      out.push(n === 1 ? colorFrente : interpolarColor(colorTras, colorFrente, i / (n - 1)));
    }
    return out;
  }

  /**
   * Y en píxeles de la onda en la abscisa x.
   * capa: { baseY (0..1), amplitud (fracción del alto), frecuencia, fase, velocidad }
   * t: tiempo en segundos (0 = estático).
   * Tres senos superpuestos (1 + 0.35 + 0.18) dan el look "seda" de las referencias;
   * la desviación máxima respecto a baseY es 1.53 * amplitud * alto.
   */
  function yOnda(capa, x, ancho, alto, t) {
    const xn = x / ancho;
    const f = capa.fase + (t || 0) * (capa.velocidad || 0);
    const a = capa.amplitud * alto;
    const u = TAU * capa.frecuencia * xn;
    return capa.baseY * alto
      + a * Math.sin(u + f)
      + a * 0.35 * Math.sin(TAU * capa.frecuencia * 1.7 * xn + f * 1.3)
      + a * 0.18 * Math.sin(TAU * capa.frecuencia * 3.1 * xn + f * 2.7);
  }

  /**
   * Devuelve la lista ORDENADA de capas a dibujar (de atrás a delante)
   * para una config completa. Función pura: misma config → mismo plan.
   */
  function plan(config) {
    const capas = [];
    const rnd = mulberry32(config.semilla);
    const m = config.montanas;
    const o = config.ondas;

    // 1. Cielo
    capas.push({
      tipo: 'cielo',
      colorArriba: config.cielo.arriba,
      colorAbajo: config.cielo.abajo
    });

    // 2. Montañas, de lejano (prof=0) a cercano (prof=1)
    for (let i = 0; i < m.capas; i++) {
      const prof = m.capas === 1 ? 1 : i / (m.capas - 1);
      capas.push({
        tipo: 'montana',
        prof: prof,
        baseY: m.altura - 0.06 + prof * 0.10,
        amplitud: m.rugosidad * (0.10 + 0.05 * (1 - prof)),
        frecuencia: 0.8 + rnd() * 0.7,
        fase: rnd() * TAU,
        color: interpolarColor(m.colorTras, m.color, prof),
        alpha: m.opacidad * (0.45 + 0.55 * prof)
      });
    }

    // 3. Sol / masa de brillo
    if (config.sol.activo) {
      capas.push({
        tipo: 'sol',
        x: config.sol.x,
        y: config.sol.y,
        radio: config.sol.radio,
        color: config.sol.color,
        opacidad: config.sol.opacidad
      });
    }

    // 4. Franja clara del horizonte
    if (config.marco.linea.activo) {
      capas.push({
        tipo: 'linea',
        y: config.marco.linea.y,
        grosor: config.marco.linea.grosor,
        color: config.marco.linea.color
      });
    }

    // 5. Ondas, de trasera a delantera
    const pal = generarPaleta(o.colorTras, o.colorFrente, o.capas);
    for (let j = 0; j < o.capas; j++) {
      const p = o.capas === 1 ? 1 : j / (o.capas - 1);
      capas.push({
        tipo: 'onda',
        baseY: o.base + j * o.separacion,
        amplitud: o.amplitud,
        frecuencia: o.frecuencia * (0.85 + 0.3 * rnd()),
        fase: rnd() * TAU,
        velocidad: o.velocidad,
        color: pal[j],
        alpha: o.alfa * (0.6 + 0.4 * p)
      });
    }

    // 6. Bordes del marco (siempre encima de todo)
    if (config.marco.bandaSup.activo) {
      capas.push({
        tipo: 'bandaSup',
        grosor: config.marco.bandaSup.grosor,
        color: config.marco.bandaSup.color
      });
    }
    if (config.marco.bandaDer.activo) {
      capas.push({
        tipo: 'bandaDer',
        grosor: config.marco.bandaDer.grosor,
        color: config.marco.bandaDer.color
      });
    }

    return capas;
  }

  const Motor = {
    TAU: TAU,
    mulberry32: mulberry32,
    hexARgb: hexARgb,
    rgbAHex: rgbAHex,
    interpolarColor: interpolarColor,
    generarPaleta: generarPaleta,
    yOnda: yOnda,
    plan: plan
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Motor;
  } else {
    raiz.Motor = Motor;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
