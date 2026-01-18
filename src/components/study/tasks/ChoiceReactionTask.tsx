import { useState, useEffect, useRef, useCallback } from "react";
import { Task } from "@/types/study";
import { Button } from "@/components/ui/button";

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

const CHOICE_COUNTS = [2, 3, 4, 5];
const SHAPES = [
  { id: "circle", label: "●", color: "hsl(var(--primary))" },
  { id: "square", label: "■", color: "hsl(var(--destructive))" },
  { id: "triangle", label: "▲", color: "hsl(142, 76%, 36%)" },
  { id: "diamond", label: "◆", color: "hsl(45, 93%, 47%)" },
  { id: "star", label: "★", color: "hsl(280, 65%, 60%)" },
];

export function ChoiceReactionTask({ task, onComplete }: TaskProps) {
  const [phase, setPhase] = useState<"ready" | "waiting" | "stimulus" | "complete">("ready");
  const [startTime, setStartTime] = useState<number>(0);
  const [numChoices, setNumChoices] = useState(3);
  const [activeChoices, setActiveChoices] = useState<typeof SHAPES>([]);
  const [targetShape, setTargetShape] = useState<typeof SHAPES[0] | null>(null);
  const [incorrectPresses, setIncorrectPresses] = useState(0);
  const [totalPresses, setTotalPresses] = useState(0);
  
  const stimulusTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleStart = useCallback(() => {
    // Random number of choices
    const count = CHOICE_COUNTS[Math.floor(Math.random() * CHOICE_COUNTS.length)];
    setNumChoices(count);
    
    // Select which shapes to use
    const shuffledShapes = [...SHAPES].sort(() => Math.random() - 0.5);
    const choices = shuffledShapes.slice(0, count);
    setActiveChoices(choices);
    
    // Pick target
    const target = choices[Math.floor(Math.random() * choices.length)];
    setTargetShape(target);
    
    setPhase("waiting");
    setIncorrectPresses(0);
    setTotalPresses(0);

    // Random delay before showing stimulus (1-3 seconds)
    const delay = 1000 + Math.random() * 2000;
    stimulusTimeoutRef.current = setTimeout(() => {
      setPhase("stimulus");
      setStartTime(performance.now());
    }, delay);
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.code !== "Space") return;
    e.preventDefault();
    
    if (phase === "waiting") {
      // Early press - count as incorrect
      setTotalPresses(prev => prev + 1);
      setIncorrectPresses(prev => prev + 1);
      return;
    }
    
    if (phase === "stimulus" && targetShape) {
      const endTime = performance.now();
      setPhase("complete");
      setTotalPresses(prev => prev + 1);
      
      onComplete({
        completionTimeMs: Math.round(endTime - startTime),
        totalClicks: totalPresses + 1,
        incorrectClicks: incorrectPresses,
        cursorDistancePx: 0, // No cursor movement needed
        success: true,
      });
    }
  }, [phase, targetShape, startTime, totalPresses, incorrectPresses, onComplete]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    return () => {
      if (stimulusTimeoutRef.current) {
        clearTimeout(stimulusTimeoutRef.current);
      }
    };
  }, []);

  if (phase === "ready") {
    return (
      <div className="flex flex-col items-center justify-start h-full space-y-6 pt-24">
        <p className="text-lg text-foreground text-center max-w-md">
          {task.instruction || "Press SPACE when you see the target shape appear"}
        </p>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          You will see several possible shapes. When the target shape is highlighted, 
          press SPACE as quickly as possible.
        </p>
        <Button onClick={handleStart} size="lg">
          Start Task
        </Button>
      </div>
    );
  }

  if (phase === "complete") {
    return (
      <div className="flex items-center justify-start h-full pt-24">
        <p className="text-xl font-medium text-green-600 dark:text-green-400">
          Response recorded!
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-start h-full space-y-8 pt-24">
      {/* Target indicator */}
      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">Target shape:</p>
        {targetShape && (
          <span className="text-4xl" style={{ color: targetShape.color }}>
            {targetShape.label}
          </span>
        )}
      </div>

      {/* Choice display */}
      <div className="flex gap-8">
        {activeChoices.map((shape) => (
          <div
            key={shape.id}
            className={`text-5xl transition-all duration-150 ${
              phase === "stimulus" && targetShape?.id === shape.id
                ? "scale-150 animate-pulse"
                : "opacity-40"
            }`}
            style={{ color: shape.color }}
          >
            {shape.label}
          </div>
        ))}
      </div>

      {/* Status */}
      <div className="text-center space-y-2">
        {phase === "waiting" && (
          <p className="text-lg text-muted-foreground">Wait for the target...</p>
        )}
        {phase === "stimulus" && (
          <p className="text-lg font-bold text-foreground animate-pulse">
            Press SPACE now!
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Choices: {numChoices}
        </p>
      </div>
    </div>
  );
}