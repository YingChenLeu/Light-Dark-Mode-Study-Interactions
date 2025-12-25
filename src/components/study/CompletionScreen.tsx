import { useStudy } from "@/contexts/StudyContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { exportToCSV, exportToJSON, downloadFile } from "@/lib/study-utils";
import { Download, RotateCcw, CheckCircle } from "lucide-react";

export function CompletionScreen() {
  const { state, resetStudy } = useStudy();

  const handleExportCSV = () => {
    const csv = exportToCSV(state.results);
    downloadFile(csv, `study-results-${state.participantId}.csv`, "text/csv");
  };

  const handleExportJSON = () => {
    const json = exportToJSON(state.results, state.participantData);
    downloadFile(json, `study-data-${state.participantId}.json`, "application/json");
  };

  const totalTasks = state.results.length;
  const successfulTasks = state.results.filter(r => r.success).length;
  const avgTime = totalTasks > 0 
    ? Math.round(state.results.reduce((sum, r) => sum + r.completionTimeMs, 0) / totalTasks)
    : 0;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Card className="max-w-lg w-full">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-success" />
          </div>
          <CardTitle className="text-2xl font-semibold text-center">
            Study Complete
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">
              Thank you for participating in this research study.
            </p>
            <p className="text-sm text-muted-foreground font-mono">
              Participant ID: {state.participantId}
            </p>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 py-4">
            <div className="text-center p-3 bg-secondary rounded-lg">
              <div className="text-2xl font-bold text-foreground">{totalTasks}</div>
              <div className="text-xs text-muted-foreground">Tasks</div>
            </div>
            <div className="text-center p-3 bg-secondary rounded-lg">
              <div className="text-2xl font-bold text-foreground">{successfulTasks}</div>
              <div className="text-xs text-muted-foreground">Successful</div>
            </div>
            <div className="text-center p-3 bg-secondary rounded-lg">
              <div className="text-2xl font-bold text-foreground">{avgTime}ms</div>
              <div className="text-xs text-muted-foreground">Avg Time</div>
            </div>
          </div>

          {/* Export Options */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground text-center">Export Data</p>
            <div className="flex gap-3">
              <Button 
                onClick={handleExportCSV}
                variant="outline"
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                CSV
              </Button>
              <Button 
                onClick={handleExportJSON}
                variant="outline"
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                JSON
              </Button>
            </div>
          </div>

          <div className="border-t pt-4">
            <Button 
              onClick={resetStudy}
              variant="secondary"
              className="w-full"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Start New Session
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
