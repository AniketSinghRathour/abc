const STORAGE_KEY = "createch.dynamic.scenarios.v2";

const strategyLibrary = {
  highrise: [
    "Core-First Slipform + Robotics",
    "Hybrid Prefab Floor Pods",
    "4D Twin-Crane Fast Track",
  ],
  bridge: [
    "Segmental Launching BIM-Controlled",
    "Balanced Cantilever Smart Formwork",
    "Accelerated Prefab Deck Installation",
  ],
  hospital: [
    "MEP Corridor First + Modular Rooms",
    "Parallel Clinical Wing Delivery",
    "Digital Twin Commissioning Flow",
  ],
  industrial: [
    "Steel Mega-Block Assembly",
    "Pipe Rack Modular Lift Plan",
    "Parallel Civil + Process Installation",
  ],
};

const integrationSystems = [
  { name: "BIM 360", status: "ok", latency: 1.2 },
  { name: "Primavera P6", status: "ok", latency: 2.1 },
  { name: "Procore", status: "live", latency: 1.7 },
  { name: "IoT Edge Gateway", status: "live", latency: 0.9 },
  { name: "Drone Mapping", status: "warn", latency: 4.2 },
  { name: "SAP Procurement", status: "ok", latency: 1.8 },
];

const state = {
  scenarios: [],
  currentScenarioId: null,
  options: [],
  activeOption: null,
  sensorPaused: false,
  sensors: {
    weatherRisk: 0.17,
    laborAvailability: 0.9,
    equipmentHealth: 0.94,
    concreteVariance: 0.06,
    logisticsDelay: 0.09,
    safetyIncidents: 0.008,
    productivityIndex: 1.05,
  },
  simulation: null,
};

const dom = {
  form: document.getElementById("designForm"),
  formError: document.getElementById("formError"),
  projectType: document.getElementById("projectType"),
  budget: document.getElementById("budget"),
  deadline: document.getElementById("deadline"),
  area: document.getElementById("area"),
  sustainability: document.getElementById("sustainability"),
  safety: document.getElementById("safety"),
  sustainabilityLabel: document.getElementById("sustainabilityLabel"),
  safetyLabel: document.getElementById("safetyLabel"),
  generateBtn: document.getElementById("generateBtn"),
  recalibrateBtn: document.getElementById("recalibrateBtn"),
  toggleSensors: document.getElementById("toggleSensors"),
  strategyCards: document.getElementById("strategyCards"),
  strategyTemplate: document.getElementById("strategyTemplate"),
  kpiBoard: document.getElementById("kpiBoard"),
  timelineChart: document.getElementById("timelineChart"),
  sensorMatrix: document.getElementById("sensorMatrix"),
  integrationTableBody: document.getElementById("integrationTableBody"),
  actionFeed: document.getElementById("actionFeed"),
  systemHealth: document.getElementById("systemHealth"),
  scenarioName: document.getElementById("scenarioName"),
  scenarioList: document.getElementById("scenarioList"),
  saveScenarioBtn: document.getElementById("saveScenarioBtn"),
  newScenarioBtn: document.getElementById("newScenarioBtn"),
  exportBtn: document.getElementById("exportBtn"),
  importFile: document.getElementById("importFile"),
  engineState: document.getElementById("engineState"),
  syncStamp: document.getElementById("syncStamp"),
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}

function nowTime() {
  return new Date().toLocaleTimeString([], { hour12: false });
}

