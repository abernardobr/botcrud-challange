/**
 * Rollup Configuration for BotCRUD API Client
 * Builds both CommonJS and ES Module bundles
 */

import { rollup } from 'rollup';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';

const external = ['axios'];

const plugins = [
  resolve({
    browser: true,
    preferBuiltins: false,
  }),
  commonjs(),
  typescript({
    tsconfig: './tsconfig.json',
    declaration: false,
    declarationMap: false,
  }),
  json(),
];

async function build() {
  console.log('Building BotCRUD API Client...');

  // Build CommonJS bundle
  console.log('Building CommonJS bundle...');
  const cjsBundle = await rollup({
    input: 'src/index.ts',
    external,
    plugins,
  });

  await cjsBundle.write({
    file: 'dist/bundle.cjs',
    format: 'cjs',
    exports: 'named',
    sourcemap: true,
  });
  await cjsBundle.close();

  // Build ES Module bundle
  console.log('Building ES Module bundle...');
  const esmBundle = await rollup({
    input: 'src/index.ts',
    external,
    plugins,
  });

  await esmBundle.write({
    file: 'dist/bundle.mjs',
    format: 'es',
    sourcemap: true,
  });
  await esmBundle.close();

  console.log('Build complete!');
  console.log('Output:');
  console.log('  - dist/bundle.cjs (CommonJS)');
  console.log('  - dist/bundle.mjs (ES Module)');
  console.log('  - dist/index.d.ts (TypeScript declarations)');
}

build().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
