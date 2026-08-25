/** @type {import('tailwindcss').Config} */
// Los colores leen de variables CSS (definidas en src/assets/styles/theme.css)
// en vez de valores hex fijos — así el modo oscuro se resuelve en un solo
// lugar (ese archivo) sin tocar ningún componente. Ver theme.css para el
// valor de cada --color-* en modo claro (:root) y oscuro (.dark).
function withOpacity(variableName) {
  return ({ opacityValue }) =>
    opacityValue !== undefined ? `rgb(var(${variableName}) / ${opacityValue})` : `rgb(var(${variableName}))`
}

function colorVar(name) {
  return withOpacity(`--color-${name}`)
}

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: colorVar('primary'),
        'on-primary': colorVar('on-primary'),
        'primary-container': colorVar('primary-container'),
        'on-primary-container': colorVar('on-primary-container'),
        'primary-fixed': colorVar('primary-fixed'),
        'primary-fixed-dim': colorVar('primary-fixed-dim'),
        'on-primary-fixed': colorVar('on-primary-fixed'),
        'on-primary-fixed-variant': colorVar('on-primary-fixed-variant'),
        'inverse-primary': colorVar('inverse-primary'),

        secondary: colorVar('secondary'),
        'on-secondary': colorVar('on-secondary'),
        'secondary-container': colorVar('secondary-container'),
        'on-secondary-container': colorVar('on-secondary-container'),
        'secondary-fixed': colorVar('secondary-fixed'),
        'secondary-fixed-dim': colorVar('secondary-fixed-dim'),
        'on-secondary-fixed': colorVar('on-secondary-fixed'),
        'on-secondary-fixed-variant': colorVar('on-secondary-fixed-variant'),

        tertiary: colorVar('tertiary'),
        'on-tertiary': colorVar('on-tertiary'),
        'tertiary-container': colorVar('tertiary-container'),
        'on-tertiary-container': colorVar('on-tertiary-container'),
        'tertiary-fixed': colorVar('tertiary-fixed'),
        'tertiary-fixed-dim': colorVar('tertiary-fixed-dim'),
        'on-tertiary-fixed': colorVar('on-tertiary-fixed'),
        'on-tertiary-fixed-variant': colorVar('on-tertiary-fixed-variant'),

        error: colorVar('error'),
        'on-error': colorVar('on-error'),
        'error-container': colorVar('error-container'),
        'on-error-container': colorVar('on-error-container'),

        background: colorVar('background'),
        'on-background': colorVar('on-background'),
        surface: colorVar('surface'),
        'on-surface': colorVar('on-surface'),
        'surface-variant': colorVar('surface-variant'),
        'on-surface-variant': colorVar('on-surface-variant'),
        'surface-dim': colorVar('surface-dim'),
        'surface-bright': colorVar('surface-bright'),
        'surface-container-lowest': colorVar('surface-container-lowest'),
        'surface-container-low': colorVar('surface-container-low'),
        'surface-container': colorVar('surface-container'),
        'surface-container-high': colorVar('surface-container-high'),
        'surface-container-highest': colorVar('surface-container-highest'),
        'surface-tint': colorVar('surface-tint'),

        outline: colorVar('outline'),
        'outline-variant': colorVar('outline-variant'),
        'inverse-surface': colorVar('inverse-surface'),
        'inverse-on-surface': colorVar('inverse-on-surface'),
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px',
      },
      spacing: {
        base: '4px',
        'stack-sm': '8px',
        'stack-md': '16px',
        'stack-lg': '24px',
        'margin-mobile': '16px',
        'gutter-mobile': '12px',
        'touch-target-min': '48px',
      },
      fontFamily: {
        'headline-xl': ['Inter', 'sans-serif'],
        'headline-lg': ['Inter', 'sans-serif'],
        'headline-md': ['Inter', 'sans-serif'],
        'body-lg': ['Inter', 'sans-serif'],
        'body-md': ['Inter', 'sans-serif'],
        'label-md': ['Inter', 'sans-serif'],
        button: ['Inter', 'sans-serif'],
      },
      fontSize: {
        // Único paso por encima de headline-lg: reservado para números
        // "hero" de tarjetas KPI (referencia: mockup "Dashboard - Optimizado
        // Final" en Stitch) — no es un display face nuevo, es el mismo Inter
        // 700 de headline-lg, solo un escalón más grande para esa métrica
        // puntual. No usar fuera de números de KPI.
        'headline-xl': ['32px', { lineHeight: '40px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-lg': ['24px', { lineHeight: '32px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-md': ['20px', { lineHeight: '28px', letterSpacing: '-0.01em', fontWeight: '600' }],
        'body-lg': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body-md': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'label-md': ['12px', { lineHeight: '16px', letterSpacing: '0.05em', fontWeight: '600' }],
        button: ['16px', { lineHeight: '24px', fontWeight: '600' }],
      },
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/container-queries')],
}
