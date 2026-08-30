const fs = require("fs");
const path = require("path");

const nextDist = path.join(
  process.cwd(),
  ".open-next",
  "server-functions",
  "default",
  "node_modules",
  "next",
  "dist"
);

const toRemove = [
  // Build-time only
  "build",
  "cli",
  "next-devtools",
  "telemetry",
  "trace",
  // Dev-only server code
  "server/dev",
  "server/node-environment-extensions",
  "server/typescript",
  // Unnecessary compiled packages
  "compiled/busboy",
  "compiled/jsonwebtoken",
  "compiled/napi-rs",
  "compiled/next-devtools",
  "compiled/webpack",
  "compiled/webpack-sources",
  "compiled/react-refresh",
  "compiled/loader-utils2",
  "compiled/@vercel",
  "compiled/schema-utils3",
  "compiled/comment-json",
  "compiled/conf",
  "compiled/acorn",
  "compiled/tar",
  "compiled/source-map08",
  "compiled/browserslist",
  "compiled/send",
  // Dev-only client code
  "client/dev",
];

let totalSaved = 0;

for (const rel of toRemove) {
  const full = path.join(nextDist, rel);
  if (fs.existsSync(full)) {
    const size = dirSize(full);
    fs.rmSync(full, { recursive: true, force: true });
    totalSaved += size;
    console.log(`  removed ${rel} (${(size / 1024).toFixed(0)} KB)`);
  }
}

console.log(`\nTotal saved: ${(totalSaved / 1024 / 1024).toFixed(1)} MB\n`);

function dirSize(d) {
  let size = 0;
  const entries = fs.readdirSync(d, { withFileTypes: true, recursive: true });
  for (const entry of entries) {
    const full = entry.path || path.join(d, entry.name);
    if (!entry.isDirectory()) {
      try { size += fs.statSync(full).size; } catch {}
    }
  }
  return size;
}
