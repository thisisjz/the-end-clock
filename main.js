import { CLOCKS } from "./clocks.js";
import { EVENT_START, TOTAL_SLOTS } from "./config.js";

async function getSoldOutMap() {
  const res = await fetch("sold-out.json?cache=" + Date.now());
  return await res.json();
}

function getCurrentSlot(now = new Date()) {
  const diff = now - EVENT_START;
  const hour = 1000 * 60 * 60;

  if (diff < 0) return { state: "before" };

  const hoursPassed = Math.floor(diff / hour);
  if (hoursPassed >= TOTAL_SLOTS) return { state: "after" };

  return {
    state: "active",
    slotIndex: hoursPassed,
    clock: CLOCKS[hoursPassed],
  };
}

function formatDuration(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
}

async function render() {
  const now = new Date();
  const soldMap = await getSoldOutMap();
  const { state, slotIndex, clock } = getCurrentSlot(now);

  const eventStateEl = document.getElementById("event-state");
  const countdownEl = document.getElementById("countdown");
  const section = document.getElementById("clock-section");

  if (state === "before") {
    section.classList.add("hidden");
    eventStateEl.textContent = "Sale starts soon!";
    countdownEl.textContent = `Starts in ${formatDuration(EVENT_START - now)}`;
    return;
  }

  if (state === "after") {
    section.classList.add("hidden");
    eventStateEl.textContent = "Sale is over.";
    countdownEl.textContent = "";
    return;
  }

  // Active hour
  const slotStart = EVENT_START.getTime() + slotIndex * 3600000;
  const slotEnd = slotStart + 3600000;

  eventStateEl.textContent = `Now available: Clock ${slotIndex + 1} of 12`;
  countdownEl.textContent = `Next clock in ${formatDuration(slotEnd - now)}`;

  section.classList.remove("hidden");

  document.getElementById("clock-image").src = clock.image;
  document.getElementById("clock-name").textContent = clock.name;
  document.getElementById("clock-description").textContent = clock.description;
  document.getElementById("clock-price").textContent = "SGD " + clock.price;

  const soldOutLabel = document.getElementById("sold-out-label");
  const buyBtn = document.getElementById("buy-button");

  if (soldMap[clock.id]) {
    soldOutLabel.classList.remove("hidden");
    buyBtn.classList.add("hidden");
  } else {
    soldOutLabel.classList.add("hidden");
    buyBtn.classList.remove("hidden");
    buyBtn.onclick = () => window.location.href = clock.checkoutUrl;
  }
}

render();
setInterval(render, 1000);
