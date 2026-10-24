const $ = (id) => document.getElementById(id);

const state = {
  demo: true,
  current: { moisture: 12.5, resistivity: 48.2, potential: -120, temperature: 28, humidity: 65 },
  history: [],
  riskSeries: [18, 20, 19, 22, 21, 23, 24],
  endpoint: localStorage.getItem("cg_endpoint") || "",
};

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

function calculateRisk(d) {
  // Prototype screening index only — not an engineering acceptance criterion.
  let moisture = clamp((d.moisture - 8) / 22, 0, 1) * 25;
  let resistivity = clamp((35 - d.resistivity) / 35, 0, 1) * 25;
  let potential = clamp((Math.abs(d.potential) - 150) / 250, 0, 1) * 35;
  let humidity = clamp((d.humidity - 55) / 45, 0, 1) * 10;
  let temperature = clamp((d.temperature - 25) / 25, 0, 1) * 5;
  return Math.round(clamp(moisture + resistivity + potential + humidity + temperature, 0, 100));
}

function riskInfo(score) {
  if (score < 30) return { label: "LOW RISK", className: "low", message: "Routine monitoring is appropriate based on the prototype screening index.", action: "Continue periodic measurements and compare trends over time." };
  if (score < 60) return { label: "MODERATE RISK", className: "medium", message: "Some indicators suggest increased corrosion exposure or activity.", action: "Schedule a closer inspection and repeat measurements under controlled conditions." };
  if (score < 80) return { label: "HIGH RISK", className: "high", message: "Multiple indicators are elevated and warrant engineering review.", action: "Arrange a detailed inspection using appropriate non-destructive/electrochemical methods." };
  return { label: "VERY HIGH RISK", className: "high", message: "The screening indicators are strongly elevated.", action: "Escalate for prompt engineering assessment; do not use this prototype alone to make safety decisions." };
}

function updateUI() {
  const d = state.current;
  const score = calculateRisk(d);
  const info = riskInfo(score);

  $("riskScore").textContent = score;
  $("riskLabel").textContent = info.label;
  $("moistureValue").textContent = `${d.moisture.toFixed(1)}%`;
  $("resistivityValue").textContent = `${d.resistivity.toFixed(1)} kΩ·cm`;
  $("potentialValue").textContent = `${Math.round(d.potential)} mV`;
  $("temperatureValue").textContent = `${d.temperature.toFixed(1)}°C`;
  $("humidityValue").textContent = `RH ${Math.round(d.humidity)}%`;

  const orb = $("riskOrb");
  const ring = $("assessmentRing");
  const color = score < 30 ? "#10b981" : score < 60 ? "#f59e0b" : "#ef4444";
  orb.style.borderColor = `${color}88`;
  orb.style.background = `${color}20`;
  ring.style.borderColor = color;
  ring.style.background = `${color}12`;

  $("assessmentScore").textContent = score;
  $("assessmentLabel").textContent = info.label.replace("RISK", "screening risk");
  $("assessmentMessage").textContent = info.message;
  $("recommendationBox").querySelector("span").textContent = info.action;

  $("moistureTrend").textContent = d.moisture > 25 ? "Elevated" : "Stable";
  $("resistivityTrend").textContent = d.resistivity < 20 ? "Low / higher concern" : "Favorable";
  $("potentialTrend").textContent = Math.abs(d.potential) > 350 ? "Strong activity indication" : "Context dependent";

  renderFactors(d);
  renderReport(d, score, info);
  drawChart();
}

function renderFactors(d) {
  const factors = [
    ["Moisture", clamp((d.moisture - 8) / 22, 0, 1), `${d.moisture.toFixed(1)}%`],
    ["Resistivity", clamp((35 - d.resistivity) / 35, 0, 1), `${d.resistivity.toFixed(1)} kΩ·cm`],
    ["Potential", clamp((Math.abs(d.potential) - 150) / 250, 0, 1), `${Math.round(d.potential)} mV`],
    ["Humidity", clamp((d.humidity - 55) / 45, 0, 1), `RH ${Math.round(d.humidity)}%`],
  ];
  $("factorGrid").innerHTML = factors.map(([name, value, display]) => `
    <div class="factor">
      <strong>${name}</strong>
      <span>${display}</span>
      <div class="factor-bar"><i style="width:${Math.round(value * 100)}%"></i></div>
    </div>`).join("");
}

function renderReport(d, score, info) {
  $("reportDate").textContent = `Generated: ${new Date().toLocaleString()}`;
  $("reportStatus").textContent = info.label;
  $("reportRisk").textContent = `${score}/100`;
  $("reportIndicators").innerHTML = [
    `Moisture: <strong>${d.moisture.toFixed(1)}%</strong>`,
    `Concrete resistivity: <strong>${d.resistivity.toFixed(1)} kΩ·cm</strong>`,
    `Corrosion potential: <strong>${Math.round(d.potential)} mV</strong>`,
    `Temperature / RH: <strong>${d.temperature.toFixed(1)}°C / ${Math.round(d.humidity)}%</strong>`,
  ].map(x => `<li>${x}</li>`).join("");
  $("reportAction").textContent = info.action;
}

