import { mkdir, copyFile } from 'node:fs/promises';

const files = ['index.html', 'style.css', 'app.js', 'collection.js', 'gallery-flow.js', 'liquid.js',
  'vendor/three.module.js', 'vendor/Reflector.js', 'vendor/RoomEnvironment.js',
  ...Array.from({length: 10}, (_, i) => `assets/look-${String(i + 1).padStart(2, '0')}.jpg`)];
for (const file of files) {
  const destination = new URL(`./dist/${file}`, import.meta.url);
  await mkdir(new URL('.', destination), { recursive: true });
  await copyFile(new URL(file, import.meta.url), destination);
}
console.log(`Prepared ${files.length} website files in dist/`);
