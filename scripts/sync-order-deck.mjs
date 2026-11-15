import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(repositoryRoot, "DRΛKSIDE-Space-Vault-neon.html");
const destination = path.join(repositoryRoot, "client", "public", "order-deck.html");

if (!existsSync(source)) {
  throw new Error(`Order Deck source not found: ${source}`);
}

mkdirSync(path.dirname(destination), { recursive: true });
if (!existsSync(destination) || !readFileSync(source).equals(readFileSync(destination))) {
  copyFileSync(source, destination);
  console.log("Synced DRΛKSIDE-Space-Vault-neon.html to client/public/order-deck.html");
}
