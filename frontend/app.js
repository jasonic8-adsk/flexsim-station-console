let API_BASE = "http://127.0.0.1:3000";

function defaultApiBase() {
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") {
    return "http://127.0.0.1:3000";
  }
  return `http://${host}:3000`;
}

async function resolveApiBase() {
  const queryOverride = new URLSearchParams(window.location.search).get("api");
  if (queryOverride) {
    return queryOverride.replace(/\/$/, "");
  }

  try {
    const response = await fetch("config.json", { cache: "no-store" });
    if (response.ok) {
      const config = await response.json();
      if (typeof config.apiBase === "string" && config.apiBase.length > 0) {
        const configured = config.apiBase.replace(/\/$/, "");
        const configHost = new URL(configured).hostname;
        const pageHost = window.location.hostname;
        if (configHost === "127.0.0.1" || configHost === "localhost") {
          if (pageHost !== "localhost" && pageHost !== "127.0.0.1") {
            return defaultApiBase();
          }
        }
        return configured;
      }
    }
  } catch {
    // Fall back when config.json is unavailable.
  }

  return defaultApiBase();
}

const state = {
  selectedPiece: null,
  placements: {
    reader_0: "empty",
    reader_1: "empty",
    reader_2: "empty",
    reader_3: "empty",
    reader_4: "empty",
    reader_5: "empty",
    reader_6: "empty"
  },
  sessionCode: null
};

const PIECES = {
  Product_A: { label: "Airfryer", icon: "🍳", type: "product" },
  Product_B: { label: "Utility Knife", icon: "🔪", type: "product" },
  Product_C: { label: "Sim Wheel", icon: "🎮", type: "product" },
  Product_D: { label: "Speaker", icon: "🔊", type: "product" },
  Machine_A: { label: "Manual Store", icon: "🏪", type: "station" },
  Machine_B: { label: "Auto Assembly", icon: "🦾", type: "station" },
  Machine_C: { label: "Auto Storage", icon: "📦", type: "station" },
  Machine_D: { label: "Manual Assembly", icon: "🔧", type: "station" },
  Machine_E: { label: "3D Printer", icon: "🖨️", type: "station" },
  Machine_F: { label: "Injection Mould", icon: "🏭", type: "station" },
  Machine_G: { label: "Die Casting", icon: "🔩", type: "station" },
  Machine_H: { label: "CNC Milling", icon: "⚙️", type: "station" },
  Machine_I: { label: "Automated QA", icon: "🤖", type: "station" },
  Machine_J: { label: "Manual QA", icon: "👁️", type: "station" }
};

