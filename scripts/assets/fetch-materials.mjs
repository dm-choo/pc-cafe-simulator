import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const manifest = JSON.parse(await readFile('assets/materials.json', 'utf8'));
const out = 'public/assets/generated/materials';
await mkdir(out, { recursive: true });
const digest = data => createHash('md5').update(data).digest('hex');
let total = 0;
// Three concurrent assets, sequential maps within each. Publisher hashes pin source bytes.
await Promise.all(manifest.sets.map(async set => {
  for (const [map, expected] of Object.entries(set.maps)) {
    const path = `${out}/${set.name}_${map}.jpg`;
    let bytes;
    try { bytes = await readFile(path); } catch { /* First build. */ }
    if (!bytes || digest(bytes) !== expected) {
      const url = `https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/${set.id}/${set.id}_${map}_1k.jpg`;
      const response = await fetch(url, { signal: AbortSignal.timeout(60000) });
      if (!response.ok) throw new Error(`${set.id}/${map}: HTTP ${response.status}`);
      bytes = Buffer.from(await response.arrayBuffer());
      if (digest(bytes) !== expected) throw new Error(`Source checksum changed: ${set.id}/${map}`);
      await writeFile(path, bytes);
    }
    total += bytes.length;
  }
}));
console.log(`CC0 material maps: ${total} bytes, nine 1K JPGs. Runtime uses local Pages assets only.`);
