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
  createTasks 
} from "@/lib/study-utils";
import { getPredictedTimeForTask } from "@/lib/calibration-utils";

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
          // This is handled by setCalibrationData
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
  }, [applyInterfaceMode]);

  const recordTaskResult = useCallback((
    result: Omit<TaskResult, "participantId" | "conditionLabel" | "interfaceMode" | "roomCondition" | "timestamp" | "predictedTimeMs">
  ) => {
    setState(prev => {
      const condition = prev.conditions[prev.currentConditionIndex];
      const predictedTime = getPredictedTimeForTask(
        result.taskType,
        prev.calibrationData?.fittsEquation,
        prev.calibrationData?.hicksEquation
      );
      
      const fullResult: TaskResult = {
        ...result,
        participantId: prev.participantId,
        conditionLabel: condition?.label || "",
        interfaceMode: condition?.interfaceMode || "light",
        roomCondition: condition?.roomCondition || "bright",
        timestamp: new Date().toISOString(),
        predictedTimeMs: predictedTime,
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
      {children}
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
