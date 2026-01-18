import { useStudy } from "@/contexts/StudyContext";
import { ButtonClickTask } from "./tasks/ButtonClickTask";
import { DragDropTask } from "./tasks/DragDropTask";
import { ListSelectTask } from "./tasks/ListSelectTask";
import { FormInputTask } from "./tasks/FormInputTask";
import { VisualSearchTask } from "./tasks/VisualSearchTask";
import { ChoiceReactionTask } from "./tasks/ChoiceReactionTask";
import { Card, CardContent } from "@/components/ui/card";
import { useCallback } from "react";

export function TaskScreen() {
  const { state, getCurrentTask, getCurrentCondition, recordTaskResult, nextPhase } = useStudy();
  const task = getCurrentTask();
  const condition = getCurrentCondition();

  const handleTaskComplete = useCallback((metrics: {
    completionTimeMs: number;
    totalClicks: number;
    incorrectClicks: number;
    cursorDistancePx: number;
    success: boolean;
  }) => {
    if (!task) return;

    recordTaskResult({
      taskId: task.id,
      taskType: task.type,
      ...metrics,
    });

    nextPhase();
  }, [task, recordTaskResult, nextPhase]);

  if (!task || !condition) return null;

  const TaskComponent = {
    "button-click": ButtonClickTask,
    "drag-drop": DragDropTask,
    "list-select": ListSelectTask,
    "form-input": FormInputTask,
    "visual-search": VisualSearchTask,
    "choice-reaction": ChoiceReactionTask,
  }[task.type];

  return (
    <div className="min-h-screen flex flex-col bg-background p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="text-sm text-muted-foreground">
          Condition {state.currentConditionIndex + 1}/{state.conditions.length}
        </div>
        <div className="text-sm font-medium text-foreground">
          Task {state.currentTaskIndex + 1} of {state.tasks.length}
        </div>
        <div className="text-sm text-muted-foreground font-mono">
          {state.participantId}
        </div>
      </div>

      {/* Task Area */}
      <Card className="flex-1">
        <CardContent className="h-full p-6">
          <TaskComponent 
            key={`${task.id}-${state.currentConditionIndex}`}
            task={task} 
            onComplete={handleTaskComplete} 
          />
        </CardContent>
      </Card>
    </div>
  );
}