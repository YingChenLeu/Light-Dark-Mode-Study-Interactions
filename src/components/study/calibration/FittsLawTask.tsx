import { useState, useEffect, useCallback, useRef } from "react";
import { FittsTrialData } from "@/types/study";
import { generateFittsTrials, calculateIndexOfDifficulty } from "@/lib/calibration-utils";

interface FittsLawTaskProps {
  onComplete: (trials: FittsTrialData[]) => void;
}

export function FittsLawTask({ onComplete }: FittsLawTaskProps) {
  const [trials] = useState(() => generateFittsTrials());
  const [currentTrialIndex, setCurrentTrialIndex] = useState(0);
  const [results, setResults] = useState<FittsTrialData[]>([]);
  const [activeTarget, setActiveTarget] = useState<"left" | "right">("left");
  const [trialStartTime, setTrialStartTime] = useState<number | null>(null);
  const [isReady, setIsReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentTrial = trials[currentTrialIndex];
  const isComplete = currentTrialIndex >= trials.length;

  // Start the trial when user clicks the first target
  const handleTargetClick = useCallback((clickedTarget: "left" | "right") => {
    if (!isReady) return;
    
    const now = performance.now();

    // If this is the start of a trial (clicking the starting target)
    if (trialStartTime === null) {
      if (clickedTarget === activeTarget) {
        setTrialStartTime(now);
        setActiveTarget(activeTarget === "left" ? "right" : "left");
      }
      return;
    }

    // User is completing the trial by clicking the opposite target
    const isCorrectTarget = clickedTarget === activeTarget;
    const movementTime = Math.round(now - trialStartTime);

    const trialResult: FittsTrialData = {
      trialIndex: currentTrialIndex,
      targetWidth: currentTrial.width,
      targetDistance: currentTrial.distance,
      movementTimeMs: movementTime,
      indexOfDifficulty: calculateIndexOfDifficulty(currentTrial.distance, currentTrial.width),
      success: isCorrectTarget,
      timestamp: new Date().toISOString(),
    };

    setResults(prev => [...prev, trialResult]);

    // Move to next trial
    if (currentTrialIndex < trials.length - 1) {
      setCurrentTrialIndex(currentTrialIndex + 1);
      setTrialStartTime(null);
      setActiveTarget("left");
    } else {
      // Complete
      onComplete([...results, trialResult]);
    }
  }, [isReady, trialStartTime, activeTarget, currentTrialIndex, currentTrial, trials.length, results, onComplete]);

  // Reset ready state for each trial
  useEffect(() => {
    setIsReady(false);
    const timer = setTimeout(() => setIsReady(true), 500);
    return () => clearTimeout(timer);
  }, [currentTrialIndex]);

  if (isComplete) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-foreground">Fitts' Law calibration complete!</p>
      </div>
    );
  }

  const targetStyle = (side: "left" | "right") => ({
    width: `${currentTrial.width}px`,
    height: `${currentTrial.width}px`,
    cursor: isReady ? "pointer" : "default",
    opacity: isReady ? 1 : 0.5,
  });

  return (
    <div className="flex flex-col items-center justify-center h-full p-8" ref={containerRef}>
      <div className="text-center mb-8">
        <h3 className="text-lg font-medium text-foreground mb-2">Fitts' Law Calibration</h3>
        <p className="text-sm text-muted-foreground mb-1">
          Click between the two targets as quickly and accurately as possible.
        </p>
        <p className="text-xs text-muted-foreground">
          Trial {currentTrialIndex + 1} of {trials.length}
        </p>
      </div>

      <div 
        className="relative flex items-center justify-center"
        style={{ width: `${currentTrial.distance + currentTrial.width + 100}px`, height: "200px" }}
      >
        {/* Left Target */}
        <div
          onClick={() => handleTargetClick("left")}
          className={`absolute rounded-sm flex items-center justify-center select-none ${
            activeTarget === "left" 
              ? "bg-primary text-primary-foreground" 
              : "bg-secondary text-secondary-foreground"
          }`}
          style={{
            ...targetStyle("left"),
            left: "0",
          }}
        >
          {activeTarget === "left" && trialStartTime === null && "Start"}
        </div>

        {/* Right Target */}
        <div
          onClick={() => handleTargetClick("right")}
          className={`absolute rounded-sm flex items-center justify-center select-none ${
            activeTarget === "right" 
              ? "bg-primary text-primary-foreground" 
              : "bg-secondary text-secondary-foreground"
          }`}
          style={{
            ...targetStyle("right"),
            right: "0",
          }}
        >
          {activeTarget === "right" && trialStartTime === null && "Start"}
        </div>
      </div>

      <div className="mt-8 text-xs text-muted-foreground">
        {trialStartTime === null 
          ? "Click the highlighted target to begin" 
          : "Now click the other target"}
      </div>
    </div>
  );
}
