import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateSessionMetrics,
  cloneDayToAnotherDay,
  createActiveSessionFromDay,
  createInitialSeedData,
  finalizeSessionToRecord,
  serializePlanToExport,
  validateAndParsePlanImport,
  validateExerciseInput,
  validateSetInput,
} from './workoutLogic';

test('validateExerciseInput rejects invalid sets, negative weights, and empty names', () => {
  assert.equal(
    validateExerciseInput({
      name: '   ',
      sets: 3,
      reps: 10,
      targetWeightKg: 50,
      restSeconds: 90,
      isBodyweight: false,
    }).valid,
    false
  );

  assert.equal(
    validateExerciseInput({
      name: 'Жим лёжа',
      sets: 0,
      reps: 10,
      targetWeightKg: 50,
      restSeconds: 90,
      isBodyweight: false,
    }).valid,
    false
  );

  assert.equal(
    validateExerciseInput({
      name: 'Жим лёжа',
      sets: 4,
      reps: 10,
      targetWeightKg: -15,
      restSeconds: 90,
      isBodyweight: false,
    }).valid,
    false
  );

  assert.equal(
    validateExerciseInput({
      name: 'Подтягивания',
      sets: 4,
      reps: 12,
      targetWeightKg: null,
      restSeconds: 90,
      isBodyweight: true,
    }).valid,
    true
  );
});

test('validateSetInput enforces non-negative reps and weights', () => {
  assert.equal(validateSetInput(10, 80, false).valid, true);
  assert.equal(validateSetInput(12, null, true).valid, true);
  assert.equal(validateSetInput(-2, 80, false).valid, false);
  assert.equal(validateSetInput(10, -5, false).valid, false);
});

test('createActiveSessionFromDay and calculateSessionMetrics separate planned vs actual', () => {
  const { plans } = createInitialSeedData();
  const plan = plans[0];
  const day = plan.days[0];
  const session = createActiveSessionFromDay(plan, day, '2026-10-25T10:00:00.000Z');

  assert.equal(session.exercises.length, day.exercises.length);
  assert.equal(session.exercises[0].sets.length, 4);

  // User completes first 2 sets with different actual reps/weight than planned
  session.exercises[0].sets[0].completed = true;
  session.exercises[0].sets[0].actualReps = 10;
  session.exercises[0].sets[0].actualWeightKg = 80;

  session.exercises[0].sets[1].completed = true;
  session.exercises[0].sets[1].actualReps = 8;
  session.exercises[0].sets[1].actualWeightKg = 80;

  const metrics = calculateSessionMetrics(session.exercises);
  assert.equal(metrics.totalCompletedSets, 2);
  assert.equal(metrics.totalCompletedReps, 18);
  assert.equal(metrics.totalVolumeKg, 1440);
  // Planned values remain untouched
  assert.equal(session.exercises[0].sets[0].plannedReps, 8);
  assert.equal(session.exercises[0].sets[0].plannedWeightKg, 75);

  const record = finalizeSessionToRecord(session, 'Алексей', '2026-10-25T10:48:00.000Z');
  assert.equal(record.durationMinutes, 48);
  assert.equal(record.totalVolumeKg, 1440);
});

test('serializePlanToExport and validateAndParsePlanImport roundtrip and detect duplicates/corrupt files', () => {
  const { plans } = createInitialSeedData();
  const rawJson = serializePlanToExport(plans[0], 'Алексей');

  const parsed = validateAndParsePlanImport(rawJson, plans);
  assert.equal(parsed.valid, true);
  assert.equal(parsed.isDuplicateId, true);
  assert.equal(parsed.isDuplicateName, true);
  assert.equal(parsed.plan?.name, plans[0].name);

  const corruptResult = validateAndParsePlanImport('{ bad json', plans);
  assert.equal(corruptResult.valid, false);

  const wrongVersion = validateAndParsePlanImport(
    JSON.stringify({ format: 'duofit-plan', version: 99, plan: {} }),
    plans
  );
  assert.equal(wrongVersion.valid, false);
});

test('cloneDayToAnotherDay copies exercises to target day of week', () => {
  const { plans } = createInitialSeedData();
  const plan = plans[0];
  const updated = cloneDayToAnotherDay(plan, plan.days[0].id, 'Сб');
  const satDay = updated.days.find((d) => d.dayOfWeek === 'Сб');
  assert.ok(satDay);
  assert.equal(satDay.exercises.length, plan.days[0].exercises.length);
});
