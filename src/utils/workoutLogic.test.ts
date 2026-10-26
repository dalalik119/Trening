import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STARTER_PLAN_TEMPLATES,
  calculateSessionMetrics,
  cloneDayToAnotherDay,
  createActiveSessionFromDay,
  createCleanUserData,
  createInitialSeedData,
  finalizeSessionToRecord,
  serializePlanToExport,
  validateAndParsePlanImport,
  validateExerciseInput,
  validateSetInput,
} from './workoutLogic';

test('createCleanUserData initializes profile with zero plans and zero workout history', () => {
  const clean = createCleanUserData('Дмитрий', 4);
  assert.equal(clean.settings.userName, 'Дмитрий');
  assert.equal(clean.settings.weeklyGoalWorkouts, 4);
  assert.equal(clean.plans.length, 0);
  assert.equal(clean.history.length, 0);
});

test('STARTER_PLAN_TEMPLATES build valid configurable plans for any user', () => {
  for (const tpl of STARTER_PLAN_TEMPLATES) {
    const plan = tpl.buildPlan('Дмитрий');
    assert.equal(plan.authorName, 'Дмитрий');
    assert.ok(plan.days.length > 0);
    assert.ok(plan.days[0].exercises.length > 0);
  }
});

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
  assert.equal(session.exercises[0].sets[0].plannedReps, 8);
  assert.equal(session.exercises[0].sets[0].plannedWeightKg, 60);

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