function uid() {
  return `scn-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function getInputs() {
  return {
    projectType: dom.projectType.value,
    budget: Number(dom.budget.value),
    deadline: Number(dom.deadline.value),
    area: Number(dom.area.value),
    sustainability: Number(dom.sustainability.value),
    safety: Number(dom.safety.value),
  };
}

function validateInputs(inputs) {
  if (!Number.isFinite(inputs.budget) || inputs.budget < 40 || inputs.budget > 900) {
    return "Budget must be between 40 and 900 million USD.";
  }
  if (!Number.isFinite(inputs.deadline) || inputs.deadline < 8 || inputs.deadline > 84) {
    return "Target duration must be between 8 and 84 months.";
  }
  if (!Number.isFinite(inputs.area) || inputs.area < 8 || inputs.area > 600) {
    return "Floor area must be between 8 and 600 thousand square meters.";
  }
  return "";
}

function scoreOption(option, inputs) {
  const schedule = clamp(option.scheduleScore, 0, 100);
  const cost = clamp(option.costConfidence, 0, 100);
  const safety = clamp(option.safetyScore, 0, 100);
  const sustainability = clamp(option.sustainabilityScore, 0, 100);
  const constructability = clamp(option.constructability, 0, 100);

  const weighted =
    schedule * 0.29 +
    cost * 0.23 +
    safety * (0.14 + inputs.safety / 1000) +
    sustainability * (0.11 + inputs.sustainability / 1200) +
    constructability * 0.23;

  return clamp(weighted, 0, 100);
}

function generateOptions(inputs) {
  const catalog = strategyLibrary[inputs.projectType] || strategyLibrary.highrise;
  const deadlinePressure = clamp((36 - inputs.deadline) / 28, 0.02, 1.35);
  const budgetStrength = clamp(inputs.budget / 220, 0.5, 2.2);
  const scalePenalty = clamp(inputs.area / 330, 0, 1.8);

  return catalog.map((name, index) => {
    const baseline = 76 - index * 3;
    const scheduleScore = clamp(
      baseline + (1 - deadlinePressure) * 10 - scalePenalty * 6 + Math.random() * 6,
      45,
      98
    );
    const costConfidence = clamp(
      baseline + budgetStrength * 8 - scalePenalty * 4 + Math.random() * 5,
      44,
      98
    );
    const safetyScore = clamp(inputs.safety * 0.78 + (2 - index) * 3 + Math.random() * 9, 50, 99);
    const sustainabilityScore = clamp(
      inputs.sustainability * 0.8 + index * 2 + Math.random() * 12,
      42,
      99
    );
    const constructability = clamp(72 + (2 - index) * 5 + Math.random() * 8 - scalePenalty * 5, 40, 98);

    const option = {
      id: `${name}-${index}-${Date.now()}`,
      name,
      scheduleScore,
      costConfidence,
      safetyScore,
      sustainabilityScore,
      constructability,
      prefabRatio: Math.round(clamp(24 + index * 14 + Math.random() * 18, 20, 78)),
      crewSize: Math.round(clamp(95 + inputs.area * 1.35 + index * 18 - deadlinePressure * 25, 80, 520)),
      dailyOutput: Math.round(clamp(210 + inputs.area * 3.8 + index * 18 + Math.random() * 55, 120, 2900)),
    };
    option.totalScore = scoreOption(option, inputs);
    return option;
  });
}

function runSimulation(option, inputs, sensors, iterations = 500) {
  let delaySum = 0;
  let costSum = 0;
  let reworkSum = 0;

  for (let i = 0; i < iterations; i += 1) {
    const weather = sensors.weatherRisk * (0.5 + Math.random());
    const labor = (1 - sensors.laborAvailability) * (0.35 + Math.random());
    const equipment = (1 - sensors.equipmentHealth) * (0.25 + Math.random());
    const logistics = sensors.logisticsDelay * (0.4 + Math.random());
    const quality = sensors.concreteVariance * (0.6 + Math.random());

    const delay = clamp(
      0.8 + weather * 5.8 + labor * 6.6 + logistics * 4.8 + equipment * 3.4 - option.scheduleScore / 45,
      0,
      12
    );
    const costOverrun = clamp(
      weather * 4.2 + labor * 6.3 + logistics * 6.9 + quality * 6.1 - option.costConfidence / 28,
      -2,
      22
    );
    const reworkRisk = clamp(
      quality * 0.36 + (1 - option.safetyScore / 100) * 0.14 + sensors.safetyIncidents * 2.2,
      0.01,
      0.6
    );

    delaySum += delay;
    costSum += costOverrun;
    reworkSum += reworkRisk;
  }

  const expectedDelay = delaySum / iterations;
  const expectedCostOverrun = costSum / iterations;
  const reworkProbability = reworkSum / iterations;

  const baselineDuration = inputs.deadline;
  const baselineCost = inputs.budget;
  const monthlySeries = [];
  for (let month = 1; month <= 12; month += 1) {
    const monthDelayTrend = expectedDelay * (month / 12) * (0.85 + Math.random() * 0.3);
    const monthCostTrend = expectedCostOverrun * (month / 12) * (0.88 + Math.random() * 0.25);
    monthlySeries.push({
      month,
      duration: clamp(baselineDuration * (month / 12) + monthDelayTrend, 0, baselineDuration * 1.2),
      cost: clamp(baselineCost * (month / 12) * (1 + monthCostTrend / 100), 0, baselineCost * 1.5),
    });
  }

  const productivityLift = clamp(
    option.totalScore / 8 + sensors.productivityIndex * 12 - expectedDelay * 2.6,
    3,
    42
  );

  return {
    expectedDelay,
    expectedCostOverrun,
    reworkProbability,
    productivityLift,
    scheduleReliability: clamp(100 - expectedDelay * 4.2, 58, 99),
    monthlySeries,
  };
}

function renderOptions() {
  dom.strategyCards.innerHTML = "";
  state.options.sort((a, b) => b.totalScore - a.totalScore);
  state.activeOption = state.options[0] || null;

  state.options.forEach((option, idx) => {
    const node = dom.strategyTemplate.content.cloneNode(true);
    const card = node.querySelector(".strategy-card");
    if (idx === 0) {
      card.classList.add("active");
    }

    node.querySelector(".strategy-name").textContent = option.name;
    node.querySelector(".strategy-score").textContent = option.totalScore.toFixed(1);
    const metrics = node.querySelector(".strategy-metrics");
    metrics.innerHTML = [
      `Schedule confidence: ${option.scheduleScore.toFixed(1)}%`,
      `Cost confidence: ${option.costConfidence.toFixed(1)}%`,
      `Safety resilience: ${option.safetyScore.toFixed(1)}%`,
      `Sustainability fit: ${option.sustainabilityScore.toFixed(1)}%`,
      `Prefabrication ratio: ${option.prefabRatio}%`,
      `Planned crew size: ${option.crewSize} workers`,
    ]
      .map((line) => `<li>${line}</li>`)
      .join("");

    dom.strategyCards.appendChild(node);
  });
}

function renderKpis() {
  if (!state.activeOption || !state.simulation) return;
  const sim = state.simulation;
  const kpis = [
    ["Expected Delay", `${sim.expectedDelay.toFixed(2)} months`],
    ["Expected Cost Overrun", `${sim.expectedCostOverrun.toFixed(2)}%`],
    ["Rework Probability", `${(sim.reworkProbability * 100).toFixed(1)}%`],
    ["Productivity Improvement", `${sim.productivityLift.toFixed(1)}%`],
    ["Schedule Reliability", `${sim.scheduleReliability.toFixed(1)}%`],
    ["Daily Output", `${state.activeOption.dailyOutput.toLocaleString()} m²/day`],
  ];

  dom.kpiBoard.innerHTML = kpis
    .map(([label, value]) => `<article class="kpi"><span>${label}</span><strong>${value}</strong></article>`)
    .join("");
}

function renderTimelineChart() {
  if (!state.simulation) return;

  const svg = dom.timelineChart;
  const { monthlySeries } = state.simulation;
  const width = 800;
  const height = 240;
  const margin = { top: 18, right: 18, bottom: 28, left: 44 };
  const chartW = width - margin.left - margin.right;
  const chartH = height - margin.top - margin.bottom;

  const maxDuration = Math.max(...monthlySeries.map((d) => d.duration), 1);
  const maxCost = Math.max(...monthlySeries.map((d) => d.cost), 1);

  const pointsDuration = monthlySeries
    .map((d, i) => {
      const x = margin.left + (i / (monthlySeries.length - 1)) * chartW;
      const y = margin.top + chartH - (d.duration / maxDuration) * chartH;
      return `${x},${y}`;
    })
    .join(" ");

  const pointsCost = monthlySeries
    .map((d, i) => {
      const x = margin.left + (i / (monthlySeries.length - 1)) * chartW;
      const y = margin.top + chartH - (d.cost / maxCost) * chartH;
      return `${x},${y}`;
    })
    .join(" ");

  const xLabels = monthlySeries
    .filter((d) => d.month % 3 === 0)
    .map((d, i) => {
      const x = margin.left + ((d.month - 1) / (monthlySeries.length - 1)) * chartW;
      return `<text x="${x}" y="${height - 8}" font-size="11" fill="#9fb3d9">M${d.month}</text>`;
    })
    .join("");

  svg.innerHTML = `
    <rect x="0" y="0" width="${width}" height="${height}" fill="#0a1324" rx="12" />
    <line x1="${margin.left}" y1="${height - margin.bottom}" x2="${width - margin.right}" y2="${height - margin.bottom}" stroke="#2a3d63" />
    <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${height - margin.bottom}" stroke="#2a3d63" />
    <polyline fill="none" stroke="#38c9ff" stroke-width="3" points="${pointsDuration}" />
    <polyline fill="none" stroke="#ffc971" stroke-width="3" points="${pointsCost}" />
    <text x="${margin.left}" y="14" font-size="11" fill="#38c9ff">Duration trend</text>
    <text x="${margin.left + 125}" y="14" font-size="11" fill="#ffc971">Cost trend</text>
    ${xLabels}
  `;
}

function statusClass(value, goodThreshold, warnThreshold) {
  if (value >= goodThreshold) return "good";
  if (value >= warnThreshold) return "warn";
  return "bad";
}

function renderSensors() {
  const list = [
    {
      label: "Labor Availability",
      value: `${(state.sensors.laborAvailability * 100).toFixed(1)}%`,
      status: statusClass(state.sensors.laborAvailability, 0.88, 0.78),
    },
    {
      label: "Equipment Health",
      value: `${(state.sensors.equipmentHealth * 100).toFixed(1)}%`,
      status: statusClass(state.sensors.equipmentHealth, 0.9, 0.8),
    },
    {
      label: "Weather Risk",
      value: `${(state.sensors.weatherRisk * 100).toFixed(1)}%`,
      status: statusClass(1 - state.sensors.weatherRisk, 0.83, 0.7),
    },
    {
      label: "Concrete Variance",
      value: `${(state.sensors.concreteVariance * 100).toFixed(2)}%`,
      status: statusClass(1 - state.sensors.concreteVariance, 0.9, 0.8),
    },
    {
      label: "Logistics Delay",
      value: `${(state.sensors.logisticsDelay * 100).toFixed(1)}%`,
      status: statusClass(1 - state.sensors.logisticsDelay, 0.85, 0.72),
    },
    {
      label: "Safety Incidents",
      value: `${(state.sensors.safetyIncidents * 100).toFixed(2)}%`,
      status: statusClass(1 - state.sensors.safetyIncidents * 5, 0.9, 0.75),
    },
  ];

  dom.sensorMatrix.innerHTML = list
    .map(
      (sensor) => `
      <article class="sensor-tile">
        <header><span>${sensor.label}</span><span class="sensor-status ${sensor.status}">${sensor.status.toUpperCase()}</span></header>
        <strong>${sensor.value}</strong>
      </article>
    `
    )
    .join("");
}

function renderIntegrations() {
  dom.integrationTableBody.innerHTML = integrationSystems
    .map((system) => {
      const pill = system.status === "ok" ? "ok" : system.status === "live" ? "live" : "warn";
      const statusText = system.status === "ok" ? "Synchronized" : system.status === "live" ? "Streaming" : "Degraded";
      return `
        <tr>
          <td>${system.name}</td>
          <td><span class="pill ${pill}">${statusText}</span></td>
          <td>${system.latency.toFixed(1)}s</td>
          <td>${nowTime()}</td>
        </tr>
      `;
    })
    .join("");
}

function renderActions() {
  if (!state.simulation || !state.activeOption) return;

  const actions = [];
  const sim = state.simulation;

  if (state.sensors.weatherRisk > 0.23) {
    actions.push("Shift 22% of weather-sensitive exterior scope to prefab zones and enclosed assembly windows.");
  }
  if (state.sensors.laborAvailability < 0.82) {
    actions.push("Labor dip detected: trigger autonomous layout robotics and issue targeted subcontractor call-off.");
  }
  if (state.sensors.logisticsDelay > 0.12) {
    actions.push("Supply-chain disruption forecasted: re-sequence steel and MEP package arrivals with buffer stock protocol.");
  }
  if (sim.reworkProbability > 0.17) {
    actions.push("Increase QA frequency to daily digital inspections and deploy drone reality capture for clash verification.");
  }
  if (sim.expectedCostOverrun > 7) {
    actions.push("Activate cost guardrail mode: switch to value-engineered details on non-critical architectural packages.");
  }

  actions.push(
    `${state.activeOption.name} remains the lead method with ${sim.productivityLift.toFixed(
      1
    )}% forecast productivity gain and ${sim.scheduleReliability.toFixed(1)}% schedule reliability.`
  );

  dom.actionFeed.innerHTML = actions
    .slice(0, 6)
    .map((item) => `<li><time>${nowTime()}</time>${item}</li>`)
    .join("");
}

function updateHealthPill() {
  const risk =
    state.sensors.weatherRisk * 0.22 +
    (1 - state.sensors.laborAvailability) * 0.22 +
    (1 - state.sensors.equipmentHealth) * 0.2 +
    state.sensors.logisticsDelay * 0.2 +
    state.sensors.safetyIncidents * 6;

  let text = "System Healthy";
  let className = "health-pill";

  if (risk > 0.38) {
    text = "System Alert";
    className += " alert";
  } else if (risk > 0.24) {
    text = "System Watch";
    className += " watch";
  }

  dom.systemHealth.className = className;
  dom.systemHealth.textContent = text;
}

function recalculate() {
  const inputs = getInputs();
  const validationError = validateInputs(inputs);
  dom.formError.textContent = validationError;
  if (validationError) return;

  state.options = generateOptions(inputs);
  renderOptions();
  state.simulation = runSimulation(state.activeOption, inputs, state.sensors);
  renderKpis();
  renderTimelineChart();
  renderActions();
  updateHealthPill();
  dom.syncStamp.textContent = nowTime();
}

function recalibrateWithSensors() {
  if (!state.options.length) return;
  state.options = state.options.map((option) => {
    const improvedSchedule = option.scheduleScore + (state.sensors.productivityIndex - 1) * 9 - state.sensors.weatherRisk * 8;
    const improvedCost = option.costConfidence + state.sensors.equipmentHealth * 2 - state.sensors.logisticsDelay * 10;
    const improvedSafety = option.safetyScore + (1 - state.sensors.safetyIncidents * 7) * 2.2;
    const tuned = {
      ...option,
      scheduleScore: clamp(improvedSchedule, 40, 99),
      costConfidence: clamp(improvedCost, 36, 99),
      safetyScore: clamp(improvedSafety, 40, 99),
    };
    tuned.totalScore = scoreOption(tuned, getInputs());
    return tuned;
  });

  renderOptions();
  state.simulation = runSimulation(state.activeOption, getInputs(), state.sensors);
  renderKpis();
  renderTimelineChart();
  renderActions();
  updateHealthPill();
  dom.engineState.textContent = "Recalibrated";
  setTimeout(() => {
    dom.engineState.textContent = state.sensorPaused ? "Paused" : "Online";
  }, 1400);
}

function sensorTick() {
  if (state.sensorPaused) return;

  state.sensors.weatherRisk = clamp(state.sensors.weatherRisk + (Math.random() - 0.52) * 0.02, 0.05, 0.34);
  state.sensors.laborAvailability = clamp(state.sensors.laborAvailability + (Math.random() - 0.5) * 0.032, 0.64, 0.98);
  state.sensors.equipmentHealth = clamp(state.sensors.equipmentHealth + (Math.random() - 0.53) * 0.022, 0.72, 0.99);
  state.sensors.concreteVariance = clamp(state.sensors.concreteVariance + (Math.random() - 0.49) * 0.012, 0.02, 0.16);
  state.sensors.logisticsDelay = clamp(state.sensors.logisticsDelay + (Math.random() - 0.5) * 0.02, 0.03, 0.2);
  state.sensors.safetyIncidents = clamp(state.sensors.safetyIncidents + (Math.random() - 0.52) * 0.004, 0, 0.04);
  state.sensors.productivityIndex = clamp(state.sensors.productivityIndex + (Math.random() - 0.5) * 0.04, 0.78, 1.25);

  if (state.activeOption) {
    state.simulation = runSimulation(state.activeOption, getInputs(), state.sensors);
  }

  renderSensors();
  renderIntegrations();
  renderKpis();
  renderTimelineChart();
  renderActions();
  updateHealthPill();
  dom.syncStamp.textContent = nowTime();
}

function persistScenarios() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.scenarios));
}

function loadScenarios() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    state.scenarios = Array.isArray(data) ? data : [];
  } catch {
    state.scenarios = [];
  }
}

function refreshScenarioList() {
  dom.scenarioList.innerHTML = state.scenarios
    .map((s) => `<option value="${s.id}">${s.name}</option>`)
    .join("");

  if (state.currentScenarioId) {
    dom.scenarioList.value = state.currentScenarioId;
  }
}

function saveScenario() {
  const inputs = getInputs();
  const err = validateInputs(inputs);
  if (err) {
    dom.formError.textContent = err;
    return;
  }

  const name = dom.scenarioName.value.trim() || "Untitled Scenario";
  const payload = {
    id: state.currentScenarioId || uid(),
    name,
    inputs,
    sensors: state.sensors,
    updatedAt: new Date().toISOString(),
  };

  const existingIndex = state.scenarios.findIndex((s) => s.id === payload.id);
  if (existingIndex >= 0) {
    state.scenarios[existingIndex] = payload;
  } else {
    state.scenarios.push(payload);
  }

  state.currentScenarioId = payload.id;
  refreshScenarioList();
  persistScenarios();
  dom.formError.textContent = `Scenario "${name}" saved.`;
}

function loadScenarioById(id) {
  const scenario = state.scenarios.find((s) => s.id === id);
  if (!scenario) return;
  state.currentScenarioId = scenario.id;
  dom.scenarioName.value = scenario.name;
  dom.projectType.value = scenario.inputs.projectType;
  dom.budget.value = scenario.inputs.budget;
  dom.deadline.value = scenario.inputs.deadline;
  dom.area.value = scenario.inputs.area;
  dom.sustainability.value = scenario.inputs.sustainability;
  dom.safety.value = scenario.inputs.safety;
  state.sensors = { ...state.sensors, ...scenario.sensors };
  updateSliderLabels();
  recalculate();
}

function createNewScenario() {
  state.currentScenarioId = null;
  dom.scenarioName.value = "New Scenario";
  dom.formError.textContent = "";
}

function exportScenarios() {
  const blob = new Blob([JSON.stringify(state.scenarios, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `createch-scenarios-${Date.now()}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function importScenarios(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(String(reader.result || "[]"));
      if (!Array.isArray(imported)) {
        throw new Error("Invalid JSON structure");
      }
      state.scenarios = imported.filter((entry) => entry && entry.id && entry.inputs);
      persistScenarios();
      refreshScenarioList();
      if (state.scenarios[0]) {
        loadScenarioById(state.scenarios[0].id);
      }
      dom.formError.textContent = `Imported ${state.scenarios.length} scenarios.`;
    } catch {
      dom.formError.textContent = "Unable to import file. Please provide a valid CreaTech scenario JSON export.";
    }
  };
  reader.readAsText(file);
}

