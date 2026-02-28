(function factory(root) {
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

  function clamp(value, min, max) {
    return Math.max(min, Math.min(value, max));
  }

  function scoreOption(option, inputs) {
    const schedule = clamp(option.scheduleScore, 0, 100);
    const cost = clamp(option.costConfidence, 0, 100);
    const safety = clamp(option.safetyScore, 0, 100);
    const sustainability = clamp(option.sustainabilityScore, 0, 100);
    const constructability = clamp(option.constructability, 0, 100);

    return clamp(
      schedule * 0.29 +
        cost * 0.23 +
        safety * (0.14 + inputs.safety / 1000) +
        sustainability * (0.11 + inputs.sustainability / 1200) +
        constructability * 0.23,
      0,
      100
    );
  }

  function generateOptions(inputs, rng = Math.random, now = Date.now()) {
    const catalog = strategyLibrary[inputs.projectType] || strategyLibrary.highrise;
    const deadlinePressure = clamp((36 - inputs.deadline) / 28, 0.02, 1.35);
    const budgetStrength = clamp(inputs.budget / 220, 0.5, 2.2);
    const scalePenalty = clamp(inputs.area / 330, 0, 1.8);

    return catalog.map((name, index) => {
      const baseline = 76 - index * 3;
      const scheduleScore = clamp(
        baseline + (1 - deadlinePressure) * 10 - scalePenalty * 6 + rng() * 6,
        45,
        98
      );
      const costConfidence = clamp(
        baseline + budgetStrength * 8 - scalePenalty * 4 + rng() * 5,
        44,
        98
      );
      const safetyScore = clamp(inputs.safety * 0.78 + (2 - index) * 3 + rng() * 9, 50, 99);
      const sustainabilityScore = clamp(inputs.sustainability * 0.8 + index * 2 + rng() * 12, 42, 99);
      const constructability = clamp(72 + (2 - index) * 5 + rng() * 8 - scalePenalty * 5, 40, 98);

      const option = {
        id: `${name}-${index}-${now}`,
        name,
        scheduleScore,
        costConfidence,
        safetyScore,
        sustainabilityScore,
        constructability,
        prefabRatio: Math.round(clamp(24 + index * 14 + rng() * 18, 20, 78)),
        crewSize: Math.round(clamp(95 + inputs.area * 1.35 + index * 18 - deadlinePressure * 25, 80, 520)),
        dailyOutput: Math.round(clamp(210 + inputs.area * 3.8 + index * 18 + rng() * 55, 120, 2900)),
      };
      option.totalScore = scoreOption(option, inputs);
      return option;
    });
  }

  function runSimulation(option, inputs, sensors, iterations = 500, rng = Math.random) {
    let delaySum = 0;
    let costSum = 0;
    let reworkSum = 0;

    for (let i = 0; i < iterations; i += 1) {
      const weather = sensors.weatherRisk * (0.5 + rng());
      const labor = (1 - sensors.laborAvailability) * (0.35 + rng());
      const equipment = (1 - sensors.equipmentHealth) * (0.25 + rng());
      const logistics = sensors.logisticsDelay * (0.4 + rng());
      const quality = sensors.concreteVariance * (0.6 + rng());

      delaySum += clamp(
        0.8 + weather * 5.8 + labor * 6.6 + logistics * 4.8 + equipment * 3.4 - option.scheduleScore / 45,
        0,
        12
      );
      costSum += clamp(
        weather * 4.2 + labor * 6.3 + logistics * 6.9 + quality * 6.1 - option.costConfidence / 28,
        -2,
        22
      );
      reworkSum += clamp(
        quality * 0.36 + (1 - option.safetyScore / 100) * 0.14 + sensors.safetyIncidents * 2.2,
        0.01,
        0.6
      );
    }

    const expectedDelay = delaySum / iterations;
    const expectedCostOverrun = costSum / iterations;
    const reworkProbability = reworkSum / iterations;

    const monthlySeries = [];
    for (let month = 1; month <= 12; month += 1) {
      const monthDelayTrend = expectedDelay * (month / 12) * (0.85 + rng() * 0.3);
      const monthCostTrend = expectedCostOverrun * (month / 12) * (0.88 + rng() * 0.25);
      monthlySeries.push({
        month,
        duration: clamp(inputs.deadline * (month / 12) + monthDelayTrend, 0, inputs.deadline * 1.2),
        cost: clamp(inputs.budget * (month / 12) * (1 + monthCostTrend / 100), 0, inputs.budget * 1.5),
      });
    }

    return {
      expectedDelay,
      expectedCostOverrun,
      reworkProbability,
      productivityLift: clamp(option.totalScore / 8 + sensors.productivityIndex * 12 - expectedDelay * 2.6, 3, 42),
      scheduleReliability: clamp(100 - expectedDelay * 4.2, 58, 99),
      monthlySeries,
    };
  }

  const api = { strategyLibrary, clamp, scoreOption, generateOptions, runSimulation };
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  root.CreaTechEngine = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
