const state = {
  options: [],
  activeOption: null,
  sensorsPaused: false,
  sensors: {
    weatherRisk: 0.18,
    concreteCureVariance: 0.07,
    laborAvailability: 0.9,
    equipmentHealth: 0.93,
    productivityIndex: 1.0,
    safetyIncidents: 0.01,
  },
};

const optionProfiles = {
  highrise: ["Core-First Slipform", "Hybrid Modular Floors", "Twin-Crane Fast Track"],
  bridge: ["Segmental Launching", "Balanced Cantilever", "Accelerated Prefab Deck"],
  industrial: ["Phased Steel Mega-Blocks", "MEP-First Rack Strategy", "Parallel Civil + Process"],
};

const integrations = [
  { tool: "BIM 360", status: "Synchronized", latency: "1.3s" },
  { tool: "Primavera P6", status: "Synchronized", latency: "2.1s" },
  { tool: "SAP Procurement", status: "Synchronized", latency: "1.7s" },
  { tool: "IoT Edge Gateway", status: "Live Streaming", latency: "0.8s" },
  { tool: "Drone Mapping Pipeline", status: "Live Streaming", latency: "4.4s" },
];

const el = {
  form: document.getElementById("designForm"),
  options: document.getElementById("designOptions"),
  simulationKpis: document.getElementById("simulationKpis"),
  sensorGrid: document.getElementById("sensorGrid"),
  actionLog: document.getElementById("actionLog"),
  integrationList: document.getElementById("integrationList"),
  recalibrateBtn: document.getElementById("recalibrateBtn"),
  toggleSensors: document.getElementById("toggleSensors"),
  status: document.getElementById("systemStatus"),
  sustainability: document.getElementById("sustainability"),
  sustainabilityValue: document.getElementById("sustainabilityValue"),
  safety: document.getElementById("safety"),
  safetyValue: document.getElementById("safetyValue"),
};

function clamp(v, min, max) {
  return Math.max(min, Math.min(v, max));
}

function renderIntegrations() {
  el.integrationList.innerHTML = integrations
    .map(
      (item) =>
        `<li><strong>${item.tool}:</strong> ${item.status} <span style="color:#9fb0d0">(Latency ${item.latency})</span></li>`
    )
    .join("");
}

function generateDesignOptions(inputs) {
  const names = optionProfiles[inputs.projectType];
  const pressure = clamp((36 - inputs.deadline) / 30, 0.05, 1.1);
  const budgetFactor = clamp(inputs.budget / 140, 0.6, 1.4);

  return names.map((name, index) => {
    const innovation = 68 + Math.random() * 27;
    const scheduleScore = clamp(72 + pressure * 20 - index * 6 + Math.random() * 6, 45, 99);
    const costConfidence = clamp(70 + budgetFactor * 13 - index * 4 + Math.random() * 5, 46, 98);
    const safetyResilience = clamp(inputs.safety * 0.75 + Math.random() * 18 - index * 2, 40, 99);
    const sustainabilityFit = clamp(inputs.sustainability * 0.8 + (2 - index) * 4 + Math.random() * 10, 40, 99);

    const totalScore =
      scheduleScore * 0.31 +
      costConfidence * 0.23 +
      safetyResilience * 0.22 +
      sustainabilityFit * 0.16 +
      innovation * 0.08;

    return {
      id: `${name}-${Date.now()}-${index}`,
      name,
      scheduleScore,
      costConfidence,
      safetyResilience,
      sustainabilityFit,
      innovation,
      totalScore,
      crewPlan: Math.round(90 + index * 18 - pressure * 12 + Math.random() * 16),
      prefabRatio: Math.round(22 + index * 16 + Math.random() * 22),
    };
  });
}

function runMonteCarlo(option, sensors, iterations = 300) {
  let delaySum = 0;
  let costOverrunSum = 0;
  let reworkRiskSum = 0;

  for (let i = 0; i < iterations; i++) {
    const weatherImpact = sensors.weatherRisk * (0.5 + Math.random());
    const laborImpact = (1 - sensors.laborAvailability) * (0.4 + Math.random());
    const equipmentImpact = (1 - sensors.equipmentHealth) * (0.2 + Math.random());
    const qualityImpact = sensors.concreteCureVariance * (0.7 + Math.random());

    const delayMonths = clamp(
      1 + weatherImpact * 5 + laborImpact * 6 + equipmentImpact * 4 - option.scheduleScore / 40,
      0,
      9
    );
    const costOverrun = clamp(
      weatherImpact * 5 + laborImpact * 7 + qualityImpact * 6 - option.costConfidence / 27,
      -2,
      20
    );
    const reworkRisk = clamp(
      qualityImpact * 0.34 + (1 - option.safetyResilience / 100) * 0.16 + sensors.safetyIncidents * 2,
      0.01,
      0.55
    );

    delaySum += delayMonths;
    costOverrunSum += costOverrun;
    reworkRiskSum += reworkRisk;
  }

  return {
    expectedDelay: delaySum / iterations,
    expectedCostOverrun: costOverrunSum / iterations,
    reworkProbability: reworkRiskSum / iterations,
  };
}

