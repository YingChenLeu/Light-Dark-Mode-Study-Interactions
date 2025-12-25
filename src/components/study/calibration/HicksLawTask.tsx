import { useState, useEffect, useCallback } from "react";
import { HicksTrialData } from "@/types/study";
import { generateHicksTrials } from "@/lib/calibration-utils";

interface HicksLawTaskProps {
  onComplete: (trials: HicksTrialData[]) => void;
}

export function HicksLawTask({ onComplete }: HicksLawTaskProps) {
  const [trials] = useState(() => generateHicksTrials());
  const [currentTrialIndex, setCurrentTrialIndex] = useState(0);
  const [results, setResults] = useState<HicksTrialData[]>([]);
  const [showTarget, setShowTarget] = useState(false);
  const [trialStartTime, setTrialStartTime] = useState<number | null>(null);
  const [waitingForStart, setWaitingForStart] = useState(true);
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);

  const currentTrial = trials[currentTrialIndex];
  const isComplete = currentTrialIndex >= trials.length;
  const activeKeys = ["A", "S", "D", "F"].slice(0, currentTrial?.numChoices || 4);

  // Handle keyboard input
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    const key = event.key.toUpperCase();
    
    if (waitingForStart && key === " ") {
      // Start the trial
      setWaitingForStart(false);
      const randomDelay = 500 + Math.random() * 1500; // 0.5-2 second random delay
      setTimeout(() => {
        setShowTarget(true);
        setTrialStartTime(performance.now());
      }, randomDelay);
      return;
    }

    if (!showTarget || trialStartTime === null) return;
    if (!activeKeys.includes(key)) return;

    const reactionTime = Math.round(performance.now() - trialStartTime);
    const isCorrect = key === currentTrial.targetKey;

    const trialResult: HicksTrialData = {
      trialIndex: currentTrialIndex,
      numChoices: currentTrial.numChoices,
      targetKey: currentTrial.targetKey,
      reactionTimeMs: reactionTime,
      correct: isCorrect,
      timestamp: new Date().toISOString(),
    };

    setResults(prev => [...prev, trialResult]);
    setFeedback(isCorrect ? "correct" : "incorrect");
    setShowTarget(false);
    setTrialStartTime(null);

    // Brief feedback display, then move to next trial
    setTimeout(() => {
      setFeedback(null);
      if (currentTrialIndex < trials.length - 1) {
        setCurrentTrialIndex(currentTrialIndex + 1);
        setWaitingForStart(true);
      } else {
        onComplete([...results, trialResult]);
      }
    }, 500);
  }, [waitingForStart, showTarget, trialStartTime, currentTrial, currentTrialIndex, trials.length, results, activeKeys, onComplete]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleKeyPress]);

  if (isComplete) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-foreground">Hick's Law calibration complete!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <div className="text-center mb-8">
        <h3 className="text-lg font-medium text-foreground mb-2">Hick's Law Calibration</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Place your left hand on the A, S, D, F keys.
          <br />
          When a letter appears, press the corresponding key as quickly as possible.
        </p>
        <p className="text-xs text-muted-foreground">
          Trial {currentTrialIndex + 1} of {trials.length}
        </p>
      </div>

      {/* Key display */}
      <div className="flex gap-2 mb-8">
        {["A", "S", "D", "F"].map((key) => (
          <div
            key={key}
            className={`w-16 h-16 rounded-md flex items-center justify-center text-2xl font-bold border-2 ${
              activeKeys.includes(key)
                ? "bg-secondary text-secondary-foreground border-border"
                : "bg-muted text-muted-foreground border-transparent opacity-30"
            }`}
          >
            {key}
          </div>
        ))}
      </div>

      {/* Target display area */}
      <div className="w-32 h-32 flex items-center justify-center rounded-lg bg-card border border-border">
        {waitingForStart && (
          <span className="text-sm text-muted-foreground">Press Space</span>
        )}
        {!waitingForStart && !showTarget && !feedback && (
          <span className="text-sm text-muted-foreground">Wait...</span>
        )}
        {showTarget && (
          <span className="text-5xl font-bold text-foreground">{currentTrial.targetKey}</span>
        )}
        {feedback === "correct" && (
          <span className="text-2xl text-success font-bold">✓</span>
        )}
        {feedback === "incorrect" && (
          <span className="text-2xl text-destructive font-bold">✗</span>
        )}
      </div>

      <div className="mt-8 text-xs text-muted-foreground">
        Active keys for this trial: {activeKeys.join(", ")}
      </div>
    </div>
  );
}
