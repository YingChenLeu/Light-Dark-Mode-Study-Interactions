import { useState, useEffect, useRef, useCallback } from "react";
import { Task } from "@/types/study";
import { Button } from "@/components/ui/button";
import { calculateCursorDistance } from "@/lib/study-utils";
import { Check } from "lucide-react";

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

interface TaskProps {
  task: Task;
  onComplete: (metrics: {
    completionTimeMs: number;
    totalClicks: number;
    incorrectClicks: number;
    cursorDistancePx: number;
    targetDistancePx?: number;
    targetWidthPx?: number;
    success: boolean;
    numChoices: number;
  }) => void;
}

export function ListSelectTask({ task, onComplete }: TaskProps) {
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [clicks, setClicks] = useState(0);
  const [incorrectClicks, setIncorrectClicks] = useState(0);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [shuffledItems, setShuffledItems] = useState<string[]>([]);
  const cursorPositions = useRef<{ x: number; y: number }[]>([]);
  const startPosition = useRef<{ x: number; y: number } | null>(null);

  const COLOR_OPTIONS = ["Red", "Green", "Blue", "Yellow", "Purple"];
  const LETTER_OPTIONS = ["Option A", "Option B", "Option C", "Option D"];

  const ALL_OPTIONS = [...COLOR_OPTIONS, ...LETTER_OPTIONS];
  const targetItem =
    task.targetValue && ALL_OPTIONS.includes(task.targetValue)
      ? task.targetValue
      : null;

  const getListItems = () => {
    if (task.targetValue && COLOR_OPTIONS.includes(task.targetValue)) {
      return COLOR_OPTIONS;
    }
    return LETTER_OPTIONS;
  };

  useEffect(() => {
    if (!started || completed) return;

    const handleMouseMove = (e: MouseEvent) => {
      cursorPositions.current.push({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [started, completed]);

  const handleStart = useCallback(() => {
    setStarted(true);
    setStartTime(performance.now());

    cursorPositions.current = [];
    startPosition.current = null;

    const recordInitialPosition = (e: MouseEvent) => {
      startPosition.current = { x: e.clientX, y: e.clientY };
      window.removeEventListener("mousemove", recordInitialPosition);
    };

    window.addEventListener("mousemove", recordInitialPosition, { once: true });

    setShuffledItems(shuffleArray(getListItems()));
  }, [task.targetValue]);

  const handleItemClick = useCallback(
    (item: string) => {
      if (!started || completed) return;

      setClicks((prevClicks) => {
        const newClicks = prevClicks + 1;
        setSelectedItem(item);

        if (item === targetItem) {
          // Capture target distance/width synchronously before re-render unmounts the list
          const el = document.getElementById(`item-${item}`);
          let targetDistance: number | null = null;
          let targetWidth: number | null = null;
          if (el && startPosition.current !== null) {
            const rect = el.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            targetDistance = Math.hypot(
              centerX - startPosition.current.x,
              centerY - startPosition.current.y
            );
            targetWidth = rect.width;
          }

          const endTime = performance.now();
          const completionTimeMs = Math.round(endTime - startTime);
          const incorrectClicksValue = incorrectClicks;

          setCompleted(true);

          setTimeout(() => {
            onComplete({
              completionTimeMs,
              totalClicks: newClicks,
              incorrectClicks: incorrectClicksValue,
              cursorDistancePx: calculateCursorDistance(
                cursorPositions.current
              ),
              targetDistancePx: targetDistance ?? undefined,
              targetWidthPx: targetWidth ?? undefined,
              success: true,
              numChoices: shuffledItems.length,
            });
          }, 800);
        } else {
          setIncorrectClicks((prev) => prev + 1);
        }

        return newClicks;
      });
    },
    [
      started,
      completed,
      targetItem,
      startTime,
      incorrectClicks,
      onComplete,
      shuffledItems.length,
    ]
  );

  if (!targetItem) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-muted-foreground">
          Invalid task configuration.
        </p>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-6">
        <div className="text-center space-y-2">
          <p className="text-lg font-medium text-foreground">
            {task.instruction}
          </p>
          <p className="text-sm text-muted-foreground">
            Click "Start Task" when ready
          </p>
        </div>
        <Button onClick={handleStart} size="lg">
          Start Task
        </Button>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <div className="w-16 h-16 rounded-full bg-success flex items-center justify-center">
          <Check className="w-8 h-8 text-success-foreground" />
        </div>
        <p className="text-lg font-medium text-foreground">Task Completed</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-6">
      <p className="text-lg font-medium text-foreground">{task.instruction}</p>

      <div
        className="w-full max-w-xs bg-card border border-border rounded-lg overflow-hidden translate-y-56  shadow-md"
        onClick={(e) => e.stopPropagation()}
      >
        {shuffledItems.map((item, index) => (
          <div
            id={`item-${item}`}
            key={item}
            onClick={() => handleItemClick(item)}
            className={`px-4 py-3 cursor-pointer select-none ${
              index !== shuffledItems.length - 1 ? "border-b border-border" : ""
            } ${
              selectedItem === item && item === targetItem
                ? "bg-success text-success-foreground"
                : selectedItem === item
                ? "bg-destructive text-destructive-foreground"
                : "hover:bg-secondary"
            }`}
          >
            <span className="text-sm">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
