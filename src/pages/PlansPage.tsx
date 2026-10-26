import React, { useEffect, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  Edit3,
  FileJson,
  Play,
  Plus,
  Share2,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  DAYS_OF_WEEK,
  DayOfWeek,
  MuscleGroup,
  PlannedExercise,
  TrainingPlan,
  UserSettings,
  WorkoutDayPlan,
} from '../types';
import {
  EXERCISE_CATALOG,
  STARTER_PLAN_TEMPLATES,
  cloneDayToAnotherDay,
  formatPlanAsShareText,
  serializePlanToExport,
  validateAndParsePlanImport,
  validateExerciseInput,
} from '../utils/workoutLogic';

interface PlansPageProps {
  plans: TrainingPlan[];
  settings: UserSettings;
  onUpdatePlans: (nextPlans: TrainingPlan[]) => void;
  onStartWorkout: (plan: TrainingPlan, day: WorkoutDayPlan) => void;
}

const MUSCLE_GROUPS: MuscleGroup[] = [
  'Грудь',
  'Спина',
  'Ноги',
  'Плечи',
  'Руки',
  'Пресс',
  'Всё тело',
];

export const PlansPage: React.FC<PlansPageProps> = ({
  plans,
  settings,
  onUpdatePlans,
  onStartWorkout,
}) => {
  const [selectedPlanId, setSelectedPlanId] = useState<string>(
    () => plans.find((p) => p.isActive)?.id ?? plans[0]?.id ?? ''
  );

  useEffect(() => {
    if (!plans.some((p) => p.id === selectedPlanId)) {
      setSelectedPlanId(plans.find((p) => p.isActive)?.id ?? plans[0]?.id ?? '');
    }
  }, [plans, selectedPlanId]);

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) ?? plans[0] ?? null;

  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<DayOfWeek>(
    () => selectedPlan?.days[0]?.dayOfWeek ?? 'Пн'
  );

  // Create new plan state
  const [showNewPlanModal, setShowNewPlanModal] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanDesc, setNewPlanDesc] = useState('');
  const [newPlanInitialDays, setNewPlanInitialDays] = useState<DayOfWeek[]>(['Пн', 'Ср', 'Пт']);
  const [planFormError, setPlanFormError] = useState<string | null>(null);

  // Day title/focus inline editor
  const [editingDayMeta, setEditingDayMeta] = useState(false);
  const [dayTitleDraft, setDayTitleDraft] = useState('');
  const [dayFocusDraft, setDayFocusDraft] = useState('');

  // Add / Edit exercise state
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);
  const [exName, setExName] = useState('');
  const [exMuscle, setExMuscle] = useState<MuscleGroup>('Грудь');
  const [exIsBodyweight, setExIsBodyweight] = useState(false);
  const [exSets, setExSets] = useState('4');
  const [exReps, setExReps] = useState('10');
  const [exWeight, setExWeight] = useState('60');
  const [exRest, setExRest] = useState('90');
  const [exError, setExError] = useState<string | null>(null);

  // Copy day state
  const [copyTargetDay, setCopyTargetDay] = useState<DayOfWeek>('Сб');
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  // Confirm delete plan modal
  const [planToDelete, setPlanToDelete] = useState<TrainingPlan | null>(null);

  // Import JSON state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [pendingDuplicatePlan, setPendingDuplicatePlan] = useState<TrainingPlan | null>(null);

  const currentDayPlan =
    selectedPlan?.days.find((d) => d.dayOfWeek === selectedDayOfWeek) ?? null;

  const showNotice = (msg: string) => {
    setStatusBanner(msg);
    setTimeout(() => setStatusBanner(null), 4000);
  };

  const toggleInitialDay = (day: DayOfWeek) => {
    setNewPlanInitialDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSetActivePlan = (planId: string) => {
    const next = plans.map((p) => ({
      ...p,
      isActive: p.id === planId,
    }));
    onUpdatePlans(next);
    setSelectedPlanId(planId);
    showNotice('Активный план обновлён');
  };

  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newPlanName.trim();
    if (!trimmed) {
      setPlanFormError('Введите название тренировочного плана');
      return;
    }

    const daysToCreate: WorkoutDayPlan[] =
      newPlanInitialDays.length > 0
        ? DAYS_OF_WEEK.filter((d) => newPlanInitialDays.includes(d)).map((d, i) => ({
            id: `day-${Date.now()}-${i}`,
            dayOfWeek: d,
            title: `Тренировка ${d}`,
            focus: 'Силовая тренировка',
            estimatedMinutes: 45,
            exercises: [],
          }))
        : [];

    const created: TrainingPlan = {
      id: `plan-${Date.now()}`,
      name: trimmed,
      description: newPlanDesc.trim() || 'Персональная программа тренировок DuoFit',
      authorName: settings.userName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
      days: daysToCreate,
    };

    const next = plans.map((p) => ({ ...p, isActive: false })).concat(created);
    onUpdatePlans(next);
    setSelectedPlanId(created.id);
    setSelectedDayOfWeek(daysToCreate[0]?.dayOfWeek ?? 'Пн');
    setNewPlanName('');
    setNewPlanDesc('');
    setPlanFormError(null);
    setShowNewPlanModal(false);
    showNotice(`Чистый план «${created.name}» создан. Добавьте упражнения в дни недели.`);
  };

  const handleApplyStarterTemplate = (templateId: string) => {
    const tpl = STARTER_PLAN_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;
    const created = tpl.buildPlan(settings.userName);
    const next = plans.map((p) => ({ ...p, isActive: false })).concat(created);
    onUpdatePlans(next);
    setSelectedPlanId(created.id);
    setSelectedDayOfWeek(created.days[0]?.dayOfWeek ?? 'Пн');
    showNotice(`Шаблон «${created.name}» добавлен и готов к настройке`);
  };

  const handleConfirmDeletePlan = () => {
    if (!planToDelete) return;
    const remaining = plans.filter((p) => p.id !== planToDelete.id);
    if (remaining.length > 0 && !remaining.some((p) => p.isActive)) {
      remaining[0].isActive = true;
    }
    onUpdatePlans(remaining);
    setSelectedPlanId(remaining[0]?.id ?? '');
    setPlanToDelete(null);
    showNotice('План удалён');
  };

  const handleSaveDayMeta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan || !currentDayPlan) return;
    const updatedDays = selectedPlan.days.map((d) =>
      d.id === currentDayPlan.id
        ? {
            ...d,
            title: dayTitleDraft.trim() || `Тренировка ${d.dayOfWeek}`,
            focus: dayFocusDraft.trim() || 'Силовая',
          }
        : d
    );
    const updatedPlan: TrainingPlan = {
      ...selectedPlan,
      updatedAt: new Date().toISOString(),
      days: updatedDays,
    };
    onUpdatePlans(plans.map((p) => (p.id === selectedPlan.id ? updatedPlan : p)));
    setEditingDayMeta(false);
    showNotice('Название и фокус тренировочного дня сохранены');
  };

  const handleSelectCatalogPreset = (catalogId: string) => {
    const preset = EXERCISE_CATALOG.find((c) => c.id === catalogId);
    if (!preset) return;
    setExName(preset.name);
    setExMuscle(preset.muscleGroup);
    setExIsBodyweight(preset.isBodyweight);
    setExSets(String(preset.defaultSets));
    setExReps(String(preset.defaultReps));
    setExWeight(preset.defaultWeightKg !== null ? String(preset.defaultWeightKg) : '');
    setExRest(String(preset.defaultRestSec));
    setExError(null);
  };

  const handleStartEditExercise = (ex: PlannedExercise) => {
    setEditingExerciseId(ex.id);
    setExName(ex.name);
    setExMuscle(ex.muscleGroup);
    setExIsBodyweight(ex.isBodyweight);
    setExSets(String(ex.sets));
    setExReps(String(ex.reps));
    setExWeight(ex.targetWeightKg !== null ? String(ex.targetWeightKg) : '');
    setExRest(String(ex.restSeconds));
    setExError(null);
  };

  const handleAddOrUpdateExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;

    const setsNum = Number(exSets);
    const repsNum = Number(exReps);
    const restNum = Number(exRest);
    const weightNum = exIsBodyweight && exWeight.trim() === '' ? null : Number(exWeight);

    const validation = validateExerciseInput({
      name: exName,
      sets: setsNum,
      reps: repsNum,
      targetWeightKg: weightNum,
      restSeconds: restNum,
      isBodyweight: exIsBodyweight,
    });

    if (!validation.valid) {
      setExError(validation.error ?? 'Проверьте корректность полей');
      return;
    }

    const exerciseItem: PlannedExercise = {
      id: editingExerciseId ?? `ex-${Date.now()}`,
      name: exName.trim(),
      muscleGroup: exMuscle,
      isBodyweight: exIsBodyweight,
      sets: setsNum,
      reps: repsNum,
      targetWeightKg: weightNum,
      restSeconds: restNum,
    };

    const existingDay = selectedPlan.days.find((d) => d.dayOfWeek === selectedDayOfWeek);
    let updatedDays: WorkoutDayPlan[];

    if (existingDay) {
      updatedDays = selectedPlan.days.map((d) => {
        if (d.dayOfWeek !== selectedDayOfWeek) return d;
        const nextExercises = editingExerciseId
          ? d.exercises.map((item) => (item.id === editingExerciseId ? exerciseItem : item))
          : [...d.exercises, exerciseItem];
        return {
          ...d,
          exercises: nextExercises,
          estimatedMinutes: Math.max(20, nextExercises.length * 12),
        };
      });
    } else {
      updatedDays = [
        ...selectedPlan.days,
        {
          id: `day-${Date.now()}`,
          dayOfWeek: selectedDayOfWeek,
          title: `Тренировка ${selectedDayOfWeek}`,
          focus: exMuscle,
          estimatedMinutes: 35,
          exercises: [exerciseItem],
        },
      ];
    }

    const updatedPlan: TrainingPlan = {
      ...selectedPlan,
      updatedAt: new Date().toISOString(),
      days: updatedDays,
    };

    onUpdatePlans(plans.map((p) => (p.id === selectedPlan.id ? updatedPlan : p)));
    setEditingExerciseId(null);
    setExName('');
    setExError(null);
    showNotice(
      editingExerciseId
        ? `Упражнение «${exerciseItem.name}» обновлено`
        : `Упражнение «${exerciseItem.name}» добавлено в ${selectedDayOfWeek}`
    );
  };

  const handleRemoveExercise = (exerciseId: string) => {
    if (!selectedPlan || !currentDayPlan) return;
    const updatedDays = selectedPlan.days.map((d) =>
      d.id === currentDayPlan.id
        ? { ...d, exercises: d.exercises.filter((ex) => ex.id !== exerciseId) }
        : d
    );

    const updatedPlan: TrainingPlan = {
      ...selectedPlan,
      updatedAt: new Date().toISOString(),
      days: updatedDays,
    };
    onUpdatePlans(plans.map((p) => (p.id === selectedPlan.id ? updatedPlan : p)));
    if (editingExerciseId === exerciseId) {
      setEditingExerciseId(null);
      setExName('');
    }
  };

  const handleCloneCurrentDay = () => {
    if (!selectedPlan || !currentDayPlan) return;
    const updated = cloneDayToAnotherDay(selectedPlan, currentDayPlan.id, copyTargetDay);
    onUpdatePlans(plans.map((p) => (p.id === selectedPlan.id ? updated : p)));
    setSelectedDayOfWeek(copyTargetDay);
    showNotice(`День ${currentDayPlan.dayOfWeek} скопирован на ${copyTargetDay}`);
  };

  const handleExportPlanJson = () => {
    if (!selectedPlan) return;
    const json = serializePlanToExport(selectedPlan, settings.userName);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `duofit-plan-${selectedPlan.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotice('JSON-файл плана скачан для отправки другу');
  };

  const handleSharePlan = async () => {
    if (!selectedPlan) return;
    const shareText = formatPlanAsShareText(selectedPlan);
    if (navigator.share) {
      try {
        await navigator.share({
          title: `DuoFit: ${selectedPlan.name}`,
          text: shareText,
        });
        showNotice('План отправлен через меню Поделиться');
        return;
      } catch {
        // fallback below
      }
    }
    try {
      await navigator.clipboard.writeText(shareText);
      showNotice('Текстовое описание плана скопировано в буфер обмена');
    } catch {
      showNotice('Используйте экспорт JSON для отправки файла');
    }
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = validateAndParsePlanImport(importJsonText, plans);
    if (!res.valid || !res.plan) {
      setImportError(res.error ?? 'Ошибка проверки файла');
      return;
    }

    if (res.isDuplicateId || res.isDuplicateName) {
      setPendingDuplicatePlan(res.plan);
      return;
    }

    finalizePlanImport(res.plan, false);
  };

  const finalizePlanImport = (planToSave: TrainingPlan, replaceExisting: boolean) => {
    let nextPlans: TrainingPlan[];
    if (replaceExisting) {
      nextPlans = plans.map((p) =>
        p.id === planToSave.id || p.name.toLowerCase() === planToSave.name.toLowerCase()
          ? { ...planToSave, isActive: p.isActive }
          : p
      );
    } else {
      const uniquePlan: TrainingPlan = {
        ...planToSave,
        id: `plan-imp-${Date.now()}`,
        isActive: plans.length === 0,
        name: plans.some((p) => p.name.toLowerCase() === planToSave.name.toLowerCase())
          ? `${planToSave.name} (от друга)`
          : planToSave.name,
      };
      nextPlans = [...plans, uniquePlan];
      setSelectedPlanId(uniquePlan.id);
    }

    onUpdatePlans(nextPlans);
    setPendingDuplicatePlan(null);
    setImportJsonText('');
    setImportError(null);
    setShowImportModal(false);
    showNotice('План успешно импортирован');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImportJsonText(reader.result);
        setImportError(null);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Header & Top Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Конструктор тренировочных программ · Полная настройка под себя
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-0.5">
            Планы тренировок
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setImportError(null);
              setPendingDuplicatePlan(null);
              setShowImportModal(true);
            }}
            className="inline-flex items-center gap-2 min-h-[42px] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:border-emerald-500/50 transition-colors whitespace-nowrap"
          >
            <Upload className="w-4 h-4 text-emerald-500" />
            <span>Импорт JSON</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setPlanFormError(null);
              setShowNewPlanModal(true);
            }}
            className="inline-flex items-center gap-2 min-h-[42px] px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400 transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Создать новый план</span>
          </button>
        </div>
      </div>

      {statusBanner && (
        <div
          role="status"
          className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs font-semibold text-emerald-700 dark:text-emerald-300"
        >
          {statusBanner}
        </div>
      )}

      {plans.length === 0 ? (
        /* Empty State when 0 plans exist */
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 space-y-6">
          <div className="max-w-xl space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <Sparkles className="w-4 h-4" />
              <span>У вас пока нет ни одного плана</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Создайте пустой план с нуля или начните с готового шаблона
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Вы можете собрать собственную программу тренировок по дням недели или загрузить базовый шаблон и изменить в нём любые упражнения, подходы и веса.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {STARTER_PLAN_TEMPLATES.map((tpl) => (
              <div
                key={tpl.id}
                className="rounded-xl bg-slate-100/80 dark:bg-slate-800/50 p-5 flex flex-col justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="text-xs font-mono-tabular text-emerald-600 dark:text-emerald-400">
                    Шаблон · {tpl.daysCount} дн. в неделю
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {tpl.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {tpl.subtitle}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleApplyStarterTemplate(tpl.id)}
                  className="w-full min-h-[42px] rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400 transition-colors"
                >
                  Использовать шаблон
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Plans selector list */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plans.map((plan) => {
              const isSelected = selectedPlan?.id === plan.id;
              return (
                <div
                  key={plan.id}
                  onClick={() => {
                    setSelectedPlanId(plan.id);
                    if (plan.days[0]) {
                      setSelectedDayOfWeek(plan.days[0].dayOfWeek);
                    }
                  }}
                  className={`cursor-pointer rounded-2xl border p-5 transition-colors ${
                    isSelected
                      ? 'border-emerald-500 bg-white dark:bg-slate-900'
                      : 'border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Автор: {plan.authorName} · {plan.days.length} дн. в неделю
                        {plan.isActive ? ' · Основной план' : ''}
                      </div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        {plan.name}
                      </h2>
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                        {plan.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {!plan.isActive && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetActivePlan(plan.id);
                          }}
                          className="min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-emerald-500 whitespace-nowrap"
                        >
                          Сделать основным
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPlanToDelete(plan);
                        }}
                        aria-label={`Удалить план ${plan.name}`}
                        className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Plan Detail & Editor */}
          {selectedPlan && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left 7 Cols: Days of Week & Exercises */}
              <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      Расписание: {selectedPlan.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Выберите день недели для просмотра, редактирования или добавления упражнений
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSharePlan}
                      className="inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-emerald-500/50 whitespace-nowrap"
                    >
                      <Share2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Текст другу</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleExportPlanJson}
                      className="inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-emerald-500/50 whitespace-nowrap"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Экспорт JSON</span>
                    </button>
                  </div>
                </div>

                {/* Day tabs */}
                <div className="grid grid-cols-7 gap-1.5">
                  {DAYS_OF_WEEK.map((day) => {
                    const dayObj = selectedPlan.days.find((d) => d.dayOfWeek === day);
                    const isSelected = selectedDayOfWeek === day;
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => {
                          setSelectedDayOfWeek(day);
                          setEditingDayMeta(false);
                        }}
                        className={`min-h-[48px] rounded-xl flex flex-col items-center justify-center py-1.5 transition-colors ${
                          isSelected
                            ? 'bg-emerald-500 text-slate-950 font-bold'
                            : dayObj
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium'
                            : 'text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <span className="text-xs">{day}</span>
                        <span className="text-[10px] font-mono-tabular">
                          {dayObj ? `${dayObj.exercises.length} упр.` : '—'}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {currentDayPlan ? (
                  <div className="space-y-4">
                    <div className="bg-slate-100/80 dark:bg-slate-800/40 p-4 rounded-xl space-y-3">
                      {editingDayMeta ? (
                        <form onSubmit={handleSaveDayMeta} className="space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <input
                              type="text"
                              value={dayTitleDraft}
                              onChange={(e) => setDayTitleDraft(e.target.value)}
                              placeholder="Название дня (например: Верх тела)"
                              className="min-h-[38px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs"
                            />
                            <input
                              type="text"
                              value={dayFocusDraft}
                              onChange={(e) => setDayFocusDraft(e.target.value)}
                              placeholder="Фокус (например: Грудь и плечи)"
                              className="min-h-[38px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="submit"
                              className="min-h-[36px] px-3.5 rounded-lg bg-emerald-500 text-slate-950 text-xs font-bold"
                            >
                              Сохранить
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingDayMeta(false)}
                              className="min-h-[36px] px-3 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold"
                            >
                              Отмена
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              День {currentDayPlan.dayOfWeek} · {currentDayPlan.focus} · ~
                              {currentDayPlan.estimatedMinutes} мин
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-base font-bold text-slate-900 dark:text-white">
                                {currentDayPlan.title}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setDayTitleDraft(currentDayPlan.title);
                                  setDayFocusDraft(currentDayPlan.focus);
                                  setEditingDayMeta(true);
                                }}
                                aria-label="Изменить название тренировочного дня"
                                className="p-1 text-slate-400 hover:text-emerald-500"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <select
                              aria-label="День для копирования"
                              value={copyTargetDay}
                              onChange={(e) => setCopyTargetDay(e.target.value as DayOfWeek)}
                              className="min-h-[38px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 text-xs text-slate-800 dark:text-slate-200"
                            >
                              {DAYS_OF_WEEK.filter((d) => d !== currentDayPlan.dayOfWeek).map(
                                (d) => (
                                  <option key={d} value={d}>
                                    На {d}
                                  </option>
                                )
                              )}
                            </select>
                            <button
                              type="button"
                              onClick={handleCloneCurrentDay}
                              className="inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-emerald-500 whitespace-nowrap"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>Копировать</span>
                            </button>
                            {currentDayPlan.exercises.length > 0 && (
                              <button
                                type="button"
                                onClick={() => onStartWorkout(selectedPlan, currentDayPlan)}
                                className="inline-flex items-center gap-1.5 min-h-[38px] px-3.5 py-1.5 rounded-lg bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400 whitespace-nowrap"
                              >
                                <Play className="w-3.5 h-3.5 fill-current" />
                                <span>Старт</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {currentDayPlan.exercises.length > 0 ? (
                      <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {currentDayPlan.exercises.map((ex, index) => (
                          <div
                            key={ex.id}
                            className="py-3.5 flex items-center justify-between gap-4"
                          >
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                {index + 1}. {ex.name}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400 font-mono-tabular">
                                {ex.muscleGroup} · {ex.sets} подх. × {ex.reps} повт. ·{' '}
                                {ex.isBodyweight
                                  ? ex.targetWeightKg
                                    ? `Свой вес +${ex.targetWeightKg} ${settings.unit}`
                                    : 'Свой вес'
                                  : `${ex.targetWeightKg ?? 0} ${settings.unit}`}{' '}
                                · Отдых {ex.restSeconds}с
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleStartEditExercise(ex)}
                                aria-label={`Редактировать упражнение ${ex.name}`}
                                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveExercise(ex.id)}
                                aria-label={`Удалить упражнение ${ex.name}`}
                                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center space-y-1.5">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                          В дне {selectedDayOfWeek} пока нет упражнений
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Воспользуйтесь формой справа, чтобы добавить упражнения из каталога или вписать свои.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-10 text-center space-y-2">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      На {selectedDayOfWeek} пока не назначено упражнений
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Добавьте первое упражнение через форму справа, чтобы сделать{' '}
                      {selectedDayOfWeek} тренировочным днём.
                    </p>
                  </div>
                )}
              </div>

              {/* Right 5 Cols: Add / Edit Exercise Form */}
              <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {editingExerciseId
                        ? `Редактирование упражнения (${selectedDayOfWeek})`
                        : `Добавить упражнение на ${selectedDayOfWeek}`}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Выберите из каталога или настройте свои параметры
                    </p>
                  </div>
                  {editingExerciseId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingExerciseId(null);
                        setExName('');
                      }}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    >
                      Отмена
                    </button>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="catalog-preset"
                    className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"
                  >
                    Быстрый выбор из каталога ({EXERCISE_CATALOG.length} упр.)
                  </label>
                  <select
                    id="catalog-preset"
                    value=""
                    onChange={(e) => handleSelectCatalogPreset(e.target.value)}
                    className="w-full min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 px-3 text-sm text-slate-900 dark:text-slate-100"
                  >
                    <option value="" disabled>
                      — Выбрать упражнение из базы —
                    </option>
                    {EXERCISE_CATALOG.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name} ({cat.muscleGroup})
                      </option>
                    ))}
                  </select>
                </div>

                <form onSubmit={handleAddOrUpdateExercise} className="space-y-4">
                  <div>
                    <label
                      htmlFor="ex-name-input"
                      className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                    >
                      Название упражнения
                    </label>
                    <input
                      id="ex-name-input"
                      type="text"
                      value={exName}
                      onChange={(e) => setExName(e.target.value)}
                      placeholder="Например: Жим гантелей сидя"
                      className="w-full min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 text-sm text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="ex-muscle-select"
                        className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                      >
                        Мышечная группа
                      </label>
                      <select
                        id="ex-muscle-select"
                        value={exMuscle}
                        onChange={(e) => setExMuscle(e.target.value as MuscleGroup)}
                        className="w-full min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 text-sm text-slate-900 dark:text-slate-100"
                      >
                        {MUSCLE_GROUPS.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-end">
                      <label className="flex items-center gap-2.5 min-h-[42px] cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                        <input
                          type="checkbox"
                          checked={exIsBodyweight}
                          onChange={(e) => setExIsBodyweight(e.target.checked)}
                          className="w-4 h-4 rounded accent-emerald-500"
                        />
                        <span>С собственным весом</span>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label
                        htmlFor="ex-sets-input"
                        className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                      >
                        Подходы
                      </label>
                      <input
                        id="ex-sets-input"
                        type="number"
                        value={exSets}
                        onChange={(e) => setExSets(e.target.value)}
                        className="w-full min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 text-sm font-mono-tabular text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="ex-reps-input"
                        className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                      >
                        Повторы
                      </label>
                      <input
                        id="ex-reps-input"
                        type="number"
                        value={exReps}
                        onChange={(e) => setExReps(e.target.value)}
                        className="w-full min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 text-sm font-mono-tabular text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="ex-weight-input"
                        className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                      >
                        Вес ({settings.unit})
                      </label>
                      <input
                        id="ex-weight-input"
                        type="number"
                        step="0.5"
                        value={exWeight}
                        placeholder={exIsBodyweight ? 'Опц.' : '60'}
                        onChange={(e) => setExWeight(e.target.value)}
                        className="w-full min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 text-sm font-mono-tabular text-slate-900 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="ex-rest-input"
                        className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                      >
                        Отдых (с)
                      </label>
                      <input
                        id="ex-rest-input"
                        type="number"
                        step="5"
                        value={exRest}
                        onChange={(e) => setExRest(e.target.value)}
                        className="w-full min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 text-sm font-mono-tabular text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  {exError && (
                    <p role="alert" className="text-xs font-semibold text-rose-500">
                      {exError}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="w-full min-h-[46px] inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-sm hover:bg-emerald-400 transition-colors"
                  >
                    {editingExerciseId ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Сохранить изменения</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Добавить в {selectedDayOfWeek}</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal: Create Plan */}
      {showNewPlanModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-plan-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <h3 id="create-plan-title" className="text-lg font-bold text-slate-900 dark:text-white">
              Новый план тренировок (с чистого листа)
            </h3>
            <form onSubmit={handleCreatePlan} className="space-y-4">
              <div>
                <label
                  htmlFor="new-plan-name"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Название плана
                </label>
                <input
                  id="new-plan-name"
                  type="text"
                  value={newPlanName}
                  onChange={(e) => setNewPlanName(e.target.value)}
                  placeholder="Например: Мой Сплит Грудь/Спина/Ноги"
                  className="w-full min-h-[42px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 text-sm"
                />
              </div>

              <div>
                <span className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Отметьте тренировочные дни недели
                </span>
                <div className="grid grid-cols-7 gap-1.5">
                  {DAYS_OF_WEEK.map((d) => {
                    const active = newPlanInitialDays.includes(d);
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleInitialDay(d)}
                        className={`min-h-[40px] rounded-xl text-xs font-semibold transition-colors ${
                          active
                            ? 'bg-emerald-500 text-slate-950 font-bold'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label
                  htmlFor="new-plan-desc"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Описание для вас и друга
                </label>
                <textarea
                  id="new-plan-desc"
                  rows={2}
                  value={newPlanDesc}
                  onChange={(e) => setNewPlanDesc(e.target.value)}
                  placeholder="Краткая цель программы и акценты"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-3 text-sm"
                />
              </div>
              {planFormError && (
                <p role="alert" className="text-xs font-semibold text-rose-500">
                  {planFormError}
                </p>
              )}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewPlanModal(false)}
                  className="min-h-[42px] px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="min-h-[42px] px-5 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400"
                >
                  Создать чистый план
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Plan Confirmation */}
      {planToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Удалить план «{planToDelete.name}»?
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Это действие удалит расписание плана, но история ваших завершённых тренировок сохранится.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setPlanToDelete(null)}
                className="min-h-[42px] px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleConfirmDeletePlan}
                className="min-h-[42px] px-4 rounded-xl bg-rose-500 text-white text-xs font-bold hover:bg-rose-600"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Import Plan JSON */}
      {showImportModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="import-plan-title"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center gap-2.5">
              <FileJson className="w-5 h-5 text-emerald-500" />
              <h3 id="import-plan-title" className="text-lg font-bold text-slate-900 dark:text-white">
                Импорт плана от друга (JSON)
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Загрузите JSON-файл плана (`duofit-plan` v1) или вставьте его содержимое ниже.
            </p>

            <div>
              <label className="inline-flex items-center gap-2 min-h-[40px] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 cursor-pointer text-xs font-semibold">
                <Upload className="w-4 h-4 text-emerald-500" />
                <span>Выбрать JSON-файл с устройства</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <form onSubmit={handleImportSubmit} className="space-y-4">
              <textarea
                rows={6}
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                placeholder='{"format": "duofit-plan", "version": 1, "plan": { ... }}'
                aria-label="JSON код плана для импорта"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 text-xs font-mono-tabular"
              />

              {importError && (
                <p role="alert" className="text-xs font-semibold text-rose-500">
                  {importError}
                </p>
              )}

              {pendingDuplicatePlan ? (
                <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 space-y-3">
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                    План с названием «{pendingDuplicatePlan.name}» уже есть в вашем списке. Как поступить?
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => finalizePlanImport(pendingDuplicatePlan, false)}
                      className="min-h-[38px] px-3.5 rounded-lg bg-emerald-500 text-slate-950 text-xs font-bold"
                    >
                      Сохранить как копию
                    </button>
                    <button
                      type="button"
                      onClick={() => finalizePlanImport(pendingDuplicatePlan, true)}
                      className="min-h-[38px] px-3.5 rounded-lg border border-amber-500 text-amber-700 dark:text-amber-300 text-xs font-semibold"
                    >
                      Заменить существующий
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowImportModal(false)}
                    className="min-h-[42px] px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="min-h-[42px] px-5 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400 inline-flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Проверить и импортировать</span>
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