function renderOptions() {
  state.options.sort((a, b) => b.totalScore - a.totalScore);
  state.activeOption = state.options[0];

  el.options.innerHTML = state.options
    .map(
      (option, idx) => `
      <article class="option" data-id="${option.id}" style="outline:${idx === 0 ? "2px solid #53d1ff" : "none"}">
        <h3>${option.name}</h3>
        <div class="score">${option.totalScore.toFixed(1)}</div>
        <ul class="metrics">
          <li>Schedule Confidence: ${option.scheduleScore.toFixed(1)}%</li>
          <li>Cost Confidence: ${option.costConfidence.toFixed(1)}%</li>
          <li>Safety Resilience: ${option.safetyResilience.toFixed(1)}%</li>
          <li>Sustainability Fit: ${option.sustainabilityFit.toFixed(1)}%</li>
          <li>Prefabrication Ratio: ${option.prefabRatio}%</li>
        </ul>
      </article>`
    )
    .join("");

  renderSimulation();
}

function renderSimulation() {
  if (!state.activeOption) return;
  const sim = runMonteCarlo(state.activeOption, state.sensors);

  const productivityLift = clamp(
    state.activeOption.totalScore / 70 + state.sensors.productivityIndex * 14 - sim.expectedDelay * 2.1,
    3,
    38
  );
  const scheduleRecovery = clamp(100 - sim.expectedDelay * 4.5, 65, 99);

  const kpis = [
    { label: "Expected Delay", value: `${sim.expectedDelay.toFixed(2)} mo` },
    { label: "Expected Cost Overrun", value: `${sim.expectedCostOverrun.toFixed(2)}%` },
    { label: "Rework Probability", value: `${(sim.reworkProbability * 100).toFixed(1)}%` },
    { label: "Predicted Productivity Lift", value: `${productivityLift.toFixed(1)}%` },
    { label: "Schedule Reliability", value: `${scheduleRecovery.toFixed(1)}%` },
    { label: "Optimal Crew Size", value: `${state.activeOption.crewPlan} workers` },
  ];

  el.simulationKpis.innerHTML = kpis
    .map((kpi) => `<article class="kpi"><div class="kpi-label">${kpi.label}</div><div class="kpi-value">${kpi.value}</div></article>`)
    .join("");

  logAdaptiveActions(sim, productivityLift);
}

function sensorStatus(value, minGood, minWarn) {
  if (value >= minGood) return "good";
  if (value >= minWarn) return "warn";
  return "bad";
}

function renderSensors() {
  const sensors = [
    {
      name: "Labor Availability",
      value: `${(state.sensors.laborAvailability * 100).toFixed(1)}%`,
      className: sensorStatus(state.sensors.laborAvailability, 0.88, 0.74),
    },
    {
      name: "Equipment Health",
      value: `${(state.sensors.equipmentHealth * 100).toFixed(1)}%`,
      className: sensorStatus(state.sensors.equipmentHealth, 0.9, 0.8),
    },
    {
      name: "Productivity Index",
      value: `${state.sensors.productivityIndex.toFixed(2)}`,
      className: sensorStatus(state.sensors.productivityIndex, 1.0, 0.88),
    },
    {
      name: "Weather Risk",
      value: `${(state.sensors.weatherRisk * 100).toFixed(1)}%`,
      className: sensorStatus(1 - state.sensors.weatherRisk, 0.84, 0.65),
    },
    {
      name: "Concrete Cure Variance",
      value: `${(state.sensors.concreteCureVariance * 100).toFixed(2)}%`,
      className: sensorStatus(1 - state.sensors.concreteCureVariance, 0.9, 0.8),
    },
    {
      name: "Safety Incidents (rolling)",
      value: `${(state.sensors.safetyIncidents * 100).toFixed(2)}%`,
      className: sensorStatus(1 - state.sensors.safetyIncidents * 5, 0.88, 0.75),
    },
  ];

  el.sensorGrid.innerHTML = sensors
    .map(
      (sensor) => `<article class="sensor"><div class="sensor-head"><strong>${sensor.name}</strong><span class="${sensor.className}">${sensor.className.toUpperCase()}</span></div><div class="sensor-value">${sensor.value}</div></article>`
    )
    .join("");
}

