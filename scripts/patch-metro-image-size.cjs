// SDK 54's Metro passes filenames to image-size v1. The patched image-size v2
// accepts bytes only. Preserve SDK 54 while adopting the security-fixed parser.
const fs = require('node:fs');
const path = require('node:path');
const target = path.join(path.dirname(require.resolve('metro/package.json')), 'src/Assets.js');
const marker = '// SDK54 image-size2 compatibility: decode bytes rather than filenames.';
const before = `  const isImageInput = assetInfo.files[0].includes(".zip/")
    ? _fs.default.readFileSync(assetInfo.files[0])
    : assetInfo.files[0];`;
const source = fs.readFileSync(target, 'utf8');
if (!source.includes(marker)) {
  if (!source.includes(before)) {
    throw new Error('Metro asset loader changed. Review image-size compatibility before building.');
  }
  fs.writeFileSync(target, source.replace(before,
    `  ${marker}\n  const isImageInput = _fs.default.readFileSync(assetInfo.files[0]);`));
}