function drawChart() {
  const canvas = $("riskChart");
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);

  const w = rect.width, h = rect.height;
  const pad = { l: 42, r: 18, t: 18, b: 32 };
  const series = state.riskSeries.slice(-Number($("rangeSelect").value));
  const max = 100, min = 0;
  const x = i => pad.l + i * ((w - pad.l - pad.r) / Math.max(series.length - 1, 1));
  const y = v => h - pad.b - (v - min) / (max - min) * (h - pad.t - pad.b);

  ctx.clearRect(0, 0, w, h);
  ctx.font = "10px DM Sans";
  ctx.strokeStyle = "#e7ebf2";
  ctx.fillStyle = "#7b8495";

  [0, 25, 50, 75, 100].forEach(v => {
    ctx.beginPath(); ctx.moveTo(pad.l, y(v)); ctx.lineTo(w - pad.r, y(v)); ctx.stroke();
    ctx.fillText(v, 10, y(v) + 3);
  });

  const gradient = ctx.createLinearGradient(0, pad.t, 0, h);
  gradient.addColorStop(0, "rgba(37,99,235,.20)");
  gradient.addColorStop(1, "rgba(37,99,235,0)");

  ctx.beginPath();
  series.forEach((v,i) => i ? ctx.lineTo(x(i), y(v)) : ctx.moveTo(x(i), y(v)));
  ctx.lineTo(x(series.length - 1), h-pad.b);
  ctx.lineTo(x(0), h-pad.b);
  ctx.closePath();
  ctx.fillStyle = gradient; ctx.fill();

  ctx.beginPath();
  series.forEach((v,i) => i ? ctx.lineTo(x(i), y(v)) : ctx.moveTo(x(i), y(v)));
  ctx.strokeStyle = "#2563eb"; ctx.lineWidth = 3; ctx.stroke();

  series.forEach((v,i) => {
    ctx.beginPath(); ctx.arc(x(i), y(v), 4, 0, Math.PI*2);
    ctx.fillStyle = "#fff"; ctx.fill();
    ctx.strokeStyle = "#2563eb"; ctx.lineWidth = 2; ctx.stroke();
  });
}

function seedHistory() {
  const now = Date.now();
  state.history = Array.from({length: 12}, (_, i) => {
    const d = {
      moisture: 11 + Math.random() * 13,
      resistivity: 22 + Math.random() * 35,
      potential: -100 - Math.random() * 310,
      temperature: 25 + Math.random() * 8,
      humidity: 55 + Math.random() * 25
    };
    return { ...d, risk: calculateRisk(d), zone: ["B-04","B-05","Column C-12","Slab S-07"][i % 4], time: new Date(now - i*6*3600e3) };
  });
  localStorage.setItem("cg_history", JSON.stringify(state.history));
}

function loadHistory() {
  try {
    const saved = JSON.parse(localStorage.getItem("cg_history") || "null");
    if (Array.isArray(saved) && saved.length) state.history = saved.map(x => ({...x, time:new Date(x.time)}));
    else seedHistory();
  } catch { seedHistory(); }
}

function renderHistory() {
  const q = $("historySearch").value.toLowerCase();
  const rows = state.history.filter(r => `${r.zone} ${riskInfo(r.risk).label}`.toLowerCase().includes(q));
  $("historyBody").innerHTML = rows.map(r => {
    const info = riskInfo(r.risk);
    return `<tr>
      <td>${r.time.toLocaleString()}</td><td>${r.zone}</td><td>${r.risk}</td>
      <td>${r.moisture.toFixed(1)}%</td><td>${r.resistivity.toFixed(1)}</td>
      <td>${Math.round(r.potential)} mV</td><td><span class="status-pill ${info.className}">${info.label}</span></td>
    </tr>`;
  }).join("");
}

function renderInspection() {
  const zones = [
    ["Beam B-04", 24, "Routine monitoring"],
    ["Column C-12", 47, "Repeat measurement"],
    ["Slab S-07", 64, "Engineering inspection"],
    ["Beam B-09", 31, "Closer monitoring"],
  ];
  $("inspectionList").innerHTML = zones.map(z => {
    const info = riskInfo(z[1]);
    return `<div class="inspection-item"><div><strong>${z[0]}</strong><small>${z[2]}</small></div><span class="status-pill ${info.className}">${z[1]}</span></div>`;
  }).join("");
}

