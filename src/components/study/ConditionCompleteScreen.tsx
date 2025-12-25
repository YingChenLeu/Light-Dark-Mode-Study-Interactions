import { useStudy } from "@/contexts/StudyContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

export function ConditionCompleteScreen() {
  const { nextPhase, state } = useStudy();
  const isLastCondition = state.currentConditionIndex >= state.conditions.length - 1;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-12 h-12 text-success" />
          </div>
          <CardTitle className="text-xl font-semibold text-center">
            Condition Complete
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <p className="text-muted-foreground">
            You have completed all tasks for condition {state.currentConditionIndex + 1} of {state.conditions.length}.
          </p>

          {!isLastCondition && (
            <p className="text-sm text-muted-foreground">
              Take a brief moment to rest before continuing to the next condition.
            </p>
          )}

          <Button 
            onClick={nextPhase}
            className="w-full"
            size="lg"
          >
            {isLastCondition ? "View Results" : "Continue to Next Condition"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
