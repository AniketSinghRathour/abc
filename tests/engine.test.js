const assert = require('assert');
const Engine = require('../engine.js');

function fixedRngFactory(values) {
  let i = 0;
  return () => {
    const v = values[i % values.length];
    i += 1;
    return v;
  };
}

(function testGenerateOptions() {
  const rng = fixedRngFactory([0.2, 0.4, 0.6, 0.8]);
  const options = Engine.generateOptions(
    { projectType: 'highrise', budget: 180, deadline: 30, area: 70, sustainability: 75, safety: 85 },
    rng,
    123
  );
  assert.strictEqual(options.length, 3);
  assert.ok(options[0].totalScore > 0 && options[0].totalScore <= 100);
  assert.ok(options.every((o) => o.id.includes('123')));
})();

(function testRunSimulation() {
  const rng = fixedRngFactory([0.3, 0.5, 0.7, 0.2, 0.9]);
  const option = {
    totalScore: 82,
    scheduleScore: 84,
    costConfidence: 80,
    safetyScore: 89,
  };
  const inputs = { budget: 200, deadline: 32 };
  const sensors = {
    weatherRisk: 0.18,
    laborAvailability: 0.9,
    equipmentHealth: 0.92,
    concreteVariance: 0.07,
    logisticsDelay: 0.1,
    safetyIncidents: 0.01,
    productivityIndex: 1.03,
  };

  const sim = Engine.runSimulation(option, inputs, sensors, 50, rng);
  assert.ok(sim.expectedDelay >= 0 && sim.expectedDelay <= 12);
  assert.ok(sim.expectedCostOverrun >= -2 && sim.expectedCostOverrun <= 22);
  assert.ok(sim.reworkProbability >= 0.01 && sim.reworkProbability <= 0.6);
  assert.strictEqual(sim.monthlySeries.length, 12);
})();

console.log('engine tests passed');
