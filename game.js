const canvas = document.querySelector("#mars-canvas");
const context = canvas.getContext("2d");
const overlay = document.querySelector("#start-overlay");
const launchButton = document.querySelector("#launch-button");
const toast = document.querySelector("#toast");
const sampleCount = document.querySelector("#sample-count");
const sampleProgress = document.querySelector("#sample-progress");
const sampleCheck = document.querySelector("#sample-check");
const beaconCheck = document.querySelector("#beacon-check");
const coordinates = document.querySelector("#coordinates");
const mapPlayer = document.querySelector("#map-player");
const themeToggle = document.querySelector("#theme-toggle");
const clock = document.querySelector("#mission-clock");

const world = { width: 960, height: 556 };
const player = { x: 113, y: 391, radius: 12, speed: 205, direction: 1 };
const beacon = { x: 833, y: 150 };
const samples = [
  { x: 276, y: 200, collected: false },
  { x: 449, y: 424, collected: false },
  { x: 612, y: 245, collected: false },
  { x: 757, y: 373, collected: false },
  { x: 368, y: 350, collected: false },
];
const rocks = [
  [42, 320, 23], [195, 443, 20], [240, 178, 17], [333, 265, 26],
  [393, 476, 18], [518, 170, 23], [557, 340, 20], [681, 426, 27],
  [716, 208, 17], [868, 304, 21], [915, 465, 29], [101, 151, 15],
  [465, 297, 14], [827, 112, 15], [293, 492, 17],
];
const craters = [
  [173, 274, 47, 21], [388, 181, 55, 24], [533, 480, 39, 18],
  [740, 284, 54, 22], [863, 421, 47, 21], [87, 478, 38, 17],
  [617, 118, 34, 15], [297, 391, 30, 14],
];
const keys = new Set();
const decorativeStars = Array.from({ length: 42 }, (_, index) => ({
  x: (index * 193 + 37) % world.width,
  y: 28 + (index * 67) % 110,
  size: 0.6 + (index % 4) * 0.35,
  alpha: 0.2 + (index % 5) * 0.1,
}));

let playing = false;
let won = false;
let previousTime = 0;
let elapsed = 0;
let toastTimeout;

function resizeCanvas() {
  const bounds = canvas.getBoundingClientRect();
  const scale = window.devicePixelRatio || 1;
  canvas.width = Math.round(bounds.width * scale);
  canvas.height = Math.round(bounds.height * scale);
  context.setTransform(canvas.width / world.width, 0, 0, canvas.height / world.height, 0, 0);
  draw();
}

