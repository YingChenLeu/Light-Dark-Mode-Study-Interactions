import { useStudy } from "@/contexts/StudyContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, SkipForward, Sun, Moon } from "lucide-react";

export function DebugPanel() {
  const { state, debugMode, setDebugMode, nextPhase, getCurrentCondition } = useStudy();
  const condition = getCurrentCondition();

  if (!debugMode) {
    return (
      <Button
        onClick={() => setDebugMode(true)}
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 opacity-50 hover:opacity-100 z-50"
      >
        Debug
      </Button>
    );
  }

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle("dark");
  };

  return (
    <Card className="fixed bottom-4 right-4 w-80 shadow-lg z-50">
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">Debug Panel</CardTitle>
        <Button
          onClick={() => setDebugMode(false)}
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
        >
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="py-3 px-4 space-y-3 text-xs">
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Phase:</span>
            <span className="font-mono">{state.phase}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Participant:</span>
            <span className="font-mono">{state.participantId || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Condition:</span>
            <span className="font-mono">{state.currentConditionIndex + 1}/{state.conditions.length || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Task:</span>
            <span className="font-mono">{state.currentTaskIndex + 1}/{state.tasks.length || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Results:</span>
            <span className="font-mono">{state.results.length}</span>
          </div>
          {condition && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current:</span>
              <span className="font-mono text-right truncate max-w-[150px]">
                {condition.interfaceMode}/{condition.roomCondition}
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2 border-t">
          <Button
            onClick={nextPhase}
            variant="outline"
            size="sm"
            className="flex-1 text-xs h-7"
            disabled={state.phase === "consent" || state.phase === "completion"}
          >
            <SkipForward className="w-3 h-3 mr-1" />
            Skip
          </Button>
          <Button
            onClick={toggleDarkMode}
            variant="outline"
            size="sm"
            className="flex-1 text-xs h-7"
          >
            <Sun className="w-3 h-3 mr-1 dark:hidden" />
            <Moon className="w-3 h-3 mr-1 hidden dark:block" />
            Toggle
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
