import { useState, useEffect, useRef, useCallback } from "react";
import { Task } from "@/types/study";
import { Button } from "@/components/ui/button";
import { calculateCursorDistance } from "@/lib/study-utils";
import { Check } from "lucide-react";

interface TaskProps {
  task: Task;
  onComplete: (metrics: {
    completionTimeMs: number;
    totalClicks: number;
    incorrectClicks: number;
    cursorDistancePx: number;
    success: boolean;
  }) => void;
}

export function ButtonClickTask({ task, onComplete }: TaskProps) {
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [clicks, setClicks] = useState(0);
  const [incorrectClicks, setIncorrectClicks] = useState(0);
  const cursorPositions = useRef<{ x: number; y: number }[]>([]);

  const buttons = ["Cancel", "Submit", "Continue", "Reset"];
  const targetButton = task.targetValue || "Submit";

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
    cursorPositions.current = [];
  }, []);

  const handleButtonClick = useCallback((buttonLabel: string) => {
    if (!started || completed) return;

    setClicks(prev => prev + 1);

    if (buttonLabel === targetButton) {
      setCompleted(true);
      const endTime = performance.now();
      
      setTimeout(() => {
        onComplete({
          completionTimeMs: Math.round(endTime - startTime),
          totalClicks: clicks + 1,
          incorrectClicks,
          cursorDistancePx: calculateCursorDistance(cursorPositions.current),
          success: true,
        });
      }, 800);
    } else {
      setIncorrectClicks(prev => prev + 1);
    }
  }, [started, completed, targetButton, startTime, clicks, incorrectClicks, onComplete]);

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
      className="flex flex-col items-center justify-center h-full space-y-8"
      onClick={handleAreaClick}
    >
      <p className="text-lg font-medium text-foreground">{task.instruction}</p>
      
      <div 
        className="flex gap-4 flex-wrap justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {buttons.map((label) => (
          <Button
            key={label}
            variant={label === targetButton ? "default" : "outline"}
            size="lg"
            onClick={() => handleButtonClick(label)}
            className="min-w-[120px]"
          >
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}
