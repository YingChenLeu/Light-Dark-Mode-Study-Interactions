export type InterfaceMode = "light" | "dark" | "neutral";
export type RoomCondition = "bright" | "dark";

export interface Condition {
  interfaceMode: InterfaceMode;
  roomCondition: RoomCondition;
  label: string;
}

export type TaskType =
  | "button-click"
  | "drag-drop"
  | "list-select"
  | "form-input"
  | "visual-search"
  | "choice-reaction";

export interface Task {
  id: string;
  type: TaskType;
  instruction: string;
  targetValue?: string;
}

export interface TaskResult {
  participantId: string;
  taskId: string;
  taskType: TaskType;
  conditionLabel: string;
  interfaceMode: InterfaceMode;
  roomCondition: RoomCondition;
  completionTimeMs: number;
  totalClicks: number;
  incorrectClicks: number;
  cursorDistancePx: number;
  success: boolean;
  timestamp: string;
  predictedTimeMs?: number;
  targetText?: string;
  efficiency?: number;
}

export interface ParticipantData {
  participantId: string;
  startTime: string;
  endTime?: string;
  conditionOrder: string[];
  completed: boolean;
}

export type StudyPhase = 
  | "consent"
  | "instructions"
  | "calibration"
  | "condition-intro"
  | "task"
  | "condition-complete"
  | "completion";

export interface StudyState {
  phase: StudyPhase;
  participantId: string;
  conditions: Condition[];
  currentConditionIndex: number;
  tasks: Task[];
  currentTaskIndex: number;
  results: TaskResult[];
  participantData: ParticipantData;
  calibrationData?: CalibrationData;
}

// Fitts' Law calibration types
export interface FittsTrialData {
  trialIndex: number;
  targetWidth: number;
  targetDistance: number;
  movementTimeMs: number;
  indexOfDifficulty: number; // log2(D/W + 1)
  success: boolean;
  timestamp: string;
}

// Hick's Law calibration types
export interface HicksTrialData {
  trialIndex: number;
  numChoices: number;
  targetKey: string;
  reactionTimeMs: number;
  correct: boolean;
  timestamp: string;
  rangeStartIndex: number;
  activeKeys: string[];
}

// Computed law equations
export interface FittsLawEquation {
  a: number; // intercept
  b: number; // slope
  r2: number; // coefficient of determination
}

export interface HicksLawEquation {
  a: number; // intercept
  b: number; // slope
  r2: number; // coefficient of determination
}

export interface CalibrationData {
  fittsTrials: FittsTrialData[];
  hicksTrials: HicksTrialData[];
  fittsEquation?: FittsLawEquation;
  hicksEquation?: HicksLawEquation;
  calibrationComplete: boolean;
}
