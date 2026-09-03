/**
 * presets.js — Configuraciones de imagen validadas.
 *
 *   img1  → "Azul mono"    : monocroma gris-azulada, masa crema arriba-derecha,
 *                           sin montañas, bandas de marco oscuras.
 *   img2  → "Atardecer"   : cielo duraznillo, montañas en capas, cúpula rosa
 *                           izquierda, ondas magenta/carmesí.
 *
 * Campos de config (consumidos por Motor.plan):
 *   semilla            — PRNG determinista
 *   cielo              — { arriba, abajo }            (hex)
 *   sol                — { activo, x, y, radio, color, opacidad }  (fracciones 0..1)
 *   montanas           — { capas, color, colorTras, opacidad, rugosidad, altura }
 *   ondas              — { capas, base, separacion, amplitud, frecuencia,
 *                          velocidad, alfa, colorTras, colorFrente }
 *   marco              — { linea, bandaSup, bandaDer }
 */
(function (raiz) {
  'use strict';

  const PRESETS = {
    img1: {
      semilla: 7,
      cielo: { arriba: '#e7e2d8', abajo: '#8d97a9' },
      sol: {
        activo: true,
        x: 0.78,
        y: 0.14,
        radio: 0.5,
        color: '#f4efe6',
        opacidad: 0.95
      },
      montanas: {
        capas: 0,
        color: '#141c2e',
        colorTras: '#5a6478',
        opacidad: 1,
        rugosidad: 0.3,
        altura: 0.5
      },
      ondas: {
        capas: 6,
        base: 0.40,
        separacion: 0.075,
        amplitud: 0.10,
        frecuencia: 1.15,
        velocidad: 0,
        alfa: 0.9,
        colorTras: '#aab3c2',
        colorFrente: '#141c2e'
      },
      marco: {
        linea: { activo: false, y: 0.5, grosor: 0.05, color: '#fff2e8' },
        bandaSup: { activo: true, grosor: 0.02, color: '#0c0f14' },
        bandaDer: { activo: true, grosor: 0.09, color: '#0c0f14' }
      }
    },

    img2: {
      semilla: 42,
      cielo: { arriba: '#f6d3c0', abajo: '#efab8d' },
      sol: {
        activo: true,
        x: 0.30,
        y: 0.50,
        radio: 0.30,
        color: '#f6c6cf',
        opacidad: 0.8
      },
      montanas: {
        capas: 3,
        color: '#151b28',
        colorTras: '#6b7391',
        opacidad: 0.95,
        rugosidad: 0.30,
        altura: 0.52
      },
      ondas: {
        capas: 5,
        base: 0.56,
        separacion: 0.07,
        amplitud: 0.075,
        frecuencia: 1.35,
        velocidad: 0,
        alfa: 0.85,
        colorTras: '#f2dfe2',
        colorFrente: '#d81e63'
      },
      marco: {
        linea: { activo: true, y: 0.52, grosor: 0.05, color: '#ffe9dc' },
        bandaSup: { activo: false, grosor: 0.02, color: '#0c0f14' },
        bandaDer: { activo: false, grosor: 0.09, color: '#0c0f14' }
      }
    }
  };

  /**
   * Copia profunda de una config (o preset) para no mutar el original.
   * Acepta un nombre de preset ('img1' | 'img2') u objeto completo.
   */
  function configDesde(fuente) {
    const base = (typeof fuente === 'string') ? PRESETS[fuente] : fuente;
    if (!base) throw new Error('configDesde: preset desconocido');
    return JSON.parse(JSON.stringify(base));
  }

  const Presets = {
    PRESETS: PRESETS,
    configDesde: configDesde
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Presets;
  } else {
    raiz.Presets = Presets;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
