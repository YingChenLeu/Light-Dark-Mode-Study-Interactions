import { useState, useEffect, useRef, useCallback } from "react";
import { Task } from "@/types/study";
import { Button } from "@/components/ui/button";
import { calculateCursorDistance } from "@/lib/study-utils";

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

const SYMBOLS = ["●", "■", "▲", "◆", "★", "○", "□", "△", "◇", "☆"];
const getRandomTargetSymbol = () =>
  SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
const DISTRACTOR_COUNTS = [4, 8, 12, 16];
const GRID_SIZE = 400;
const CELL_SIZE = 60;

function generateSymbolPositions(
  distractorCount: number,
  targetSymbol: string
): { symbol: string; x: number; y: number; isTarget: boolean }[] {
  const positions: { symbol: string; x: number; y: number; isTarget: boolean }[] = [];
  const usedPositions = new Set<string>();
  const distractorSymbols = SYMBOLS.filter(s => s !== targetSymbol);

  // Add target
  const addPosition = (symbol: string, isTarget: boolean) => {
    let x: number, y: number, key: string;
    do {
      x = Math.floor(Math.random() * (GRID_SIZE / CELL_SIZE)) * CELL_SIZE + CELL_SIZE / 2;
      y = Math.floor(Math.random() * (GRID_SIZE / CELL_SIZE)) * CELL_SIZE + CELL_SIZE / 2;
      key = `${x}-${y}`;
    } while (usedPositions.has(key));
    
    usedPositions.add(key);
    positions.push({ symbol, x, y, isTarget });
  };

  // Add target symbol
  addPosition(targetSymbol, true);

  // Add distractors
  for (let i = 0; i < distractorCount; i++) {
    const symbol = distractorSymbols[Math.floor(Math.random() * distractorSymbols.length)];
    addPosition(symbol, false);
  }

  return positions;
}

export function VisualSearchTask({ task, onComplete }: TaskProps) {
  const [phase, setPhase] = useState<"ready" | "active" | "complete">("ready");
  const [startTime, setStartTime] = useState<number>(0);
  const [clicks, setClicks] = useState(0);
  const [incorrectClicks, setIncorrectClicks] = useState(0);
  const [distractorCount, setDistractorCount] = useState(8);
  const [symbols, setSymbols] = useState<{ symbol: string; x: number; y: number; isTarget: boolean }[]>([]);
  const [targetSymbol, setTargetSymbol] = useState<string>("★");
  
  const cursorPositionsRef = useRef<{ x: number; y: number }[]>([]);

  const handleStart = useCallback(() => {
    const count = DISTRACTOR_COUNTS[Math.floor(Math.random() * DISTRACTOR_COUNTS.length)];
    const target = getRandomTargetSymbol();
    setTargetSymbol(target);
    setDistractorCount(count);
    setSymbols(generateSymbolPositions(count, target));
    setPhase("active");
    setStartTime(performance.now());
    setClicks(0);
    setIncorrectClicks(0);
    cursorPositionsRef.current = [];
  }, []);

  const handleSymbolClick = useCallback((isTarget: boolean) => {
    if (phase !== "active") return;
    
    setClicks(prev => prev + 1);

    if (isTarget) {
      const endTime = performance.now();
      setPhase("complete");
      
      onComplete({
        completionTimeMs: Math.round(endTime - startTime),
        totalClicks: clicks + 1,
        incorrectClicks,
        cursorDistancePx: calculateCursorDistance(cursorPositionsRef.current),
        success: true,
      });
    } else {
      setIncorrectClicks(prev => prev + 1);
    }
  }, [phase, startTime, clicks, incorrectClicks, onComplete]);

  const handleAreaClick = useCallback(() => {
    if (phase === "active") {
      setClicks(prev => prev + 1);
      setIncorrectClicks(prev => prev + 1);
    }
  }, [phase]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (phase === "active") {
        cursorPositionsRef.current.push({ x: e.clientX, y: e.clientY });
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [phase]);

  if (phase === "ready") {
    return (
      <div className="flex flex-col items-center justify-start h-full space-y-6 pt-24">
        <p className="text-lg text-foreground text-center max-w-md">
          {task.instruction || `Find and click the target symbol: ${targetSymbol}`}
        </p>
        <p className="text-sm text-muted-foreground text-center">
          Multiple symbols will appear. Click the star (★) as quickly as possible.
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
          Target found!
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-start h-full space-y-4 pt-24">
      <p className="text-sm text-muted-foreground">
        Find the target: <span className="text-2xl">{targetSymbol}</span>
      </p>
      <div 
        className="relative bg-muted/30 border border-border rounded-lg"
        style={{ width: GRID_SIZE, height: GRID_SIZE }}
        onClick={handleAreaClick}
      >
        {symbols.map((item, index) => (
          <button
            key={index}
            className="absolute text-3xl cursor-pointer transition-transform hover:scale-110 focus:outline-none text-foreground"
            style={{
              left: item.x - 15,
              top: item.y - 15,
              width: 30,
              height: 30,
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleSymbolClick(item.isTarget);
            }}
          >
            {item.symbol}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Distractors: {distractorCount} | Clicks: {clicks}
      </p>
    </div>
  );
}