function renderDevices() {
  const devices = [
    ["CG-ESP32-01","Beam B-04","Online","2 min ago","92%"],
    ["CG-ESP32-02","Column C-12","Online","4 min ago","87%"],
    ["CG-ESP32-03","Slab S-07","Attention","19 min ago","61%"],
  ];
  $("deviceGrid").innerHTML = devices.map(d => `
    <article class="device-card">
      <div class="device-head"><span class="device-name">${d[0]}</span><span class="status-pill ${d[2]==="Online"?"low":"medium"}">${d[2]}</span></div>
      <p>${d[1]}</p>
      <div class="device-meta">
        <div><small>Last packet</small><strong>${d[3]}</strong></div>
        <div><small>Battery</small><strong>${d[4]}</strong></div>
      </div>
    </article>`).join("");
}

function generateReading(highRisk=false) {
  const d = highRisk ? {
    moisture: 31 + Math.random()*8,
    resistivity: 8 + Math.random()*8,
    potential: -390 - Math.random()*90,
    temperature: 31 + Math.random()*4,
    humidity: 78 + Math.random()*15
  } : {
    moisture: 9 + Math.random()*15,
    resistivity: 25 + Math.random()*35,
    potential: -90 - Math.random()*260,
    temperature: 26 + Math.random()*5,
    humidity: 55 + Math.random()*20
  };
  state.current = d;
  const risk = calculateRisk(d);
  state.riskSeries.push(risk);
  state.riskSeries = state.riskSeries.slice(-30);
  state.history.unshift({...d, risk, zone:"B-04", time:new Date()});
  state.history = state.history.slice(0, 50);
  localStorage.setItem("cg_history", JSON.stringify(state.history));
  $("lastSync").textContent = `Last sync: ${new Date().toLocaleTimeString()}`;
  updateUI(); renderHistory();
}

function showToast(message) {
  const t = $("toast");
  t.textContent = message; t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2400);
}

function switchSection(section) {
  document.querySelectorAll(".page-section").forEach(s => s.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
  $(section).classList.add("active");
  document.querySelector(`[data-section="${section}"]`)?.classList.add("active");
  const titles = {dashboard:"Structural Health Dashboard",scan:"Scan & Assess",history:"Monitoring History",devices:"Sensor Devices",report:"Inspection Report"};
  $("pageTitle").textContent = titles[section] || "CorrosionGuard";
  if (section === "history") renderHistory();
}

document.querySelectorAll(".nav-item").forEach(btn => btn.addEventListener("click", () => switchSection(btn.dataset.section)));
document.querySelectorAll("[data-section-target]").forEach(btn => btn.addEventListener("click", () => switchSection(btn.dataset.sectionTarget)));

$("simulateBtn").addEventListener("click", () => { generateReading(false); showToast("New simulated sensor reading received."); });
$("toggleDemo").addEventListener("click", () => {
  state.demo = !state.demo;
  $("toggleDemo").textContent = state.demo ? "Pause simulation" : "Resume simulation";
  showToast(state.demo ? "Demo simulation resumed." : "Demo simulation paused.");
});
$("rangeSelect").addEventListener("change", drawChart);
window.addEventListener("resize", drawChart);

$("assessmentForm").addEventListener("submit", (e) => {
  e.preventDefault();
  state.current = {
    moisture: Number($("inputMoisture").value),
    resistivity: Number($("inputResistivity").value),
    potential: Number($("inputPotential").value),
    temperature: Number($("inputTemperature").value),
    humidity: Number($("inputHumidity").value),
  };
  const risk = calculateRisk(state.current);
  state.riskSeries.push(risk);
  state.history.unshift({...state.current, risk, zone:"B-04", time:new Date()});
  localStorage.setItem("cg_history", JSON.stringify(state.history.slice(0,50)));
  updateUI(); renderHistory();
  showToast("Assessment updated.");
});

$("loadDemo").addEventListener("click", () => {
  $("inputMoisture").value = 34;
  $("inputResistivity").value = 11;
  $("inputPotential").value = -420;
  $("inputTemperature").value = 32;
  $("inputHumidity").value = 86;
  showToast("High-risk demonstration values loaded.");
});
$("historySearch").addEventListener("input", renderHistory);
$("clearHistory").addEventListener("click", () => {
  if (confirm("Clear local prototype history?")) {
    state.history = []; localStorage.removeItem("cg_history"); renderHistory(); showToast("History cleared.");
  }
});
$("reportBtn").addEventListener("click", () => switchSection("report"));
$("printReport").addEventListener("click", () => window.print());
$("testApi").addEventListener("click", async () => {
  const endpoint = state.endpoint || prompt("Enter your ESP32 JSON endpoint:", "http://192.168.4.1/api/sensor/latest");
  if (!endpoint) return;
  state.endpoint = endpoint; localStorage.setItem("cg_endpoint", endpoint);
  try {
    const res = await fetch(endpoint, {headers: {"Accept":"application/json"}});
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const d = await res.json();
    state.current = {...state.current, ...d};
    updateUI(); showToast("ESP32 data received successfully.");
  } catch (err) {
    showToast(`Endpoint test failed: ${err.message}`);
  }
});

loadHistory();
renderInspection();
renderDevices();
updateUI();

setInterval(() => {
  if (state.demo) generateReading(false);
}, 12000);
