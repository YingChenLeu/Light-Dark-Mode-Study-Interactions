import { Condition, Task, TaskResult, ParticipantData } from "@/types/study";

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
      instruction: "Click the 'Submit' button",
      targetValue: "Submit",
    },
    {
      id: "btn-2",
      type: "button-click",
      instruction: "Click the 'Continue' button",
      targetValue: "Continue",
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
      instruction: "Enter '42' in the input field and submit",
      targetValue: "42",
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
  
  const headers = Object.keys(results[0]).join(",");
  const rows = results.map(result => 
    Object.values(result).map(v => 
      typeof v === "string" ? `"${v}"` : v
    ).join(",")
  );
  
  return [headers, ...rows].join("\n");
}

export function exportToJSON(results: TaskResult[], participantData: ParticipantData): string {
  return JSON.stringify({
    participant: participantData,
    results: results,
  }, null, 2);
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
