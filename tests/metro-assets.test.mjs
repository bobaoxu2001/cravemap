import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';
import { test } from 'node:test';

const require = createRequire(import.meta.url);
const metroAssets = require(path.join(path.dirname(require.resolve('metro/package.json')), 'src/Assets.js'));

test('Metro decodes a real bundled PNG with the patched image parser', async () => {
  const asset = path.resolve('assets/mascots/comfort-food-soul.png');
  const data = await metroAssets.getAssetData(asset, 'assets/mascots', [], 'web', '/assets');
  assert.equal(data.width, 2048);
  assert.equal(data.height, 2048);
});
