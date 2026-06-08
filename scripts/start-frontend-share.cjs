const { execSync } = require("node:child_process");
const net = require("node:net");
const os = require("node:os");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const port = Number(process.env.FRONTEND_PORT ?? "5173");

function isVirtualInterface(name) {
  return /vEthernet|VirtualBox|VMware|Hyper-V|WSL|Loopback|TAP|TUN|Npcap|Bluetooth/i.test(name);
}

function getShareableAddresses() {
  const results = [];
  for (const [name, nets] of Object.entries(os.networkInterfaces())) {
    if (!nets || isVirtualInterface(name)) {
      continue;
    }
    for (const netif of nets) {
      const isIpv4 = netif.family === "IPv4" || netif.family === 4;
      if (!isIpv4 || netif.internal || netif.address.startsWith("169.254.")) {
        continue;
      }
      results.push({ name, address: netif.address });
    }
  }
  return results;
}

function isPortInUse(checkPort) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(true));
    server.once("listening", () => {
      server.close(() => resolve(false));
    });
    server.listen(checkPort, "0.0.0.0");
  });
}

function findWindowsPidOnPort(checkPort) {
  try {
    const output = execSync(`netstat -ano | findstr ":${checkPort}"`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    });
    const line = output
      .split(/\r?\n/u)
      .find((row) => row.includes("LISTENING") && row.includes(`:${checkPort}`));
    if (!line) {
      return null;
    }
    const parts = line.trim().split(/\s+/u);
    return parts[parts.length - 1] ?? null;
  } catch {
    return null;
  }
}

async function main() {
  const inUse = await isPortInUse(port);
  if (inUse) {
    const pid = process.platform === "win32" ? findWindowsPidOnPort(port) : null;
    console.error(`\n[frontend] Port ${port} is already in use.`);
    if (pid) {
      console.error(`[frontend] Stop the old server: taskkill /PID ${pid} /F`);
    } else {
      console.error(`[frontend] Stop the process using port ${port}, then retry.`);
    }
    console.error("[frontend] Or use another port: set FRONTEND_PORT=5174 && npm run frontend:share\n");
    process.exit(1);
  }

  const shareable = getShareableAddresses();

  console.log("\n[frontend] Binding to 0.0.0.0 (all interfaces - not Hyper-V only)");
  console.log("[frontend] serve lists virtual adapter IPs too; ignore those.\n");

  if (shareable.length === 0) {
    console.log("[frontend] No LAN/Wi-Fi IPv4 found. Colleagues may not be able to connect.");
  } else {
    console.log("[frontend] Share these URLs with colleagues on the same LAN:");
    for (const { name, address } of shareable) {
      console.log(`  ${name}: http://${address}:${port}`);
    }
  }

  console.log(
    "\n[frontend] If colleagues cannot connect, run as Admin: .\\scripts\\open-firewall.ps1"
  );
  console.log("[frontend] VPN URLs (10.x) usually cannot be reached by other PCs.\n");

  try {
    execSync(
      `npx --yes serve frontend -l tcp://0.0.0.0:${port} --no-port-switching --cors`,
      {
        stdio: "inherit",
        cwd: projectRoot,
        env: process.env
      }
    );
  } catch (error) {
    process.exit(typeof error.status === "number" ? error.status : 1);
  }
}

main();