function generateSessionCode() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function formatPiTimestamp(date = new Date()) {
  const pad = (n, len = 2) => String(n).padStart(len, "0");
  const ms = pad(date.getMilliseconds(), 3);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${ms}000`;
}

async function createSession() {
  const sessionEl = document.getElementById("sessionCode");
  sessionEl.textContent = "…";

  try {
    const response = await fetch(`${API_BASE}/sessions`, { method: "POST" });
    if (!response.ok) {
      throw new Error("Session request failed");
    }
    const data = await response.json();
    state.sessionCode = data.code;
  } catch {
    state.sessionCode = generateSessionCode();
  }

  sessionEl.textContent = state.sessionCode;
}

async function init() {
  API_BASE = await resolveApiBase();
  await createSession();

  document.querySelectorAll(".piece").forEach(el => {
    const id = el.dataset.id;
    const iconEl = el.querySelector(".piece__icon");
    if (iconEl && ICONS[id]) {
      iconEl.innerHTML = ICONS[id];
    }
    el.addEventListener("click", () => handlePieceClick(el));
  });

  document.querySelectorAll(".slot").forEach(el => {
    el.addEventListener("click", () => handleSlotClick(el));
  });

  document.getElementById("btnClear").addEventListener("click", clearAll);
  document.getElementById("btnCommit").addEventListener("click", commitConfiguration);
}

function handlePieceClick(el) {
  const pieceId = el.dataset.id;
  const pieceType = el.dataset.type;

  if (el.classList.contains("piece--placed")) {
    return;
  }

  document.querySelectorAll(".piece--selected").forEach(p => p.classList.remove("piece--selected"));

  if (state.selectedPiece === pieceId) {
    state.selectedPiece = null;
  } else {
    state.selectedPiece = pieceId;
    el.classList.add("piece--selected");
  }
}

function handleSlotClick(el) {
  const slotId = el.dataset.slot;
  const isProductSlot = slotId === "reader_0";
  const currentOccupant = state.placements[slotId];

  if (state.selectedPiece === null) {
    if (currentOccupant !== "empty") {
      state.placements[slotId] = "empty";
      markPieceAvailable(currentOccupant);
      renderSlot(el, slotId);
    }
    return;
  }

  const selectedInfo = PIECES[state.selectedPiece];
  if (isProductSlot && selectedInfo.type !== "product") return;
  if (!isProductSlot && selectedInfo.type !== "station") return;

  if (currentOccupant !== "empty") {
    markPieceAvailable(currentOccupant);
  }

  state.placements[slotId] = state.selectedPiece;
  markPiecePlaced(state.selectedPiece);
  renderSlot(el, slotId);

  state.selectedPiece = null;
  document.querySelectorAll(".piece--selected").forEach(p => p.classList.remove("piece--selected"));
}

function markPiecePlaced(pieceId) {
  const el = document.querySelector(`.piece[data-id="${pieceId}"]`);
  if (el) {
    el.classList.add("piece--placed");
    el.classList.remove("piece--selected");
  }
}

function markPieceAvailable(pieceId) {
  const el = document.querySelector(`.piece[data-id="${pieceId}"]`);
  if (el) {
    el.classList.remove("piece--placed");
  }
}

function renderSlot(el, slotId) {
  const pieceId = state.placements[slotId];

  const existingContent = el.querySelector(".slot__content");
  if (existingContent) existingContent.remove();

  const existingNumber = el.querySelector(".slot__number");
  const existingLabel = el.querySelector(".slot__label");

  if (pieceId === "empty") {
    el.classList.remove("slot--occupied");
    if (existingNumber) existingNumber.style.display = "";
    if (existingLabel) existingLabel.style.display = "";
  } else {
    el.classList.add("slot--occupied");
    if (existingNumber) existingNumber.style.display = "none";
    if (existingLabel) existingLabel.style.display = "none";

    const info = PIECES[pieceId];
    const content = document.createElement("div");
    content.className = "slot__content";
    content.innerHTML = `
      <div class="slot__content-icon">${ICONS[pieceId] || info.icon}</div>
      <div class="slot__content-label">${info.label}</div>
    `;
    el.appendChild(content);
  }
}

function clearAll() {
  Object.keys(state.placements).forEach(key => {
    state.placements[key] = "empty";
  });

  document.querySelectorAll(".slot").forEach(el => {
    const slotId = el.dataset.slot;
    renderSlot(el, slotId);
  });

  document.querySelectorAll(".piece--placed").forEach(el => {
    el.classList.remove("piece--placed");
  });

  document.querySelectorAll(".piece--selected").forEach(el => {
    el.classList.remove("piece--selected");
  });

  state.selectedPiece = null;
}

function buildPayload() {
  return {
    timestamp: formatPiTimestamp(),
    readings: { ...state.placements }
  };
}

function setCommitButtonState(mode) {
  const btn = document.getElementById("btnCommit");
  if (mode === "success") {
    btn.textContent = "COMMITTED ✓";
    btn.style.background = "#2AD0A9";
    btn.disabled = false;
    setTimeout(() => {
      btn.textContent = "COMMIT";
      btn.style.background = "";
    }, 2000);
    return;
  }

  if (mode === "error") {
    btn.textContent = "COMMIT FAILED";
    btn.style.background = "#F2520A";
    btn.disabled = false;
    setTimeout(() => {
      btn.textContent = "COMMIT";
      btn.style.background = "";
    }, 2500);
    return;
  }

  btn.textContent = "COMMITTING…";
  btn.disabled = true;
}

async function commitConfiguration() {
  if (!state.sessionCode) {
    return;
  }

  const payload = buildPayload();
  setCommitButtonState("loading");

  try {
    const response = await fetch(`${API_BASE}/placements/${state.sessionCode}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error("Commit failed");
    }

    setCommitButtonState("success");
  } catch {
    setCommitButtonState("error");
  }
}

document.addEventListener("DOMContentLoaded", init);
