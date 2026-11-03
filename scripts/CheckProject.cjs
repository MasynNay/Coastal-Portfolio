// Read-only checks for the repository's authored application. Imports and local
// file links are checked against disk; external URLs are parsed, never fetched.
// Generated artwork is checked separately by VerifyWorldAssets.py because its
// manifests contain dynamic atlas IDs rather than ordinary module imports.
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const root = path.resolve(__dirname, "..");
const failures = [];
const graph = new Map();
let imports = 0,
  assetLinks = 0,
  documentLinks = 0;
function files(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? files(file) : [file];
  });
}
function relative(file) {
  return path.relative(root, file);
}
function resolveModule(file, specifier) {
  const base = path.resolve(path.dirname(file), specifier);
  return [
    base,
    ...[".js", ".json", ".css", "/index.js"].map((suffix) => base + suffix),
  ].find(
    (candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile(),
  );
}
function localAsset(file, value) {
  // srcSet strings contain several paths with width descriptors.
  if (value.includes(",")) {
    value
      .split(",")
      .forEach((part) => localAsset(file, part.trim().split(/\s+/)[0]));
    return;
  }
  const pathname = value.split(/[?#]/)[0];
  // Routes and dynamic prefixes have no extension and are deliberately skipped.
  if (
    !pathname.startsWith("/") ||
    !path.extname(pathname) ||
    pathname.includes("*")
  )
    return;
  assetLinks++;
  if (!fs.existsSync(path.join(root, "public", pathname)))
    failures.push(`${relative(file)}: missing public asset ${pathname}`);
}
const sourceFiles = files(path.join(root, "src")).filter(
  (file) => /\.(js|css)$/.test(file) && !file.endsWith(".test.js"),
);
for (const file of sourceFiles) {
  const content = fs.readFileSync(file, "utf8");
  const dependencies = [];
  graph.set(file, dependencies);
  if (file.endsWith(".js")) {
    const ast = ts.createSourceFile(
      file,
      content,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.JSX,
    );
    function visit(node) {
      const specifier =
        ts.isImportDeclaration(node) || ts.isExportDeclaration(node)
          ? node.moduleSpecifier
          : ts.isCallExpression(node) &&
              (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
                node.expression.getText(ast) === "require")
            ? node.arguments[0]
            : null;
      if (
        specifier &&
        ts.isStringLiteral(specifier) &&
        specifier.text.startsWith(".")
      ) {
        imports++;
        const target = resolveModule(file, specifier.text);
        if (target) dependencies.push(target);
        else
          failures.push(`${relative(file)}: missing import ${specifier.text}`);
      }
      if (ts.isStringLiteral(node)) {
        localAsset(file, node.text);
        if (/^https?:\/\//.test(node.text)) {
          try {
            const url = new URL(node.text);
            if (!url.hostname || node.text.trim() !== node.text)
              throw new Error("Malformed URL");
          } catch {
            failures.push(`${relative(file)}: malformed external URL`);
          }
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(ast);
  } else {
    for (const [, value] of content.matchAll(
      /url\(\s*["']?([^)'"\s]+)["']?\s*\)/g,
    )) {
      if (value.startsWith(".")) {
        const target = resolveModule(file, value);
        assetLinks++;
        if (target) dependencies.push(target);
        else failures.push(`${relative(file)}: missing CSS asset ${value}`);
      } else localAsset(file, value);
    }
  }
}
const reached = new Set();
function walk(file) {
  if (reached.has(file)) return;
  reached.add(file);
  (graph.get(file) || []).forEach(walk);
}
walk(path.join(root, "src/index.js"));
for (const file of sourceFiles)
  if (!reached.has(file))
    failures.push(
      `${relative(file)}: no import path from the application entry`,
    );
// Every bundled source image must have an import or CSS reference. Runtime
// sprite exports are excluded here because their manifests own those paths.
const sourceAssets = files(path.join(root, "src/assets/images"));
for (const file of sourceAssets)
  if (!reached.has(file))
    failures.push(`${relative(file)}: unreferenced source image/media`);
const documents = [
  path.join(root, "README.md"),
  ...files(path.join(root, "docs")),
  ...files(path.join(root, "src")),
  ...files(path.join(root, "scripts")),
].filter((file) => file.endsWith(".md"));
for (const file of documents) {
  const content = fs.readFileSync(file, "utf8");
  for (const [, target] of content.matchAll(/\]\(([^)]+)\)/g)) {
    if (target.includes("://") || target.startsWith("#")) continue;
    const pathname = target.split("#")[0];
    documentLinks++;
    if (pathname && !fs.existsSync(path.resolve(path.dirname(file), pathname)))
      failures.push(`${relative(file)}: broken documentation link ${pathname}`);
  }
}
if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(
    `Checked ${sourceFiles.length} application modules/styles, ${imports} imports, ${sourceAssets.length} source media files, ${assetLinks} asset references and ${documentLinks} documentation links.`,
  );
}
