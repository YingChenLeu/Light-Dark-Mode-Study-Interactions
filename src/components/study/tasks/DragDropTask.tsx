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

    acquireDistancePx: number;
    acquireWidthPx: number;
    dragDistancePx: number;
    dropWidthPx: number;
  }) => void;
}

export function DragDropTask({ task, onComplete }: TaskProps) {
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [clicks, setClicks] = useState(0);
  const [incorrectClicks, setIncorrectClicks] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [itemPosition, setItemPosition] = useState({ x: 80, y: 200 });
  const [isInTarget, setIsInTarget] = useState(false);
  const cursorPositions = useRef<{ x: number; y: number }[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const lastYPosition = useRef<number>(200);

  const acquireStartPos = useRef<{ x: number; y: number } | null>(null);
  const itemStartPos = useRef<{ x: number; y: number } | null>(null);

  const acquireDistancePx = useRef<number>(0);
  const dragDistancePx = useRef<number>(0);

  const targetZone = { x: 400, y: 180, width: 120, height: 120 };
  const itemSize = 60;

  useEffect(() => {
    if (!started) return;

    const handleMouseMove = (e: MouseEvent) => {
      cursorPositions.current.push({ x: e.clientX, y: e.clientY });

      if (isDragging && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const newX = e.clientX - rect.left - dragOffset.current.x;
        const newY = e.clientY - rect.top - dragOffset.current.y;
        
        setItemPosition({
          x: Math.max(0, Math.min(newX, rect.width - itemSize)),
          y: Math.max(0, Math.min(newY, rect.height - itemSize)),
        });

        const itemCenterX = newX + itemSize / 2;
        const itemCenterY = newY + itemSize / 2;
        const inTarget = 
          itemCenterX >= targetZone.x && 
          itemCenterX <= targetZone.x + targetZone.width &&
          itemCenterY >= targetZone.y && 
          itemCenterY <= targetZone.y + targetZone.height;
        
        setIsInTarget(inTarget);
      }
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        if (isInTarget && !completed) {
          setCompleted(true);
          lastYPosition.current = 200;
          const endTime = performance.now();

          if (itemStartPos.current) {
            const targetCenterX = targetZone.x + targetZone.width / 2;
            const targetCenterY = targetZone.y + targetZone.height / 2;

            dragDistancePx.current = Math.hypot(
              itemStartPos.current.x - targetCenterX,
              itemStartPos.current.y - targetCenterY
            );
          }
          
          setTimeout(() => {
            onComplete({
              completionTimeMs: Math.round(endTime - startTime),
              totalClicks: clicks,
              incorrectClicks,
              cursorDistancePx: calculateCursorDistance(cursorPositions.current),
              success: true,

              // Fitts phase metrics
              acquireDistancePx: acquireDistancePx.current,
              acquireWidthPx: itemSize,
              dragDistancePx: dragDistancePx.current,
              dropWidthPx: targetZone.width,
            });
          }, 800);
        }
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [started, isDragging, isInTarget, completed, startTime, clicks, incorrectClicks, onComplete]);

  const handleStart = useCallback(() => {
    setStarted(true);
    setStartTime(performance.now());
    cursorPositions.current = [];

    acquireStartPos.current = null;
    itemStartPos.current = null;
    acquireDistancePx.current = 0;
    dragDistancePx.current = 0;

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();

      const minY = lastYPosition.current + 40;
      const maxY = rect.height - itemSize;

      const newY = Math.min(
        maxY,
        Math.max(minY, Math.random() * maxY)
      );

      const newX = Math.random() * (rect.width - itemSize);

      lastYPosition.current = newY;
      setItemPosition({ x: newX, y: newY });
    }
  }, []);

  const handleItemMouseDown = useCallback((e: React.MouseEvent) => {
    if (!started || completed) return;
    e.preventDefault();

    if (!acquireStartPos.current) {
      acquireStartPos.current = { x: e.clientX, y: e.clientY };

      const itemCenterX = itemPosition.x + itemSize / 2;
      const itemCenterY = itemPosition.y + itemSize / 2;

      acquireDistancePx.current = Math.hypot(
        acquireStartPos.current.x - itemCenterX,
        acquireStartPos.current.y - itemCenterY
      );

      itemStartPos.current = { x: itemCenterX, y: itemCenterY };
    }
    
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    
    setIsDragging(true);
    setClicks(prev => prev + 1);
  }, [started, completed, itemPosition]);

  const handleAreaClick = useCallback(() => {
    if (started && !completed && !isDragging) {
      setClicks(prev => prev + 1);
      setIncorrectClicks(prev => prev + 1);
    }
  }, [started, completed, isDragging]);

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
    <div className="flex flex-col items-center h-full space-y-4 pt-4">
      <p className="text-lg font-medium text-foreground">{task.instruction}</p>
      
      <div
        ref={containerRef}
        className="relative w-full max-w-[800px] h-[600px] bg-secondary rounded-lg border border-border"
        onClick={handleAreaClick}
      >
        {/* Target zone */}
        <div
          className={`absolute border-2 border-dashed rounded-lg flex items-center justify-center ${
            isInTarget ? "border-success bg-success/10" : "border-muted-foreground"
          }`}
          style={{
            left: targetZone.x,
            top: targetZone.y,
            width: targetZone.width,
            height: targetZone.height,
          }}
        >
          <span className="text-sm text-muted-foreground">Drop Here</span>
        </div>

        {/* Draggable item */}
        <div
          onMouseDown={handleItemMouseDown}
          className={`absolute rounded-lg flex items-center justify-center cursor-grab select-none ${
            isDragging ? "cursor-grabbing shadow-lg" : ""
          } ${isInTarget && !isDragging ? "bg-success" : "bg-primary"}`}
          style={{
            left: itemPosition.x,
            top: itemPosition.y,
            width: itemSize,
            height: itemSize,
          }}
        >
          <span className="text-sm font-medium text-primary-foreground">Item</span>
        </div>
      </div>
    </div>
  );
}
