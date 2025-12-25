import { useState } from "react";
import { FittsTrialData, HicksTrialData, CalibrationData } from "@/types/study";
import { FittsLawTask } from "./FittsLawTask";
import { HicksLawTask } from "./HicksLawTask";
import { computeFittsEquation, computeHicksEquation } from "@/lib/calibration-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type CalibrationPhase = "intro" | "fitts-intro" | "fitts" | "hicks-intro" | "hicks" | "results";

interface CalibrationScreenProps {
  participantId: string;
  onComplete: (data: CalibrationData) => void;
}

export function CalibrationScreen({ participantId, onComplete }: CalibrationScreenProps) {
  const [phase, setPhase] = useState<CalibrationPhase>("intro");
  const [fittsTrials, setFittsTrials] = useState<FittsTrialData[]>([]);
  const [hicksTrials, setHicksTrials] = useState<HicksTrialData[]>([]);

  const handleFittsComplete = (trials: FittsTrialData[]) => {
    setFittsTrials(trials);
    setPhase("hicks-intro");
  };

  const handleHicksComplete = (trials: HicksTrialData[]) => {
    setHicksTrials(trials);
    setPhase("results");
  };

  const handleFinish = () => {
    const fittsEquation = computeFittsEquation(fittsTrials);
    const hicksEquation = computeHicksEquation(hicksTrials);

    const calibrationData: CalibrationData = {
      fittsTrials,
      hicksTrials,
      fittsEquation,
      hicksEquation,
      calibrationComplete: true,
    };

    onComplete(calibrationData);
  };

  const fittsEquation = fittsTrials.length > 0 ? computeFittsEquation(fittsTrials) : null;
  const hicksEquation = hicksTrials.length > 0 ? computeHicksEquation(hicksTrials) : null;

  if (phase === "intro") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <Card className="max-w-2xl w-full">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-center">
              Calibration Phase
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center text-sm text-muted-foreground mb-4">
              Participant ID: <span className="font-mono">{participantId}</span>
            </div>

            <div className="space-y-4 text-foreground">
              <p className="text-muted-foreground leading-relaxed">
                Before the main study begins, we need to collect baseline data to create 
                personalized performance models. This calibration consists of two short activities:
              </p>

              <div className="space-y-4">
                <section className="p-4 bg-secondary rounded-lg">
                  <h3 className="font-medium mb-2">1. Fitts' Law Activity</h3>
                  <p className="text-sm text-muted-foreground">
                    Click between two targets that vary in size and distance. This measures 
                    your pointing accuracy and speed.
                  </p>
                </section>

                <section className="p-4 bg-secondary rounded-lg">
                  <h3 className="font-medium mb-2">2. Hick's Law Activity</h3>
                  <p className="text-sm text-muted-foreground">
                    Respond to visual cues by pressing keyboard keys. This measures your 
                    reaction time based on the number of choices.
                  </p>
                </section>
              </div>

              <p className="text-sm text-muted-foreground">
                The calibration will take approximately 3-5 minutes. Your personalized 
                equations will be used to predict your performance on subsequent tasks.
              </p>
            </div>

            <Button onClick={() => setPhase("fitts-intro")} className="w-full" size="lg">
              Begin Calibration
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === "fitts-intro") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <Card className="max-w-lg w-full">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-center">
              Fitts' Law Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4 text-foreground">
              <p className="text-muted-foreground leading-relaxed">
                Two rectangular targets will appear on screen. Click back and forth 
                between them as quickly and accurately as possible.
              </p>
              <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
                <li>Target size and distance will vary between trials</li>
                <li>Click the highlighted target to start each trial</li>
                <li>Then click the opposite target to complete it</li>
                <li>Work as fast as you can while staying accurate</li>
              </ul>
            </div>

            <Button onClick={() => setPhase("fitts")} className="w-full" size="lg">
              Start Fitts' Law Activity
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === "fitts") {
    return (
      <div className="min-h-screen bg-background">
        <FittsLawTask onComplete={handleFittsComplete} />
      </div>
    );
  }

  if (phase === "hicks-intro") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <Card className="max-w-lg w-full">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-center">
              Hick's Law Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center text-sm text-success mb-4">
              ✓ Fitts' Law activity complete!
            </div>

            <div className="space-y-4 text-foreground">
              <p className="text-muted-foreground leading-relaxed">
                Place your left hand on the A, S, D, and F keys. When a letter appears 
                on screen, press the corresponding key as quickly as possible.
              </p>
              <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
                <li>Press Space to start each trial</li>
                <li>Wait for a letter to appear</li>
                <li>The number of active keys may vary</li>
                <li>Respond as quickly and accurately as possible</li>
              </ul>
            </div>

            <Button onClick={() => setPhase("hicks")} className="w-full" size="lg">
              Start Hick's Law Activity
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === "hicks") {
    return (
      <div className="min-h-screen bg-background">
        <HicksLawTask onComplete={handleHicksComplete} />
      </div>
    );
  }

  // Results phase
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-center">
            Calibration Complete
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground text-center">
            Your personalized performance models have been calculated.
          </p>

          {/* Fitts' Law Results */}
          <div className="p-4 bg-secondary rounded-lg">
            <h3 className="font-medium mb-3">Fitts' Law Model</h3>
            <p className="text-xs text-muted-foreground mb-2">
              MT = a + b × log₂(D/W + 1)
            </p>
            {fittsEquation && (
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="text-center p-2 bg-background rounded">
                  <div className="font-mono font-bold">{fittsEquation.a.toFixed(0)}</div>
                  <div className="text-xs text-muted-foreground">a (ms)</div>
                </div>
                <div className="text-center p-2 bg-background rounded">
                  <div className="font-mono font-bold">{fittsEquation.b.toFixed(0)}</div>
                  <div className="text-xs text-muted-foreground">b (ms/bit)</div>
                </div>
                <div className="text-center p-2 bg-background rounded">
                  <div className="font-mono font-bold">{fittsEquation.r2.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">R²</div>
                </div>
              </div>
            )}
          </div>

          {/* Hick's Law Results */}
          <div className="p-4 bg-secondary rounded-lg">
            <h3 className="font-medium mb-3">Hick's Law Model</h3>
            <p className="text-xs text-muted-foreground mb-2">
              RT = a + b × log₂(n)
            </p>
            {hicksEquation && (
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="text-center p-2 bg-background rounded">
                  <div className="font-mono font-bold">{hicksEquation.a.toFixed(0)}</div>
                  <div className="text-xs text-muted-foreground">a (ms)</div>
                </div>
                <div className="text-center p-2 bg-background rounded">
                  <div className="font-mono font-bold">{hicksEquation.b.toFixed(0)}</div>
                  <div className="text-xs text-muted-foreground">b (ms/bit)</div>
                </div>
                <div className="text-center p-2 bg-background rounded">
                  <div className="font-mono font-bold">{hicksEquation.r2.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">R²</div>
                </div>
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground text-center">
            These equations will be used to predict your performance on upcoming tasks.
          </p>

          <Button onClick={handleFinish} className="w-full" size="lg">
            Continue to Study
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
