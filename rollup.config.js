import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

export default {
  input: 'src/index.js', // your entry point (update if it's different)
  output: [
    {
      file: 'dist/bundle.js',  // your output file
      format: 'esm',           // or 'iife', 'cjs', etc. based on your needs
      sourcemap: true,
    }
  ],
  input: 'src/Physx.js',
  output: {
    file: 'dist/physx.bundle.js',
    format: 'esm',
  },
  external: ['_physx/engine.js'], // Add this line
  plugins: [resolve()],
  plugins: [
    resolve(),  // resolves third-party modules
    terser(),   // minifies the output
  ]
};
