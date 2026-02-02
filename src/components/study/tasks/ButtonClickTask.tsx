import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Task } from "@/types/study";
import { Button } from "@/components/ui/button";
import { calculateCursorDistance } from "@/lib/study-utils";
import { Check } from "lucide-react";
import { useStudy } from "@/contexts/StudyContext";

interface TaskProps {
  task: Task;
  onComplete: (metrics: {
    completionTimeMs: number;
    totalClicks: number;
    incorrectClicks: number;
    cursorDistancePx: number;
    predictedTimeMs?: number;
    targetDistancePx?: number | null;
    targetWidthPx?: number | null;
    success: boolean;
  }) => void;
}

export function ButtonClickTask({ task, onComplete }: TaskProps) {
  const { state } = useStudy();
  const calibration = state.calibrationData;

  const buttons = ["Cancel", "Submit", "Continue", "Reset"];
  const targetButton =
    task.targetValue && buttons.includes(task.targetValue)
      ? task.targetValue
      : null;
  const [shuffledButtons, setShuffledButtons] = useState<string[]>([]);
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [clicks, setClicks] = useState(0);
  const [incorrectClicks, setIncorrectClicks] = useState(0);
  const cursorPositions = useRef<{ x: number; y: number }[]>([]);
  const startPosition = useRef<{ x: number; y: number } | null>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const recordInitialCursorPosition = (e: MouseEvent) => {
    startPosition.current = { x: e.clientX, y: e.clientY };
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

  const handleButtonClick = useCallback(
    (buttonLabel: string) => {
      if (!started || completed) return;

      setClicks((prev) => prev + 1);

      if (buttonLabel === targetButton) {
        const targetEl = buttonRefs.current[buttonLabel];
        let targetDistance = null;
        let targetWidth = null;

        if (targetEl && startPosition.current !== null) {
          const rect = targetEl.getBoundingClientRect();

          const targetCenter = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
          };

          const dx = targetCenter.x - startPosition.current.x;
          const dy = targetCenter.y - startPosition.current.y;

          targetDistance = Math.sqrt(dx * dx + dy * dy);
          targetWidth = rect.width;
        }

        setCompleted(true);
        const endTime = performance.now();

        setTimeout(() => {
          onComplete({
            completionTimeMs: Math.round(endTime - startTime),
            totalClicks: clicks,
            incorrectClicks,
            cursorDistancePx: calculateCursorDistance(cursorPositions.current),
            targetDistancePx: targetDistance,
            targetWidthPx: targetWidth,
            success: true,
          });
        }, 800);
      } else {
        setIncorrectClicks((prev) => prev + 1);
      }
    },
    [started, completed, targetButton, startTime, clicks, incorrectClicks, onComplete]
  );

  const handleStart = useCallback(() => {
    const shuffled = [...buttons].sort(() => Math.random() - 0.5);
    setShuffledButtons(shuffled);
    setStarted(true);
    setStartTime(performance.now());
    cursorPositions.current = [];
    startPosition.current = null;
    window.addEventListener("mousemove", recordInitialCursorPosition, { once: true });
  }, [buttons]);

  if (!targetButton) {
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
      className="flex flex-col items-center justify-center h-full space-y-8"
    >
      {started && !completed && targetButton && (
        <p className="text-lg font-medium text-foreground">
          Click the <span className="font-semibold">{targetButton}</span> button
        </p>
      )}
      
      <div className="flex gap-4 flex-wrap justify-center translate-y-64">
        {shuffledButtons.map((label) => (
          <Button
            ref={(el) => (buttonRefs.current[label] = el)}
            key={label}
            variant="outline"
            size="lg"
            onClick={() => handleButtonClick(label)}
            className="min-w-[120px] transition-colors hover:bg-muted"
          >
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}
