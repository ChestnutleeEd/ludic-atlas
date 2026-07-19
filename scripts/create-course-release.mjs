import { createHash } from "node:crypto";
import { open, readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { deflateRawSync } from "node:zlib";

const projectRoot = path.resolve(import.meta.dirname, "..");
const outputDirectory = path.join(projectRoot, "dist-release");
const archiveName = "Ludic-Atlas-Course-Edition.zip";
const archivePath = path.join(outputDirectory, archiveName);
const checksumPath = path.join(outputDirectory, "SHA256SUMS.txt");

const includedDirectories = ["src", "public", "scripts", "docs"];
const includedFiles = [
  ".gitignore",
  "README.md",
  "eslint.config.mjs",
  "next.config.ts",
  "package-lock.json",
  "package.json",
  "playwright.config.ts",
  "postcss.config.mjs",
  "start-macos.command",
  "start-windows.cmd",
  "tsconfig.json"
];

const excludedNames = new Set([
  ".DS_Store",
  ".env.local",
  "npm-debug.log",
  "playwright-report",
  "test-results"
]);

const excludedDirectoryNames = new Set([
  ".git",
  ".next",
  ".playwright-cli",
  ".turbo",
  "backups",
  "coverage",
  "dist-release",
  "node_modules",
  "output",
  "playwright-report",
  "test-results"
]);

const excludedRelativePaths = new Set([
  "docs/05_TASK_LOG.md"
]);

function shouldExclude(relativePath, isDirectory) {
  const normalized = relativePath.split(path.sep).join("/");
  const parts = normalized.split("/");
  const basename = parts.at(-1) ?? "";
  if (excludedRelativePaths.has(normalized)) return true;
  if (excludedNames.has(basename)) return true;
  if (isDirectory && excludedDirectoryNames.has(basename)) return true;
  if (parts.some((part) => excludedDirectoryNames.has(part))) return true;
  if (basename === ".env" || basename.startsWith(".env.")) return true;
  if (/\.(log|tmp)$/i.test(basename)) return true;
  if (/^(temp|tmp)[-_]/i.test(basename)) return true;
  if (basename.includes("副本") || /(?:^|[-_.])(backup|copy)(?:[-_.]|$)/i.test(basename)) return true;
  if (/backup.*\.zip$/i.test(basename)) return true;
  return false;
}

async function collectDirectory(relativeDirectory, results) {
  const absoluteDirectory = path.join(projectRoot, relativeDirectory);
  const entries = await readdir(absoluteDirectory, { withFileTypes: true });
  entries.sort((left, right) => left.name.localeCompare(right.name));

  for (const entry of entries) {
    const relativePath = path.join(relativeDirectory, entry.name);
    if (shouldExclude(relativePath, entry.isDirectory())) continue;
    if (entry.isSymbolicLink()) {
      throw new Error(`Refusing to package symbolic link: ${relativePath}`);
    }
    if (entry.isDirectory()) {
      await collectDirectory(relativePath, results);
    } else if (entry.isFile()) {
      results.push(relativePath);
    }
  }
}

function makeCrc32Table() {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value >>> 0;
  }
  return table;
}

const crc32Table = makeCrc32Table();

function crc32(buffer) {
  let value = 0xffffffff;
  for (const byte of buffer) {
    value = crc32Table[(value ^ byte) & 0xff] ^ (value >>> 8);
  }
  return (value ^ 0xffffffff) >>> 0;
}

function dosTimestamp(date) {
  const safeYear = Math.max(1980, date.getFullYear());
  const time = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const dosDate = ((safeYear - 1980) << 9) | (month << 5) | day;
  return { date: dosDate, time };
}

function localHeader(name, timestamp) {
  const buffer = Buffer.alloc(30 + name.length);
  buffer.writeUInt32LE(0x04034b50, 0);
  buffer.writeUInt16LE(20, 4);
  buffer.writeUInt16LE(0x0808, 6);
  buffer.writeUInt16LE(8, 8);
  buffer.writeUInt16LE(timestamp.time, 10);
  buffer.writeUInt16LE(timestamp.date, 12);
  buffer.writeUInt16LE(name.length, 26);
  name.copy(buffer, 30);
  return buffer;
}

