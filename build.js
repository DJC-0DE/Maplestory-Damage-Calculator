import * as esbuild from 'esbuild';
import { readdir, readFile, writeFile } from 'fs/promises';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = process.cwd();

// Paths that are explicitly mapped in import map (without trailing slash)
// These should NOT get .js appended during build
const EXPLICIT_IMPORT_MAP_PATHS = [
  '@ts/types',
  'fireworks-js',
];

// Path aliases from import map
const ALIASES = {
  '@core/': 'src/core/',
  '@ui/': 'src/ui/',
  '@utils/': 'src/utils/',
  '@data/': 'src/data/',
  '@services/': 'src/ts/services/',
  '@base-stats/': 'src/ts/page/base-stats/',
  '@weapon-levels/': 'src/ts/page/weapon-levels/',
  '@ts/': 'src/ts/',
};

// Plugin to add .js extensions to imports in output
const jsExtensionPlugin = {
  name: 'js-extension',
  setup(build) {
    build.onLoad({ filter: /\.js$/ }, async (args) => {
      let contents = await readFile(args.path, 'utf-8');

      // Add .js to all imports that don't have extensions
      contents = contents.replace(
        /(from\s+|import\s+)(['"])([^'"]+?)\2/g,
        (match, type, quote, path) => {
          // Skip if already has extension
          if (path.endsWith('.js') || path.endsWith('.css') || path.startsWith('http')) {
            return match;
          }
          // Add .js extension
          return `${type}${quote}${path}.js${quote}`;
        }
      );

      return { contents, loader: 'js' };
    });
  },
};

// Plugin to handle path aliases
const aliasPlugin = {
  name: 'alias',
  setup(build) {
    build.onResolve({ filter: /^@/ }, (args) => {
      for (const [alias, path] of Object.entries(ALIASES)) {
        if (args.path.startsWith(alias)) {
          const resolved = resolve(rootDir, path.replace(/\/$/, '') + args.path.slice(alias.length - 1));
          return {
            path: resolved,
            external: false,
          };
        }
      }
    });
  },
};

async function getAllTsFiles(dir, fileList = []) {
  const files = await readdir(dir, { withFileTypes: true });

  for (const file of files) {
    const fullPath = join(dir, file.name);
    if (file.isDirectory()) {
      await getAllTsFiles(fullPath, fileList);
    } else if (file.name.endsWith('.ts')) {
      fileList.push(fullPath);
    }
  }

  return fileList;
}

async function build() {
  console.log('🔨 Building TypeScript with esbuild...');

  const entryPoints = await getAllTsFiles('src');

  // First pass: compile TS to JS (without extensions)
  await esbuild.build({
    entryPoints,
    outdir: rootDir,
    outbase: rootDir,
    format: 'esm',
    target: 'es2020',
    sourcemap: true,
    loader: { '.ts': 'ts' },
    plugins: [aliasPlugin],
    write: true,
    logLevel: 'silent',
  });

  // Second pass: add .js extensions to imports
  const jsFiles = await getAllJsFiles('src');

  for (const jsFile of jsFiles) {
    let contents = await readFile(jsFile, 'utf-8');

    // Add .js to all imports that don't have extensions
    contents = contents.replace(
      /(from\s+|import\s+)(['"])([^'"]+?)\2/g,
      (match, type, quote, path) => {
        // Skip if already has extension or is special import
        if (
          path.endsWith('.js') ||
          path.endsWith('.css') ||
          path.startsWith('http') ||
          path.startsWith('.') ||
          EXPLICIT_IMPORT_MAP_PATHS.includes(path) ||
          // Skip npm packages (contains '/' but doesn't start with '.', '/', or '@')
          (!path.startsWith('@') && path.includes('/') && !path.startsWith('.') && !path.startsWith('/'))
        ) {
          return match;
        }
        // Add .js extension
        return `${type}${quote}${path}.js${quote}`;
      }
    );

    // Fix relative imports
    contents = contents.replace(
      /(from\s+|import\s+)(['"])(\.\.?\/[^'"]+?)\2(?!\.js)/g,
      (match, type, quote, path) => {
        if (path.endsWith('.js') || path.endsWith('.css') || path.startsWith('http')) {
          return match;
        }
        return `${type}${quote}${path}.js${quote}`;
      }
    );

    await writeFile(jsFile, contents, 'utf-8');
  }

  console.log(`✅ Built ${entryPoints.length} files!`);
}

async function getAllJsFiles(dir, fileList = []) {
  const files = await readdir(dir, { withFileTypes: true });

  for (const file of files) {
    const fullPath = join(dir, file.name);
    if (file.isDirectory()) {
      await getAllJsFiles(fullPath, fileList);
    } else if (file.name.endsWith('.js')) {
      fileList.push(fullPath);
    }
  }

  return fileList;
}

build().catch((err) => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});
