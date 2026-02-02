import { useState, useEffect, useRef, useCallback } from "react";
import { Task } from "@/types/study";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { calculateCursorDistance } from "@/lib/study-utils";
import { Check } from "lucide-react";

const SENTENCES = [
  "bright stars shine above",
  "silent winds move softly",
  "gentle waves touch shore",
  "calm minds think clearly",
];

interface TaskProps {
  task: Task;
  onComplete: (metrics: {
    completionTimeMs: number;
    totalClicks: number;
    incorrectClicks: number;
    cursorDistancePx: number;
    success: boolean;
    targetText?: string;
  }) => void;
}

export function FormInputTask({ task, onComplete }: TaskProps) {
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [clicks, setClicks] = useState(0);
  const [incorrectClicks, setIncorrectClicks] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [showError, setShowError] = useState(false);
  const cursorPositions = useRef<{ x: number; y: number }[]>([]);

  const [availableSentences, setAvailableSentences] = useState<string[]>([...SENTENCES]);
  const [targetSentence, setTargetSentence] = useState<string | null>(null);

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

    if (availableSentences.length === 0) return;

    const index = Math.floor(Math.random() * availableSentences.length);
    const selected = availableSentences[index];

    setTargetSentence(selected);
    setAvailableSentences(prev => prev.filter((_, i) => i !== index));
  }, [availableSentences]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!started || completed) return;

    setClicks(prev => prev + 1);

    if (inputValue.trim() === targetSentence) {
      setCompleted(true);
      const endTime = performance.now();
      const capturedTargetText = targetSentence; // Capture for closure
      
      setTimeout(() => {
        onComplete({
          completionTimeMs: Math.round(endTime - startTime),
          totalClicks: clicks + 1,
          incorrectClicks,
          cursorDistancePx: calculateCursorDistance(cursorPositions.current),
          success: true,
          targetText: capturedTargetText || undefined,
        });
      }, 800);
    } else {
      setIncorrectClicks(prev => prev + 1);
      setShowError(true);
      setTimeout(() => setShowError(false), 1500);
    }
  }, [started, completed, inputValue, targetSentence, startTime, clicks, incorrectClicks, onComplete]);

  const handleAreaClick = useCallback(() => {
    if (started && !completed) {
      setClicks(prev => prev + 1);
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
      <p className="text-lg font-medium text-foreground">
        Type the following text exactly:
      </p>
      <p className="font-mono text-sm text-muted-foreground">{targetSentence}</p>
      
      <form 
        onSubmit={handleSubmit}
        className="w-full max-w-xs space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-2">
          <Input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Enter value..."
            className={showError ? "border-destructive" : ""}
            autoComplete="off"
          />
          {showError && (
            <p className="text-sm text-destructive">Incorrect sentence. Try again.</p>
          )}
        </div>
        <Button type="submit" className="w-full">
          Submit
        </Button>
      </form>
    </div>
  );
}
