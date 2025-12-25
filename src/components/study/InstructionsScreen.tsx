import { useStudy } from "@/contexts/StudyContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function InstructionsScreen() {
  const { nextPhase, state } = useStudy();

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-center">
            Study Instructions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center text-sm text-muted-foreground mb-4">
            Participant ID: <span className="font-mono">{state.participantId}</span>
          </div>

          <div className="space-y-4 text-foreground">
            <section>
              <h3 className="font-medium mb-2">How This Works</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                You will complete a series of simple interaction tasks across four different 
                conditions. Each condition combines an interface color mode (light or dark) 
                with a simulated room lighting condition.
              </p>
            </section>

            <section>
              <h3 className="font-medium mb-2">Task Types</h3>
              <ul className="text-muted-foreground text-sm space-y-1 list-disc list-inside">
                <li>Clicking specific buttons</li>
                <li>Dragging items to target areas</li>
                <li>Selecting options from lists</li>
                <li>Filling in form fields</li>
              </ul>
            </section>

            <section>
              <h3 className="font-medium mb-2">Important Guidelines</h3>
              <ul className="text-muted-foreground text-sm space-y-1 list-disc list-inside">
                <li>Complete each task as quickly and accurately as possible</li>
                <li>Read task instructions carefully before starting</li>
                <li>Each task begins when you click "Start Task"</li>
                <li>A confirmation will appear when a task is completed correctly</li>
                <li>Work at your natural pace—there is no time pressure</li>
              </ul>
            </section>

            <section>
              <h3 className="font-medium mb-2">Calibration Phase</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                First, you will complete a brief calibration to measure your baseline 
                performance. This includes a pointing task (Fitts' Law) and a reaction 
                time task (Hick's Law). Your personalized models will predict your 
                performance on subsequent tasks.
              </p>
            </section>

            <section>
              <h3 className="font-medium mb-2">Condition Changes</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                After calibration, you will complete tasks across four conditions. 
                The interface color will change automatically between conditions.
              </p>
            </section>
          </div>

          <div className="border-t pt-6">
            <Button 
              onClick={nextPhase}
              className="w-full"
              size="lg"
            >
              Begin Calibration
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