function drawBackground() {
  const sky = context.createLinearGradient(0, 0, 0, 245);
  sky.addColorStop(0, "#3d3035");
  sky.addColorStop(0.55, "#a85c4c");
  sky.addColorStop(1, "#e29a68");
  context.fillStyle = sky;
  context.fillRect(0, 0, world.width, world.height);

  context.fillStyle = "rgba(255, 222, 182, .72)";
  context.beginPath();
  context.arc(769, 104, 35, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "rgba(255, 229, 198, .1)";
  context.beginPath();
  context.arc(769, 104, 49, 0, Math.PI * 2);
  context.fill();

  for (const star of decorativeStars) {
    context.globalAlpha = star.alpha;
    context.fillStyle = "#fff1d7";
    context.beginPath();
    context.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    context.fill();
  }
  context.globalAlpha = 1;

  drawMountainRange(210, 170, 13, "#8f4e47", 0.72);
  drawMountainRange(255, 145, 17, "#a85448", 0.9);
  drawMountainRange(293, 121, 20, "#ba604a", 1);

  const ground = context.createLinearGradient(0, 267, 0, world.height);
  ground.addColorStop(0, "#d87a50");
  ground.addColorStop(1, "#a64737");
  context.fillStyle = ground;
  context.fillRect(0, 267, world.width, world.height - 267);

  for (let index = 0; index < 19; index += 1) {
    const x = (index * 197 + 28) % world.width;
    const y = 282 + (index * 83) % 260;
    context.fillStyle = index % 2 ? "rgba(116, 49, 42, .12)" : "rgba(255, 188, 123, .12)";
    context.beginPath();
    context.ellipse(x, y, 34 + (index % 4) * 13, 4 + (index % 3) * 2, -0.18, 0, Math.PI * 2);
    context.fill();
  }

  for (const [x, y, rx, ry] of craters) {
    context.fillStyle = "rgba(105, 46, 39, .3)";
    context.beginPath();
    context.ellipse(x, y, rx, ry, -0.08, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = "rgba(255, 183, 120, .25)";
    context.lineWidth = 2;
    context.beginPath();
    context.ellipse(x, y - 2, rx - 2, ry - 2, -0.08, Math.PI * 1.05, Math.PI * 1.92);
    context.stroke();
  }

  for (const [x, y, size] of rocks) drawRock(x, y, size);
  drawLander();
}

function drawMountainRange(base, peak, seed, color, opacity) {
  context.globalAlpha = opacity;
  context.fillStyle = color;
  context.beginPath();
  context.moveTo(0, base + 100);
  for (let x = 0; x <= world.width + 90; x += 38) {
    const wobble = Math.sin((x + seed * 31) * 0.018) * 12 + Math.cos(x * 0.041 + seed) * 7;
    const summit = base - peak * Math.exp(-Math.pow((x - (210 + seed * 19)) / 112, 2)) + wobble;
    context.lineTo(x, summit);
  }
  context.lineTo(world.width, 310);
  context.lineTo(0, 310);
  context.closePath();
  context.fill();
  context.globalAlpha = 1;
}

function drawRock(x, y, size) {
  context.fillStyle = "#83463c";
  context.beginPath();
  context.ellipse(x + 2, y + 4, size * 0.78, size * 0.34, -0.12, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#bd6550";
  context.beginPath();
  context.moveTo(x - size, y);
  context.lineTo(x - size * 0.63, y - size * 0.63);
  context.lineTo(x + size * 0.1, y - size * 0.85);
  context.lineTo(x + size * 0.66, y - size * 0.5);
  context.lineTo(x + size, y);
  context.lineTo(x + size * 0.44, y + size * 0.14);
  context.lineTo(x - size * 0.56, y + size * 0.1);
  context.closePath();
  context.fill();
  context.fillStyle = "rgba(255, 185, 131, .38)";
  context.beginPath();
  context.moveTo(x - size * 0.63, y - size * 0.58);
  context.lineTo(x + size * 0.08, y - size * 0.78);
  context.lineTo(x - size * 0.02, y - size * 0.25);
  context.lineTo(x - size * 0.64, y - size * 0.28);
  context.closePath();
  context.fill();
}

function drawLander() {
  const { x, y } = beacon;
  context.save();
  context.translate(x, y);
  context.strokeStyle = "#e8c89f";
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(-20, 4); context.lineTo(-27, 21); context.lineTo(-10, 22);
  context.moveTo(20, 4); context.lineTo(27, 21); context.lineTo(10, 22);
  context.stroke();
  context.fillStyle = "#ddd3c2";
  context.fillRect(-21, -6, 42, 12);
  context.fillStyle = "#6b7774";
  context.fillRect(-12, -16, 24, 11);
  context.fillStyle = "#90d5d0";
  context.fillRect(-7, -13, 14, 6);
  context.fillStyle = "#ffdb9a";
  context.fillRect(-2, -27, 4, 11);
  context.fillStyle = "#ffc777";
  context.beginPath();
  context.arc(0, -31, 4, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "rgba(255, 213, 147, .14)";
  context.beginPath();
  context.arc(0, -15, 53 + Math.sin(elapsed * 3) * 2, 0, Math.PI * 2);
  context.fill();
  context.restore();

  context.save();
  context.translate(x, y - 49);
  context.strokeStyle = "rgba(255, 220, 159, .68)";
  context.setLineDash([3, 5]);
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(0, -12);
  context.lineTo(0, -31);
  context.stroke();
  context.setLineDash([]);
  context.fillStyle = "#ffe1a4";
  context.font = "9px monospace";
  context.textAlign = "center";
  context.fillText("EXTRACTION", 0, -38);
  context.restore();
}

function drawSample(sample) {
  const bob = Math.sin(elapsed * 3.5 + sample.x) * 3;
  context.save();
  context.translate(sample.x, sample.y + bob);
  context.fillStyle = "rgba(255, 222, 154, .12)";
  context.beginPath();
  context.arc(0, 0, 18, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#ffe2a1";
  context.beginPath();
  context.moveTo(0, -9);
  context.lineTo(7, -2);
  context.lineTo(4, 7);
  context.lineTo(-5, 6);
  context.lineTo(-8, -1);
  context.closePath();
  context.fill();
  context.fillStyle = "#fff0cd";
  context.beginPath();
  context.moveTo(0, -6);
  context.lineTo(3, -1);
  context.lineTo(-1, 0);
  context.closePath();
  context.fill();
  context.restore();
}

function drawAstronaut() {
  const walking = playing && (keys.size > 0) ? Math.sin(elapsed * 15) : 0;
  context.save();
  context.translate(player.x, player.y);
  context.scale(player.direction, 1);

  context.fillStyle = "rgba(72, 33, 29, .3)";
  context.beginPath();
  context.ellipse(0, 14, 13, 4, 0, 0, Math.PI * 2);
  context.fill();

  context.strokeStyle = "#dddcd4";
  context.lineWidth = 5;
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(-4, 3); context.lineTo(-6 + walking * 3, 11);
  context.moveTo(4, 3); context.lineTo(6 - walking * 3, 11);
  context.stroke();
  context.fillStyle = "#31383e";
  context.fillRect(-10 + walking * 3, 9, 8, 4);
  context.fillRect(3 - walking * 3, 9, 8, 4);

  context.fillStyle = "#e9e7df";
  context.beginPath();
  context.roundRect(-8, -2, 16, 17, 5);
  context.fill();
  context.fillStyle = "#cc674b";
  context.fillRect(-7, 3, 14, 4);
  context.fillStyle = "#f4ede0";
  context.beginPath();
  context.arc(0, -10, 9, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#50636a";
  context.beginPath();
  context.ellipse(2, -11, 6, 5, -0.14, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "rgba(162, 221, 218, .75)";
  context.beginPath();
  context.ellipse(3, -13, 3, 1.5, -0.15, 0, Math.PI * 2);
  context.fill();

  context.strokeStyle = "#e9e7df";
  context.lineWidth = 4;
  context.beginPath();
  context.moveTo(-5, 0); context.lineTo(-9 + walking * 2, 5);
  context.moveTo(5, 0); context.lineTo(10 - walking * 2, 4);
  context.stroke();
  context.fillStyle = "#c8d4c6";
  context.fillRect(-13 + walking * 2, 3, 5, 5);
  context.fillRect(8 - walking * 2, 2, 5, 5);
  context.fillStyle = "#a9b2ad";
  context.fillRect(-11, -1, 4, 4);
  context.restore();

  context.fillStyle = "rgba(255, 243, 218, .75)";
  context.font = "8px monospace";
  context.textAlign = "center";
  context.fillText("YOU", player.x, player.y + 27);
}

function drawDust() {
  for (let index = 0; index < 26; index += 1) {
    const drift = ((elapsed * (7 + index % 5) + index * 97) % 1040) - 40;
    const y = 274 + (index * 61) % 265;
    context.globalAlpha = 0.1 + (index % 4) * 0.04;
    context.fillStyle = "#ffcf9f";
    context.beginPath();
    context.arc(drift, y, index % 3 === 0 ? 1.5 : 1, 0, Math.PI * 2);
    context.fill();
  }
  context.globalAlpha = 1;
}

function draw() {
  if (!context || !canvas.width) return;
  context.clearRect(0, 0, world.width, world.height);
  drawBackground();
  for (const sample of samples) {
    if (!sample.collected) drawSample(sample);
  }
  drawDust();
  drawAstronaut();
}

function collectedCount() {
  return samples.filter((sample) => sample.collected).length;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => toast.classList.remove("visible"), 2300);
}

function updateHud() {
  const count = collectedCount();
  sampleCount.innerHTML = `${String(count).padStart(2, "0")} <span>/ 05</span>`;
  sampleProgress.style.width = `${count * 20}%`;
  sampleCheck.classList.toggle("complete", count === samples.length);
  beaconCheck.classList.toggle("complete", won);
  coordinates.textContent = `${(18.7 + player.y / 1000).toFixed(1)}° N\u00a0 ${(42.3 + player.x / 1000).toFixed(1)}° E`;
  mapPlayer.style.left = `${Math.max(3, Math.min(93, player.x / world.width * 100))}%`;
  mapPlayer.style.bottom = `${Math.max(8, Math.min(78, (1 - player.y / world.height) * 78))}%`;
}

function update(delta) {
  if (!playing || won) return;
  let dx = 0;
  let dy = 0;
  if (keys.has("arrowleft") || keys.has("a")) dx -= 1;
  if (keys.has("arrowright") || keys.has("d")) dx += 1;
  if (keys.has("arrowup") || keys.has("w")) dy -= 1;
  if (keys.has("arrowdown") || keys.has("s")) dy += 1;
  if (dx && dy) { dx *= Math.SQRT1_2; dy *= Math.SQRT1_2; }

  if (dx) player.direction = dx > 0 ? 1 : -1;
  const speed = keys.has("shift") ? player.speed * 1.48 : player.speed;
  player.x = Math.max(19, Math.min(world.width - 19, player.x + dx * speed * delta));
  player.y = Math.max(36, Math.min(world.height - 29, player.y + dy * speed * delta));

  for (const sample of samples) {
    if (!sample.collected && Math.hypot(player.x - sample.x, player.y - sample.y) < 24) {
      sample.collected = true;
      const count = collectedCount();
      showToast(count === samples.length ? "All samples secured — find the extraction beacon!" : "Research sample secured. Nice find!");
      updateHud();
    }
  }

  if (collectedCount() === samples.length && Math.hypot(player.x - beacon.x, player.y - beacon.y) < 39) {
    won = true;
    beaconCheck.classList.add("complete");
    showToast("MISSION COMPLETE — a new world, understood.");
    launchButton.innerHTML = "<span>↻</span> EXPLORE AGAIN <span class=\"button-arrow\">↗</span>";
    overlay.classList.remove("hidden");
    overlay.querySelector(".overlay-kicker").textContent = "MISSION ACCOMPLISHED";
    overlay.querySelector("h2").innerHTML = "A world<br><span>discovered.</span>";
    overlay.querySelector("p").innerHTML = "Five samples secured. Mars is a little less mysterious.";
  }

  updateHud();
}

function frame(timestamp) {
  if (!previousTime) previousTime = timestamp;
  const delta = Math.min((timestamp - previousTime) / 1000, 0.04);
  previousTime = timestamp;
  elapsed += delta;
  if (playing && !won) update(delta);
  draw();
  requestAnimationFrame(frame);
}

function startGame() {
  if (won) {
    player.x = 113;
    player.y = 391;
    for (const sample of samples) sample.collected = false;
    won = false;
    elapsed = 0;
  }
  playing = true;
  overlay.classList.add("hidden");
  overlay.querySelector(".overlay-kicker").textContent = "A NEW WORLD AWAITS";
  overlay.querySelector("h2").innerHTML = "Make your mark<br>on <span>Mars.</span>";
  overlay.querySelector("p").innerHTML = 'Collect <strong>5 research samples</strong>, then make your way to the beacon.';
  launchButton.innerHTML = "<span>▶</span> BEGIN EXPLORATION <span class=\"button-arrow\">↗</span>";
  updateHud();
}

launchButton.addEventListener("click", startGame);
window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key)) event.preventDefault();
  if (key === " " && !playing) startGame();
  keys.add(key);
});
window.addEventListener("keyup", (event) => keys.delete(event.key.toLowerCase()));
window.addEventListener("blur", () => keys.clear());
window.addEventListener("resize", resizeCanvas);

themeToggle.addEventListener("click", () => {
  const root = document.documentElement;
  const isLight = root.dataset.theme === "light";
  root.dataset.theme = isLight ? "dark" : "light";
  themeToggle.setAttribute("aria-label", isLight ? "Switch to light theme" : "Switch to dark theme");
  document.querySelector("#theme-icon").textContent = isLight ? "☼" : "☾";
  document.querySelector(".theme-label").textContent = isLight ? "LIGHT MODE" : "DARK MODE";
});

for (const button of document.querySelectorAll(".window-control.minimize")) {
  button.addEventListener("click", () => {
    const windowElement = button.closest(".window");
    const minimized = windowElement.classList.toggle("minimized");
    button.textContent = minimized ? "+" : "−";
    button.setAttribute("aria-label", `${minimized ? "Restore" : "Minimize"} ${windowElement.id.replace("-window", "").replaceAll("-", " ")} window`);
  });
}

for (const windowElement of document.querySelectorAll(".side-windows .window")) {
  const handle = windowElement.querySelector(".drag-handle");
  handle.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button")) return;
    const bounds = windowElement.getBoundingClientRect();
    const shiftX = event.clientX - bounds.left;
    const shiftY = event.clientY - bounds.top;
    windowElement.style.position = "fixed";
    windowElement.style.width = `${bounds.width}px`;
    windowElement.style.zIndex = "5";

    function move(moveEvent) {
      windowElement.style.left = `${Math.max(0, Math.min(window.innerWidth - bounds.width, moveEvent.clientX - shiftX))}px`;
      windowElement.style.top = `${Math.max(0, Math.min(window.innerHeight - 39, moveEvent.clientY - shiftY))}px`;
    }

    function stop() {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
      handle.releasePointerCapture?.(event.pointerId);
    }

    handle.setPointerCapture(event.pointerId);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
  });
}

window.setInterval(() => {
  if (!playing || won) return;
  const seconds = Math.floor(elapsed);
  clock.textContent = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}, 250);

resizeCanvas();
updateHud();
requestAnimationFrame(frame);
