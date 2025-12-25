export type InterfaceMode = "light" | "dark";
export type RoomCondition = "bright" | "dark";

export interface Condition {
  interfaceMode: InterfaceMode;
  roomCondition: RoomCondition;
  label: string;
}

export type TaskType = "button-click" | "drag-drop" | "list-select" | "form-input";

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
}
