import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { 
  StudyState, 
  StudyPhase, 
  TaskResult, 
  Condition,
  Task,
  CalibrationData
} from "@/types/study";
import { 
  generateParticipantId, 
  createConditions, 
  createTasks,
  predictKLMTime
} from "@/lib/study-utils";

interface StudyContextType {
  state: StudyState;
  debugMode: boolean;
  setDebugMode: (mode: boolean) => void;
  startStudy: () => void;
  nextPhase: () => void;
  recordTaskResult: (result: Omit<TaskResult, "participantId" | "conditionLabel" | "interfaceMode" | "roomCondition" | "timestamp" | "predictedTimeMs">) => void;
  getCurrentCondition: () => Condition | null;
  getCurrentTask: () => Task | null;
  resetStudy: () => void;
  setCalibrationData: (data: CalibrationData) => void;
}

const initialState: StudyState = {
  phase: "consent",
  participantId: "",
  conditions: [],
  currentConditionIndex: 0,
  tasks: [],
  currentTaskIndex: 0,
  results: [],
  participantData: {
    participantId: "",
    startTime: "",
    conditionOrder: [],
    completed: false,
  },
  calibrationData: undefined,
};

const StudyContext = createContext<StudyContextType | null>(null);

export function StudyProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<StudyState>(initialState);
  const [debugMode, setDebugMode] = useState(false);

  const applyInterfaceMode = useCallback((mode: "light" | "dark" | "neutral") => {
    document.documentElement.classList.remove("dark", "neutral");
    if (mode === "dark") {
      document.documentElement.classList.add("dark");
    } else if (mode === "neutral") {
      document.documentElement.classList.add("neutral");
    }
  }, []);

  const startStudy = useCallback(() => {
    const participantId = generateParticipantId();
    const conditions = createConditions();
    const tasks = createTasks();
    
    setState({
      phase: "instructions",
      participantId,
      conditions,
      currentConditionIndex: 0,
      tasks,
      currentTaskIndex: 0,
      results: [],
      participantData: {
        participantId,
        startTime: new Date().toISOString(),
        conditionOrder: conditions.map(c => c.label),
        completed: false,
      },
      calibrationData: undefined,
    });
  }, []);

  const setCalibrationData = useCallback((data: CalibrationData) => {
    setState(prev => ({
      ...prev,
      calibrationData: data,
      phase: "condition-intro" as StudyPhase,
    }));
    // Apply first condition's interface mode after calibration
    const condition = state.conditions[0];
    if (condition) {
      applyInterfaceMode(condition.interfaceMode);
    }
  }, [state.conditions, applyInterfaceMode]);

  const getCurrentCondition = useCallback((): Condition | null => {
    if (state.currentConditionIndex >= state.conditions.length) return null;
    return state.conditions[state.currentConditionIndex];
  }, [state.conditions, state.currentConditionIndex]);

  const getCurrentTask = useCallback((): Task | null => {
    if (state.currentTaskIndex >= state.tasks.length) return null;
    return state.tasks[state.currentTaskIndex];
  }, [state.tasks, state.currentTaskIndex]);

  const nextPhase = useCallback(() => {
    setState(prev => {
      const condition = prev.conditions[prev.currentConditionIndex];
      
      switch (prev.phase) {
        case "instructions":
          // Go to calibration phase with neutral theme
          applyInterfaceMode("neutral");
          return { ...prev, phase: "calibration" as StudyPhase };
        
        case "calibration":
          // Normally calibration completion is handled by setCalibrationData.
          // In debug mode, allow skipping calibration by injecting safe default equations.
          if (debugMode) {
            const firstCondition = prev.conditions[0];
            if (firstCondition) {
              applyInterfaceMode(firstCondition.interfaceMode);
            }

            const fallbackCalibration = {
              fittsTrials: [],
              hicksTrials: [],
              fittsEquation: { a: 200, b: 150, r2: 0 },
              hicksEquation: { a: 250, b: 100, r2: 0 },
            } as CalibrationData;

            return {
              ...prev,
              calibrationData: prev.calibrationData ?? fallbackCalibration,
              phase: "condition-intro" as StudyPhase,
            };
          }

          return prev;
        
        case "condition-intro":
          return { 
            ...prev, 
            phase: "task" as StudyPhase,
            currentTaskIndex: 0,
            tasks: createTasks(),
          };
        
        case "task":
          if (prev.currentTaskIndex < prev.tasks.length - 1) {
            return { ...prev, currentTaskIndex: prev.currentTaskIndex + 1 };
          }
          return { ...prev, phase: "condition-complete" as StudyPhase };
        
        case "condition-complete":
          if (prev.currentConditionIndex < prev.conditions.length - 1) {
            const nextCondition = prev.conditions[prev.currentConditionIndex + 1];
            applyInterfaceMode(nextCondition.interfaceMode);
            return { 
              ...prev, 
              phase: "condition-intro" as StudyPhase,
              currentConditionIndex: prev.currentConditionIndex + 1,
              currentTaskIndex: 0,
            };
          }
          return { 
            ...prev, 
            phase: "completion" as StudyPhase,
            participantData: {
              ...prev.participantData,
              endTime: new Date().toISOString(),
              completed: true,
            },
          };
        
        default:
          return prev;
      }
    });
  }, [applyInterfaceMode, debugMode]);

  type TaskResultInput = Omit<
    TaskResult,
    "participantId" | "conditionLabel" | "interfaceMode" | "roomCondition" | "timestamp" | "predictedTimeMs"
  > & {
    taskType: TaskResult["taskType"]; // ensure task type is always present
    targetDistancePx?: number;
    targetWidthPx?: number;
    totalClicks?: number;
    targetText?: string;
  };

  const recordTaskResult = useCallback((
    result: TaskResultInput
  ) => {
    setState(prev => {
      const condition = prev.conditions[prev.currentConditionIndex];

      let predictedTime: number | undefined = undefined;

      // -------------------------------
      // Fitts (drag & drop: acquire + transport)
      // -------------------------------
      if (
        result.taskType === "drag-drop" &&
        prev.calibrationData?.fittsEquation &&
        typeof (result as any).acquireDistancePx === "number" &&
        typeof (result as any).acquireWidthPx === "number" &&
        typeof (result as any).dragDistancePx === "number" &&
        typeof (result as any).dropWidthPx === "number"
      ) {
        const { a, b } = prev.calibrationData.fittsEquation;

        const acquireTime =
          a +
          b *
            Math.log2(
              (result as any).acquireDistancePx /
                (result as any).acquireWidthPx +
                1
            );

        const dragTime =
          a +
          b *
            Math.log2(
              (result as any).dragDistancePx /
                (result as any).dropWidthPx +
                1
            );

        predictedTime = acquireTime + dragTime;
      }

      // -------------------------------
      // Fitts + Hick (pointing & choice tasks)
      // -------------------------------
      if (
        result.taskType === "button-click" &&
        prev.calibrationData?.fittsEquation &&
        prev.calibrationData?.hicksEquation &&
        typeof result.targetDistancePx === "number" &&
        typeof result.targetWidthPx === "number"
      ) {
        const { a: fA, b: fB } = prev.calibrationData.fittsEquation;
        const { a: hA, b: hB } = prev.calibrationData.hicksEquation;

        const fittsTime = fA + fB * Math.log2(result.targetDistancePx / result.targetWidthPx + 1);
        const hicksTime = hA + hB * Math.log2((result.totalClicks ?? 1) + 1);

        predictedTime = fittsTime + hicksTime;
      }

      // -------------------------------
      // Hick only (choice reaction)
      // -------------------------------
      if (
        result.taskType === "choice-reaction" &&
        prev.calibrationData?.hicksEquation
      ) {
        const { a, b } = prev.calibrationData.hicksEquation;
        predictedTime = a + b * Math.log2((result.totalClicks ?? 1) + 1);
      }

      // -------------------------------
      // Fitts + Hick (list selection)
      // -------------------------------
      if (
        result.taskType === "list-select" &&
        prev.calibrationData?.fittsEquation &&
        prev.calibrationData?.hicksEquation &&
        typeof result.targetDistancePx === "number" &&
        typeof result.targetWidthPx === "number"
      ) {
        const { a: fA, b: fB } = prev.calibrationData.fittsEquation;
        const { a: hA, b: hB } = prev.calibrationData.hicksEquation;

        const fittsTime =
          fA + fB * Math.log2(result.targetDistancePx / result.targetWidthPx + 1);

        const hicksTime =
          hA + hB * Math.log2((result.totalClicks ?? 1) + 1);

        predictedTime = fittsTime + hicksTime;
      }

      // -------------------------------
      // KLM (form input): (characters + 1) × 0.2 s in ms
      // -------------------------------
      if (
        result.taskType === "form-input" &&
        typeof result.targetText === "string"
      ) {
        predictedTime = predictKLMTime({
          characters: result.targetText.length,
        });
      }

      // -------------------------------
      // Visual search (search slope metric)
      // -------------------------------
      if (
        result.taskType === "visual-search" &&
        typeof result.completionTimeMs === "number" &&
        typeof (result as any).distractorCount === "number" &&
        (result as any).distractorCount > 0
      ) {
        // Leave predictedTime undefined for visual search
        predictedTime = undefined;
      }

      let efficiency: number | undefined = undefined;

      // Default efficiency (predicted / actual)
      if (
        typeof predictedTime === "number" &&
        typeof result.completionTimeMs === "number" &&
        result.completionTimeMs > 0
      ) {
        efficiency = predictedTime / result.completionTimeMs;
      }

      // Visual search efficiency: (time - 100ms) / distractor count
      if (
        result.taskType === "visual-search" &&
        typeof result.completionTimeMs === "number" &&
        typeof (result as any).distractorCount === "number" &&
        (result as any).distractorCount > 0
      ) {
        efficiency =
          (result.completionTimeMs - 100) /
          (result as any).distractorCount;
      }

      const { startCursorPos, distractorCount, ...resultRest } = result as TaskResultInput & { startCursorPos?: unknown; distractorCount?: unknown };
      const resultAny = result as TaskResultInput & { acquireDistancePx?: number; acquireWidthPx?: number };
      const targetDistancePx =
        result.targetDistancePx ??
        (resultAny.taskType === "drag-drop" && typeof resultAny.acquireDistancePx === "number"
          ? resultAny.acquireDistancePx
          : undefined);
      const targetWidthPx =
        result.targetWidthPx ??
        (resultAny.taskType === "drag-drop" && typeof resultAny.acquireWidthPx === "number"
          ? resultAny.acquireWidthPx
          : undefined);

      const fullResult: TaskResult = {
        ...resultRest,
        participantId: prev.participantId,
        conditionLabel: condition?.label || "",
        interfaceMode: condition?.interfaceMode || "light",
        roomCondition: condition?.roomCondition || "bright",
        timestamp: new Date().toISOString(),
        predictedTimeMs: predictedTime,
        efficiency: efficiency,
        targetDistancePx: targetDistancePx ?? undefined,
        targetWidthPx: targetWidthPx ?? undefined,
        totalClicks: result.totalClicks,
      };

      return { ...prev, results: [...prev.results, fullResult] };
    });
  }, []);

  const resetStudy = useCallback(() => {
    applyInterfaceMode("light");
    setState(initialState);
  }, [applyInterfaceMode]);

  useEffect(() => {
    applyInterfaceMode("light");
  }, [applyInterfaceMode]);

  const skipCurrent = useCallback(() => {
    setState(prev => {
      // If we are in a task list, skip the current task
      if (prev.phase === "task") {
        if (prev.currentTaskIndex < prev.tasks.length - 1) {
          return { ...prev, currentTaskIndex: prev.currentTaskIndex + 1 };
        }
        return { ...prev, phase: "condition-complete" as StudyPhase };
      }

      // If we're in calibration, skip forward via the same logic as nextPhase (debug-only)
      if (prev.phase === "calibration") {
        const firstCondition = prev.conditions[0];
        if (firstCondition) {
          applyInterfaceMode(firstCondition.interfaceMode);
        }

        const fallbackCalibration = {
          fittsTrials: [],
          hicksTrials: [],
          fittsEquation: { a: 200, b: 150, r2: 0 },
          hicksEquation: { a: 250, b: 100, r2: 0 },
        } as CalibrationData;

        return {
          ...prev,
          calibrationData: prev.calibrationData ?? fallbackCalibration,
          phase: "condition-intro" as StudyPhase,
        };
      }

      // For all other phases, move forward one step.
      // (We can't call nextPhase() here because we're inside setState; replicate the common transitions.)
      const condition = prev.conditions[prev.currentConditionIndex];

      switch (prev.phase) {
        case "consent":
          return { ...prev, phase: "instructions" as StudyPhase };

        case "instructions":
          applyInterfaceMode("neutral");
          return { ...prev, phase: "calibration" as StudyPhase };

        case "condition-intro":
          return {
            ...prev,
            phase: "task" as StudyPhase,
            currentTaskIndex: 0,
            tasks: createTasks(),
          };

        case "condition-complete":
          if (prev.currentConditionIndex < prev.conditions.length - 1) {
            const nextCondition = prev.conditions[prev.currentConditionIndex + 1];
            applyInterfaceMode(nextCondition.interfaceMode);
            return {
              ...prev,
              phase: "condition-intro" as StudyPhase,
              currentConditionIndex: prev.currentConditionIndex + 1,
              currentTaskIndex: 0,
            };
          }
          return {
            ...prev,
            phase: "completion" as StudyPhase,
            participantData: {
              ...prev.participantData,
              endTime: new Date().toISOString(),
              completed: true,
            },
          };

        default:
          return prev;
      }
    });
  }, [applyInterfaceMode]);

  return (
    <StudyContext.Provider value={{
      state,
      debugMode,
      setDebugMode,
      startStudy,
      nextPhase,
      recordTaskResult,
      getCurrentCondition,
      getCurrentTask,
      resetStudy,
      setCalibrationData,
    }}>
      <>
        {children}
        {debugMode && (
          <button
            onClick={skipCurrent}
            style={{
              position: "fixed",
              bottom: 12,
              right: 12,
              zIndex: 9999,
              padding: "8px 12px",
              fontSize: 12,
              borderRadius: 6,
              border: "1px solid rgba(0,0,0,0.2)",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            Skip
          </button>
        )}
      </>
    </StudyContext.Provider>
  );
}

export function useStudy() {
  const context = useContext(StudyContext);
  if (!context) {
    throw new Error("useStudy must be used within a StudyProvider");
  }
  return context;
}
