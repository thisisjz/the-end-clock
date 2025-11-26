// main.js
import { CLOCKS } from "./clocks.js";
import { EVENT_START, TOTAL_SLOTS } from "./config.js";

// DOM elements
const eventStateEl = document.getElementById("event-state");
const countdownEl = document.getElementById("countdown");
const clockSectionEl = document.getElementById("clock-section");

const clockNameEl = document.getElementById("clock-name");
const clockDescriptionEl = document.getElementById("clock-description");
const clockPriceEl = document.getElementById("clock-price");
const buyButtonEl = document.getElementById("buy-button");
const soldOutLabelEl = document.getElementById("sold-out-label");

// PNG layers
const faceImgEl = document.getElementById("clock-face-img");
const hourImgEl = document.getElementById("clock-hour-img");
const minuteImgEl = document.getElementById("clock-minute-img");
const secondImgEl = document.getElementById("clock-second-img");

// ---------------------------------------------------------------------------
// Load sold-out.json (static file you manually edit)
async function getSoldOutMap() {
  try {
    const res = await fetch("sold-out.json?cache=" + Date.now());
    return await res.json();
  } catch {
    return {};
  }
}

// Determine active clock
function getCurrentSlot(now = new Date()) {
  const diff = now - EVENT_START;
  const hourMs = 1000 * 60 * 60;

  if (diff < 0) return { state: "before" };
  const hoursPassed = Math.floor(diff / hourMs);
  if (hoursPassed >= TOTAL_SLOTS) return { state: "after" };

  return {
    state: "active",
    slotIndex: hoursPassed,
    clock: CLOCKS[hoursPassed]
  };
}

// Format ms → HH:MM:SS
function formatDuration(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;

  return (
    String(h).padStart(2, "0") +
    ":" +
    String(m).padStart(2, "0") +
    ":" +
    String(sec).padStart(2, "0")
  );
}

// Rotate shared PNG hand images
function updateHands(now) {
  const seconds = now.getSeconds();
  const minutes = now.getMinutes();
  const hours = now.getHours() % 12;

  const secondDeg = seconds * 6;
  const minuteDeg = minutes * 6 + seconds * 0.1;
  const hourDeg = hours * 30 + minutes * 0.5;

  secondImgEl.style.transform = `rotate(${secondDeg}deg)`;
  minuteImgEl.style.transform = `rotate(${minuteDeg}deg)`;
  hourImgEl.style.transform = `rotate(${hourDeg}deg)`;
}

// ---------------------------------------------------------------------------
// Main render loop
async function render() {
  const now = new Date();
  updateHands(now);

  const soldMap = await getSoldOutMap();
  const { state, slotIndex, clock } = getCurrentSlot(now);

  if (state === "before") {
    clockSectionEl.classList.add("hidden");
    eventStateEl.textContent = "Sale starts soon!";
    countdownEl.textContent = `Starts in ${formatDuration(EVENT_START - now)}`;
    return;
  }

  if (state === "after") {
    clockSectionEl.classList.add("hidden");
    eventStateEl.textContent = "Sale is over.";
    countdownEl.textContent = "";
    return;
  }

  // ACTIVE CLOCK
  const slotStart = EVENT_START.getTime() + slotIndex * 3600000;
  const slotEnd = slotStart + 3600000;

  eventStateEl.textContent = `Now available: Clock ${slotIndex + 1} of ${TOTAL_SLOTS}`;
  countdownEl.textContent = `Next clock in ${formatDuration(slotEnd - now)}`;

  clockSectionEl.classList.remove("hidden");

  if (!clock) return;

  // Set only the face (hands are static shared images)
  faceImgEl.src = clock.faceImage;
  faceImgEl.alt = clock.name + " face";

  // Set info text
  clockNameEl.textContent = clock.name;
  clockDescriptionEl.textContent = clock.description;
  clockPriceEl.textContent = "SGD " + clock.price;

  const isSoldOut = soldMap[clock.id] === true;

  // Sold-out or Buy button
  if (isSoldOut) {
    soldOutLabelEl.classList.remove("hidden");
    buyButtonEl.classList.add("hidden");
    buyButtonEl.onclick = null;
  } else {
    soldOutLabelEl.classList.add("hidden");
    buyButtonEl.classList.remove("hidden");
    buyButtonEl.onclick = () => {
      window.location.href = clock.checkoutUrl;
    };
  }
}

// Start loop
render();
setInterval(render, 1000);
