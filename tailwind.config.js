/** @type {import('tailwindcss').Config} */
// Design tokens extraídos 1:1 de docs/stitch-html/01-login-desktop.html y
// 01-login-mobile.html (SIGA-BACKEND repo) — paleta Material Design 3 ya
// aprobada en el diseño. No modificar valores sin verificar contra un mockup
// nuevo; ver design-reference/stitch-html para la fuente de cada token.
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#0f5238',
        'on-primary': '#ffffff',
        'primary-container': '#2d6a4f',
        'on-primary-container': '#a8e7c5',
        'primary-fixed': '#b1f0ce',
        'primary-fixed-dim': '#95d4b3',
        'on-primary-fixed': '#002114',
        'on-primary-fixed-variant': '#0e5138',
        'inverse-primary': '#95d4b3',

        secondary: '#7a5649',
        'on-secondary': '#ffffff',
        'secondary-container': '#fdcdbc',
        'on-secondary-container': '#795548',
        'secondary-fixed': '#ffdbcf',
        'secondary-fixed-dim': '#ebbcac',
        'on-secondary-fixed': '#2e150b',
        'on-secondary-fixed-variant': '#603f33',

        tertiary: '#274f3d',
        'on-tertiary': '#ffffff',
        'tertiary-container': '#3f6754',
        'on-tertiary-container': '#b8e3cb',
        'tertiary-fixed': '#c1ecd4',
        'tertiary-fixed-dim': '#a5d0b9',
        'on-tertiary-fixed': '#002114',
        'on-tertiary-fixed-variant': '#274e3d',

        error: '#ba1a1a',
        'on-error': '#ffffff',
        'error-container': '#ffdad6',
        'on-error-container': '#93000a',

        background: '#f8f9fa',
        'on-background': '#191c1d',
        surface: '#f8f9fa',
        'on-surface': '#191c1d',
        'surface-variant': '#e1e3e4',
        'on-surface-variant': '#404943',
        'surface-dim': '#d9dadb',
        'surface-bright': '#f8f9fa',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f3f4f5',
        'surface-container': '#edeeef',
        'surface-container-high': '#e7e8e9',
        'surface-container-highest': '#e1e3e4',
        'surface-tint': '#2c694e',

        outline: '#707973',
        'outline-variant': '#bfc9c1',
        'inverse-surface': '#2e3132',
        'inverse-on-surface': '#f0f1f2',
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
        'headline-lg': ['Inter', 'sans-serif'],
        'headline-md': ['Inter', 'sans-serif'],
        'body-lg': ['Inter', 'sans-serif'],
        'body-md': ['Inter', 'sans-serif'],
        'label-md': ['Inter', 'sans-serif'],
        button: ['Inter', 'sans-serif'],
      },
      fontSize: {
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