function dataDescriptor(checksum, compressedSize, originalSize) {
  const buffer = Buffer.alloc(16);
  buffer.writeUInt32LE(0x08074b50, 0);
  buffer.writeUInt32LE(checksum, 4);
  buffer.writeUInt32LE(compressedSize, 8);
  buffer.writeUInt32LE(originalSize, 12);
  return buffer;
}

function centralHeader(entry) {
  const buffer = Buffer.alloc(46 + entry.name.length);
  buffer.writeUInt32LE(0x02014b50, 0);
  buffer.writeUInt16LE(0x0314, 4);
  buffer.writeUInt16LE(20, 6);
  buffer.writeUInt16LE(0x0808, 8);
  buffer.writeUInt16LE(8, 10);
  buffer.writeUInt16LE(entry.timestamp.time, 12);
  buffer.writeUInt16LE(entry.timestamp.date, 14);
  buffer.writeUInt32LE(entry.checksum, 16);
  buffer.writeUInt32LE(entry.compressedSize, 20);
  buffer.writeUInt32LE(entry.originalSize, 24);
  buffer.writeUInt16LE(entry.name.length, 28);
  buffer.writeUInt32LE((0o100644 << 16) >>> 0, 38);
  buffer.writeUInt32LE(entry.offset, 42);
  entry.name.copy(buffer, 46);
  return buffer;
}

function endOfCentralDirectory(entryCount, centralSize, centralOffset) {
  const buffer = Buffer.alloc(22);
  buffer.writeUInt32LE(0x06054b50, 0);
  buffer.writeUInt16LE(entryCount, 8);
  buffer.writeUInt16LE(entryCount, 10);
  buffer.writeUInt32LE(centralSize, 12);
  buffer.writeUInt32LE(centralOffset, 16);
  return buffer;
}

async function writeAll(handle, buffer, position) {
  let written = 0;
  while (written < buffer.length) {
    const result = await handle.write(buffer, written, buffer.length - written, position + written);
    written += result.bytesWritten;
  }
  return position + buffer.length;
}

async function createZip(files) {
  const { mkdir } = await import("node:fs/promises");
  await mkdir(outputDirectory, { recursive: true });
  const handle = await open(archivePath, "w");
  const centralEntries = [];
  let position = 0;

  try {
    for (const relativePath of files) {
      const absolutePath = path.join(projectRoot, relativePath);
      const [contents, metadata] = await Promise.all([readFile(absolutePath), stat(absolutePath)]);
      const archiveNameBuffer = Buffer.from(relativePath.split(path.sep).join("/"), "utf8");
      const compressed = deflateRawSync(contents, { level: 6 });
      const checksum = crc32(contents);
      const timestamp = dosTimestamp(metadata.mtime);
      const offset = position;

      position = await writeAll(handle, localHeader(archiveNameBuffer, timestamp), position);
      position = await writeAll(handle, compressed, position);
      position = await writeAll(
        handle,
        dataDescriptor(checksum, compressed.length, contents.length),
        position
      );

      centralEntries.push({
        checksum,
        compressedSize: compressed.length,
        name: archiveNameBuffer,
        offset,
        originalSize: contents.length,
        timestamp
      });
    }

    const centralOffset = position;
    for (const entry of centralEntries) {
      position = await writeAll(handle, centralHeader(entry), position);
    }
    const centralSize = position - centralOffset;
    position = await writeAll(
      handle,
      endOfCentralDirectory(centralEntries.length, centralSize, centralOffset),
      position
    );
  } finally {
    await handle.close();
  }
}

const files = [];
for (const directory of includedDirectories) {
  await collectDirectory(directory, files);
}
for (const file of includedFiles) {
  if (!shouldExclude(file, false)) files.push(file);
}

files.sort((left, right) => left.localeCompare(right));
if (files.length > 65_535) throw new Error("ZIP32 file-count limit exceeded.");

await createZip(files);

const archiveContents = await readFile(archivePath);
const digest = createHash("sha256").update(archiveContents).digest("hex");
const { writeFile } = await import("node:fs/promises");
await writeFile(checksumPath, `${digest}  ${archiveName}\n`, "utf8");

const archiveStats = await stat(archivePath);
console.log(`Created ${path.relative(projectRoot, archivePath)}`);
console.log(`Files: ${files.length}`);
console.log(`Size: ${archiveStats.size} bytes`);
console.log(`SHA-256: ${digest}`);
