import { useStudy } from "@/contexts/StudyContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sun, Moon, Lightbulb, LightbulbOff } from "lucide-react";

export function ConditionIntroScreen() {
  const { nextPhase, getCurrentCondition, state } = useStudy();
  const condition = getCurrentCondition();

  if (!condition) return null;

  const InterfaceIcon = condition.interfaceMode === "light" ? Sun : Moon;
  const RoomIcon = condition.roomCondition === "bright" ? Lightbulb : LightbulbOff;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-center">
            Condition {state.currentConditionIndex + 1} of {state.conditions.length}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground text-sm">
              Please prepare for the following condition:
            </p>

            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="flex flex-col items-center p-4 rounded-lg bg-secondary">
                <InterfaceIcon className="w-8 h-8 mb-2 text-foreground" />
                <span className="text-xs text-muted-foreground uppercase tracking-wide">
                  Interface
                </span>
                <span className="font-medium text-foreground capitalize">
                  {condition.interfaceMode} Mode
                </span>
              </div>

              <div className="flex flex-col items-center p-4 rounded-lg bg-secondary">
                <RoomIcon className="w-8 h-8 mb-2 text-foreground" />
                <span className="text-xs text-muted-foreground uppercase tracking-wide">
                  Room
                </span>
                <span className="font-medium text-foreground capitalize">
                  {condition.roomCondition} Room
                </span>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              {condition.roomCondition === "bright" 
                ? "Please ensure your room is well-lit, or imagine a brightly lit environment."
                : "Please dim your room lights, or imagine a dark environment."
              }
            </p>
          </div>

          <Button 
            onClick={nextPhase}
            className="w-full"
            size="lg"
          >
            Begin Tasks
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
