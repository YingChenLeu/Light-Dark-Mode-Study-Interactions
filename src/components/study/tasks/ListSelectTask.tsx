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

  const getListItems = () => {
    if (task.targetValue === "Blue") {
      return ["Red", "Green", "Blue", "Yellow", "Purple"];
    }
    return ["Option A", "Option B", "Option C", "Option D"];
  };

  const targetItem = task.targetValue || "Option B";

  useEffect(() => {
    if (!started) return;

    const handleMouseMove = (e: MouseEvent) => {
      cursorPositions.current.push({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [started]);

  const handleStart = useCallback(() => {
    setStarted(true);
    setStartTime(performance.now());
    const handleFirstMove = (e: MouseEvent) => {
      startPosition.current = { x: e.clientX, y: e.clientY };
      window.removeEventListener("mousemove", handleFirstMove);
    };
    window.addEventListener("mousemove", handleFirstMove);
    cursorPositions.current = [];
    setShuffledItems(shuffleArray(getListItems()));
  }, []);

  const handleItemClick = useCallback((item: string) => {
    if (!started || completed) return;

    setClicks(prev => prev + 1);
    setSelectedItem(item);

    if (item === targetItem) {
      setCompleted(true);
      const endTime = performance.now();
      
      setTimeout(() => {
        const el = document.getElementById(`item-${item}`);
        let targetDistance = 0;
        let targetWidth = 0;

        if (el && startPosition.current) {
          const rect = el.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;

          targetDistance = Math.hypot(
            centerX - startPosition.current.x,
            centerY - startPosition.current.y
          );

          targetWidth = rect.width;
        }

        onComplete({
          completionTimeMs: Math.round(endTime - startTime),
          totalClicks: clicks + 1,
          incorrectClicks,
          cursorDistancePx: calculateCursorDistance(cursorPositions.current),
          targetDistancePx: targetDistance,
          targetWidthPx: targetWidth,
          success: true,
        });
      }, 800);
    } else {
      setIncorrectClicks(prev => prev + 1);
    }
  }, [started, completed, targetItem, startTime, clicks, incorrectClicks, onComplete]);

  const handleAreaClick = useCallback(() => {
    if (started && !completed) {
      setClicks(prev => prev + 1);
      setIncorrectClicks(prev => prev + 1);
    }
  }, [started, completed]);

  if (!started) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-6">
        <div className="text-center space-y-2">
          <p className="text-lg font-medium text-foreground">{task.instruction}</p>
          <p className="text-sm text-muted-foreground">Click "Start Task" when ready</p>
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
    <div 
      className="flex flex-col items-center justify-center h-full space-y-6"
      onClick={handleAreaClick}
    >
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
