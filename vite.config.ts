import { defineConfig } from 'vite'

export default defineConfig({
  // Set the root directory of your app
  root: './',
  base: "./",

  // Set the output directory for the built files
  build: {
    outDir: './dist',
  },

  // Set up any plugins you want to use
  plugins: [],

  // Set up any server options you want to use
  server: {
    port: 3000,
  },
});