function logAdaptiveActions(sim, productivityLift) {
  const recommendations = [];

  if (state.sensors.weatherRisk > 0.24) {
    recommendations.push("Weather risk increased: shift 18% of exterior tasks to prefabrication and enclosed work zones.");
  }
  if (state.sensors.laborAvailability < 0.8) {
    recommendations.push("Labor shortage detected: activate modular workflow and autonomous layout robots for night shift.");
  }
  if (state.sensors.concreteCureVariance > 0.09) {
    recommendations.push("Concrete variance high: modify curing schedule and enable thermal blanket protocol.");
  }
  if (sim.reworkProbability > 0.18) {
    recommendations.push("Rework probability elevated: increase digital QA checkpoints from every 2 days to daily.");
  }

  recommendations.push(
    `Current selected method is projected to deliver ${productivityLift.toFixed(
      1
    )}% productivity lift with ${sim.expectedDelay.toFixed(2)} month potential delay.`
  );

  el.actionLog.innerHTML = recommendations
    .slice(0, 5)
    .map((item) => `<li>${item}</li>`)
    .join("");
}

function updateSensorFeed() {
  if (state.sensorsPaused) return;
  state.sensors.weatherRisk = clamp(state.sensors.weatherRisk + (Math.random() - 0.52) * 0.018, 0.06, 0.34);
  state.sensors.concreteCureVariance = clamp(
    state.sensors.concreteCureVariance + (Math.random() - 0.49) * 0.012,
    0.03,
    0.16
  );
  state.sensors.laborAvailability = clamp(state.sensors.laborAvailability + (Math.random() - 0.49) * 0.035, 0.62, 0.98);
  state.sensors.equipmentHealth = clamp(state.sensors.equipmentHealth + (Math.random() - 0.52) * 0.026, 0.72, 0.99);
  state.sensors.productivityIndex = clamp(
    state.sensors.productivityIndex + (Math.random() - 0.5) * 0.05,
    0.76,
    1.24
  );
  state.sensors.safetyIncidents = clamp(state.sensors.safetyIncidents + (Math.random() - 0.51) * 0.004, 0, 0.04);

  renderSensors();
  renderSimulation();
}

function runGenerationFromForm() {
  const projectType = document.getElementById("projectType").value;
  const budget = Number(document.getElementById("budget").value);
  const deadline = Number(document.getElementById("deadline").value);
  const sustainability = Number(el.sustainability.value);
  const safety = Number(el.safety.value);

  state.options = generateDesignOptions({ projectType, budget, deadline, sustainability, safety });
  renderOptions();
}

el.form.addEventListener("submit", (e) => {
  e.preventDefault();
  runGenerationFromForm();
});

el.recalibrateBtn.addEventListener("click", () => {
  if (!state.activeOption) return;
  state.options = state.options.map((option) => ({
    ...option,
    scheduleScore: clamp(option.scheduleScore + (state.sensors.productivityIndex - 1) * 10 - state.sensors.weatherRisk * 8, 40, 99),
    costConfidence: clamp(option.costConfidence + state.sensors.equipmentHealth * 3 - state.sensors.concreteCureVariance * 17, 38, 99),
    safetyResilience: clamp(option.safetyResilience + (1 - state.sensors.safetyIncidents * 5) * 4, 36, 99),
  }));

  state.options = state.options.map((option) => ({
    ...option,
    totalScore:
      option.scheduleScore * 0.31 +
      option.costConfidence * 0.23 +
      option.safetyResilience * 0.22 +
      option.sustainabilityFit * 0.16 +
      option.innovation * 0.08,
  }));

  renderOptions();
  el.status.textContent = "Recalibrated from Live Site";
  setTimeout(() => {
    el.status.textContent = "System Live";
  }, 1800);
});

el.toggleSensors.addEventListener("click", () => {
  state.sensorsPaused = !state.sensorsPaused;
  el.toggleSensors.textContent = state.sensorsPaused ? "Resume Feed" : "Pause Feed";
});

el.sustainability.addEventListener("input", () => {
  el.sustainabilityValue.textContent = `${el.sustainability.value}%`;
});
el.safety.addEventListener("input", () => {
  el.safetyValue.textContent = `${el.safety.value}%`;
});

renderIntegrations();
runGenerationFromForm();
renderSensors();
setInterval(updateSensorFeed, 2200);
