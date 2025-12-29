import { Condition, Task, TaskResult, ParticipantData, CalibrationData } from "@/types/study";

export function predictKLMTime({
  characters,
  keystrokeTime = 0.2,
  mentalTime = 1.35,
  handMovementTime = 0.4,
}: {
  characters: number;
  keystrokeTime?: number;
  mentalTime?: number;
  handMovementTime?: number;
}): number {
  return (
    mentalTime +
    handMovementTime +
    characters * keystrokeTime
  );
}

export function generateParticipantId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 8);
  return `P_${timestamp}_${randomPart}`.toUpperCase();
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function createConditions(): Condition[] {
  const conditions: Condition[] = [
    { interfaceMode: "light", roomCondition: "bright", label: "Light Interface / Bright Room" },
    { interfaceMode: "light", roomCondition: "dark", label: "Light Interface / Dark Room" },
    { interfaceMode: "dark", roomCondition: "bright", label: "Dark Interface / Bright Room" },
    { interfaceMode: "dark", roomCondition: "dark", label: "Dark Interface / Dark Room" },
  ];
  return shuffleArray(conditions);
}

export function createTasks(): Task[] {
  const baseTasks: Task[] = [
    {
      id: "btn-1",
      type: "button-click",
      instruction: "Click the target button",
    },
    {
      id: "btn-2",
      type: "button-click",
      instruction: "Click the target button",
    },
    {
      id: "drag-1",
      type: "drag-drop",
      instruction: "Drag the item to the target zone",
    },
    {
      id: "list-1",
      type: "list-select",
      instruction: "Select 'Option B' from the list",
      targetValue: "Option B",
    },
    {
      id: "list-2",
      type: "list-select",
      instruction: "Select 'Blue' from the color options",
      targetValue: "Blue",
    },
    {
      id: "form-1",
      type: "form-input",
      instruction: "Type the shown sentence exactly and submit",
    },
  ];
  return shuffleArray(baseTasks);
}

export function calculateCursorDistance(movements: { x: number; y: number }[]): number {
  if (movements.length < 2) return 0;
  let distance = 0;
  for (let i = 1; i < movements.length; i++) {
    const dx = movements[i].x - movements[i - 1].x;
    const dy = movements[i].y - movements[i - 1].y;
    distance += Math.sqrt(dx * dx + dy * dy);
  }
  return Math.round(distance);
}

export function exportToCSV(results: TaskResult[]): string {
  if (results.length === 0) return "";

  const headers = Object.keys(results[0]);

  const rows = results.map(r =>
    headers.map(key => {
      const value = (r as any)[key];
      if (value === undefined || value === null) return "";
      if (typeof value === "string") return `"${value}"`;
      return value;
    })
  );

  return [
    headers.join(","),
    ...rows.map(row => row.join(","))
  ].join("\n");
}

export function exportToJSON(
  results: TaskResult[], 
  participantData: ParticipantData,
  calibrationData?: CalibrationData
): string {
  return JSON.stringify({
    participant: participantData,
    calibration: calibrationData ? {
      fittsEquation: calibrationData.fittsEquation,
      hicksEquation: calibrationData.hicksEquation,
      fittsTrialsCount: calibrationData.fittsTrials.length,
      hicksTrialsCount: calibrationData.hicksTrials.length,
    } : null,
    results: results,
  }, null, 2);
}

export function exportCalibrationToCSV(calibrationData: CalibrationData): string {
  const fittsHeaders = "trialType,trialIndex,targetWidth,targetDistance,indexOfDifficulty,movementTimeMs,success,timestamp";
  const fittsRows = calibrationData.fittsTrials.map(t => 
    `fitts,${t.trialIndex},${t.targetWidth},${t.targetDistance},${t.indexOfDifficulty.toFixed(3)},${t.movementTimeMs},${t.success},"${t.timestamp}"`
  );

  const hicksHeaders = "trialType,trialIndex,numChoices,targetKey,reactionTimeMs,correct,timestamp";
  const hicksRows = calibrationData.hicksTrials.map(t =>
    `hicks,${t.trialIndex},${t.numChoices},"${t.targetKey}",${t.reactionTimeMs},${t.correct},"${t.timestamp}"`
  );

  const equationSummary = [
    "",
    "# Fitts' Law Equation: MT = a + b * log2(D/W + 1)",
    calibrationData.fittsEquation 
      ? `# a=${calibrationData.fittsEquation.a.toFixed(2)}, b=${calibrationData.fittsEquation.b.toFixed(2)}, R²=${calibrationData.fittsEquation.r2.toFixed(3)}`
      : "# Not computed",
    "",
    "# Hick's Law Equation: RT = a + b * log2(n)",
    calibrationData.hicksEquation
      ? `# a=${calibrationData.hicksEquation.a.toFixed(2)}, b=${calibrationData.hicksEquation.b.toFixed(2)}, R²=${calibrationData.hicksEquation.r2.toFixed(3)}`
      : "# Not computed",
  ];

  return [
    "# Fitts' Law Trials",
    fittsHeaders,
    ...fittsRows,
    "",
    "# Hick's Law Trials", 
    hicksHeaders,
    ...hicksRows,
    ...equationSummary
  ].join("\n");
}

export function downloadFile(content: string, filename: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
