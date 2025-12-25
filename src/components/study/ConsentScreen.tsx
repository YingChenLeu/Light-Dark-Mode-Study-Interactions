import { useStudy } from "@/contexts/StudyContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";

export function ConsentScreen() {
  const { startStudy } = useStudy();
  const [consented, setConsented] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-center">
            Research Study Consent
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4 text-foreground">
            <section>
              <h3 className="font-medium mb-2">Study Purpose</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                This study investigates how different interface color modes (light/dark) 
                and ambient lighting conditions affect human interaction with digital interfaces. 
                Your participation will help improve interface design for diverse environments.
              </p>
            </section>

            <section>
              <h3 className="font-medium mb-2">What You Will Do</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                You will complete simple interaction tasks such as clicking buttons, 
                selecting items from lists, dragging objects, and filling form fields. 
                These tasks will be repeated across four different conditions combining 
                interface modes and simulated room lighting.
              </p>
            </section>

            <section>
              <h3 className="font-medium mb-2">Data Collection</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                We collect only interaction metrics: task completion times, click counts, 
                cursor movement, and task success. All data is anonymous and linked only 
                to a randomly generated participant ID. No personal information is collected.
              </p>
            </section>

            <section>
              <h3 className="font-medium mb-2">Duration</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                The study takes approximately 10-15 minutes to complete.
              </p>
            </section>

            <section>
              <h3 className="font-medium mb-2">Voluntary Participation</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Your participation is voluntary. You may withdraw at any time by closing 
                this browser window. Partial data will not be saved if you withdraw.
              </p>
            </section>
          </div>

          <div className="border-t pt-6">
            <div className="flex items-start space-x-3 mb-6">
              <Checkbox 
                id="consent" 
                checked={consented}
                onCheckedChange={(checked) => setConsented(checked === true)}
                className="mt-0.5"
              />
              <label 
                htmlFor="consent" 
                className="text-sm text-foreground cursor-pointer leading-relaxed"
              >
                I have read and understood the above information. I consent to participate 
                in this study and understand that my interaction data will be collected anonymously.
              </label>
            </div>

            <Button 
              onClick={startStudy}
              disabled={!consented}
              className="w-full"
              size="lg"
            >
              Begin Study
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
