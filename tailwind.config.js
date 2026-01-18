/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Breakpoints alinhados com o design
      screens: {
        'mobile': '0px',
        'tablet': '768px',
        'desktop': '1024px',
        'wide': '1280px',
      },
    },
  },
  plugins: [],
  // Importante: Não sobrescrever estilos do Fluent UI
  corePlugins: {
    preflight: false,
  },
}
