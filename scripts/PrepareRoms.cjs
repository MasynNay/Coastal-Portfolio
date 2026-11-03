// ROM archives are public release assets, not source-history blobs. Builds
// fetch the exact approved files, verify them, then publish same-origin URLs.
// A failed/missing download stops publication instead of shipping dead carts.
const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");
const roms = require("../src/data/roms.json");
const base =
  "https://github.com/MasynNay/Coastal-Portfolio/releases/download/arcade-roms-v1/";
const root = path.join(__dirname, "../public/roms");
const digest = (data) => crypto.createHash("sha256").update(data).digest("hex");

async function prepare(entry) {
  if (entry.bytes > 25 * 1024 * 1024)
    throw new Error(`${entry.id} exceeds the Pages asset limit.`);
  const target = path.join(root, entry.file);
  const cached = await fs.readFile(target).catch(() => null);
  if (cached && digest(cached) === entry.sha256) return;
  const response = await fetch(base + entry.archive, {
    signal: AbortSignal.timeout(120000),
  });
  if (!response.ok)
    throw new Error(`${entry.id}: download returned ${response.status}`);
  const data = Buffer.from(await response.arrayBuffer());
  if (data.length !== entry.bytes || digest(data) !== entry.sha256)
    throw new Error(`${entry.id}: archive verification failed.`);
  await fs.writeFile(target, data);
  console.log(`Prepared ${entry.name}`);
}

async function main() {
  await fs.mkdir(root, { recursive: true });
  // Limit parallel downloads so fresh builds do not hold every ROM in memory.
  for (let i = 0; i < roms.length; i += 2)
    await Promise.all(roms.slice(i, i + 2).map(prepare));
  const catalog = Object.fromEntries(
    roms.map((entry) => [
      entry.id,
      {
        name: entry.name,
        version: entry.version,
        saveId: entry.saveId,
        rom: `/roms/${entry.file}`,
      },
    ]),
  );
  const target = path.join(__dirname, "../public/emulator/catalog.json");
  const content = JSON.stringify(catalog, null, 2) + "\n";
  if ((await fs.readFile(target, "utf8").catch(() => "")) !== content)
    await fs.writeFile(target, content);
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
