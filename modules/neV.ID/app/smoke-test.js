import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import net from "node:net";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));

function findFreePort() {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const address = probe.address();
      if (!address || typeof address === "string") {
        probe.close();
        reject(new Error("Unable to obtain a free TCP port."));
        return;
      }
      const { port } = address;
      probe.close((error) => error ? reject(error) : resolve(port));
    });
  });
}

const port = await findFreePort();
const baseUrl = `http://127.0.0.1:${port}`;
const child = spawn(process.execPath, ["server.js"], {
  cwd: currentDirectory,
  env: {
    ...process.env,
    PORT: String(port),
    VITE_CLERK_PUBLISHABLE_KEY: "",
    CLERK_SECRET_KEY: "",
    NEV_ID_AUTHORIZED_PARTIES: "",
  },
  stdio: ["ignore", "pipe", "pipe"],
});

let serverOutput = "";
child.stdout.on("data", (chunk) => { serverOutput += chunk.toString(); });
child.stderr.on("data", (chunk) => { serverOutput += chunk.toString(); });

async function waitForServer() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (child.exitCode !== null) {
      throw new Error(`neV.ID server exited unexpectedly.\n${serverOutput}`);
    }

    try {
      const response = await fetch(`${baseUrl}/api/health`, {
        signal: AbortSignal.timeout(800),
      });
      if (response.ok) return;
    } catch {
      // The server may still be starting.
    }

    await delay(100);
  }

  throw new Error(`neV.ID server did not become ready.\n${serverOutput}`);
}

try {
  await waitForServer();

  const healthResponse = await fetch(`${baseUrl}/api/health`);
  const health = await healthResponse.json();
  assert.equal(healthResponse.status, 200);
  assert.equal(health.service, "neV.ID");
  assert.equal(health.authenticationConfigured, false);

  const spaResponse = await fetch(`${baseUrl}/profile`);
  assert.equal(spaResponse.status, 200);
  assert.match(spaResponse.headers.get("content-type") || "", /text\/html/);
  assert.match(await spaResponse.text(), /neV\.ID/);

  const wrongMethodResponse = await fetch(`${baseUrl}/api/me`);
  assert.equal(wrongMethodResponse.status, 405);

  const unconfiguredAuthResponse = await fetch(`${baseUrl}/api/me`, {
    method: "POST",
    headers: {
      Origin: baseUrl,
      Accept: "application/json",
    },
  });
  assert.equal(unconfiguredAuthResponse.status, 503);
  const unconfiguredAuth = await unconfiguredAuthResponse.json();
  assert.equal(unconfiguredAuth.error, "AUTH_NOT_CONFIGURED");

  const unknownApiResponse = await fetch(`${baseUrl}/api/not-found`);
  assert.equal(unknownApiResponse.status, 404);

  console.log("neV.ID smoke tests passed: health, SPA fallback, API methods and unconfigured-auth safety.");
} finally {
  child.kill("SIGTERM");
  await Promise.race([
    new Promise((resolve) => child.once("exit", resolve)),
    delay(3000),
  ]);
  if (child.exitCode === null) child.kill("SIGKILL");
}
