import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Alineado con el tema del frontend mobile
        primary: {
          DEFAULT: '#6C63FF',
          hover: '#5A52E0',
          light: '#EEF0FF',
        },
        surface: '#1A1A2E',
        sidebar: '#0F0E17',
      },
    },
  },
};

export default config;
