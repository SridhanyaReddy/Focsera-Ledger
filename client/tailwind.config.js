/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Strict White + Midnight Blue Enterprise Palette
        midnight: {
          900: '#14243A', // Midnight Navy — primary sidebar and navigation
          800: '#233D5B', // Deep Blue — secondary emphasis
          700: '#345275',
          600: '#52799D', // Muted Blue — primary buttons & interactive accents
          500: '#7599BD',
          200: '#DCE7F0', // Pale Blue — selected states & subtle highlights
          100: '#EEF4F8',
          50:  '#F4F7FA', // Soft Background
        },
        // Functional / State Colors
        status: {
          success: '#287A57',
          successBg: '#E9F5EF',
          successBorder: '#BBE2CF',
          warning: '#B98232',
          warningBg: '#FDF6EB',
          warningBorder: '#F5DCB4',
          danger: '#B84B4B',
          dangerBg: '#FDEFEF',
          dangerBorder: '#F7C6C6',
        },
        // Semantic Canvas Tokens
        canvas: {
          bg: '#F4F7FA',
          surface: '#FFFFFF',
          border: '#E2E7ED',
          textPrimary: '#182333',
          textSecondary: '#697586',
        },
        // Legacy tailwind compatibility mapping
        focsera: {
          50: '#F4F7FA',
          100: '#EEF4F8',
          200: '#DCE7F0',
          300: '#B0C8DF',
          400: '#7599BD',
          500: '#52799D',
          600: '#52799D', // Muted Blue for primary buttons
          700: '#233D5B', // Deep Blue
          800: '#1C314A',
          900: '#14243A', // Midnight Navy
        }
      },
      fontFamily: {
        sans: ['"Geist"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(20, 36, 58, 0.04)',
        'card': '0 1px 3px 0 rgba(20, 36, 58, 0.05), 0 1px 2px -1px rgba(20, 36, 58, 0.03)',
        'dropdown': '0 10px 25px -5px rgba(20, 36, 58, 0.1), 0 8px 10px -6px rgba(20, 36, 58, 0.04)',
      },
      borderRadius: {
        'card': '0.5rem', // 8px restrained radius
      }
    },
  },
  plugins: [],
}