function updateSliderLabels() {
  dom.sustainabilityLabel.textContent = `${dom.sustainability.value}%`;
  dom.safetyLabel.textContent = `${dom.safety.value}%`;
}

function bindEvents() {
  dom.generateBtn.addEventListener("click", recalculate);
  dom.recalibrateBtn.addEventListener("click", recalibrateWithSensors);

  dom.toggleSensors.addEventListener("click", () => {
    state.sensorPaused = !state.sensorPaused;
    dom.toggleSensors.textContent = state.sensorPaused ? "Resume Sensor Stream" : "Pause Sensor Stream";
    dom.engineState.textContent = state.sensorPaused ? "Paused" : "Online";
  });

  dom.sustainability.addEventListener("input", updateSliderLabels);
  dom.safety.addEventListener("input", updateSliderLabels);

  dom.saveScenarioBtn.addEventListener("click", saveScenario);
  dom.newScenarioBtn.addEventListener("click", createNewScenario);
  dom.scenarioList.addEventListener("change", (event) => loadScenarioById(event.target.value));

  dom.exportBtn.addEventListener("click", exportScenarios);
  dom.importFile.addEventListener("change", (event) => {
    const [file] = event.target.files || [];
    if (file) importScenarios(file);
    event.target.value = "";
  });
}

function init() {
  bindEvents();
  loadScenarios();
  refreshScenarioList();
  updateSliderLabels();
  renderSensors();
  renderIntegrations();
  recalculate();

  if (state.scenarios[0]) {
    loadScenarioById(state.scenarios[0].id);
  }

  setInterval(sensorTick, 2500);
}

init();
