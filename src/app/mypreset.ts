import { definePreset } from '@primeng/themes';
import Aura from '@primeng/themes/aura';

const MyPreset = definePreset(Aura, {
    semantic: {
      primary: {
          50: '#100068',
          100: '#100068',
          200: '#100068',
          300: '#100068',
          400: '#100068',
          500: '#100068',
          600: '#100068',
          700: '#100068',
          800: '#100068',
          900: '#100068',
          950: '#100068',
      }
  }
});

export default MyPreset;
