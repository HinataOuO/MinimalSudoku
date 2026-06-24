import { stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const apkPath = fileURLToPath(
  new URL("../android/app/build/outputs/apk/release/app-release.apk", import.meta.url),
);
const maxSizeMB = 20;
const maxSizeBytes = maxSizeMB * 1_000_000;

let apkSizeBytes;

try {
  ({ size: apkSizeBytes } = await stat(apkPath));
} catch (error) {
  console.error(`APK release non trovato: ${apkPath}`);
  throw error;
}

const apkSizeMB = apkSizeBytes / 1_000_000;

if (apkSizeBytes > maxSizeBytes) {
  console.error(
    `APK release troppo grande: ${apkSizeMB.toFixed(2)} MB (limite ${maxSizeMB} MB).`,
  );
  process.exit(1);
}

console.log(
  `APK release: ${apkSizeMB.toFixed(2)} MB (limite ${maxSizeMB} MB).`,
);
