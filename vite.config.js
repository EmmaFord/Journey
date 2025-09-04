import glsl from 'vite-plugin-glsl';

export default {
  base: '/journey/',
  build: {
    sourcemap: true
  },
  plugins: [glsl()]
} 