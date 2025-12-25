import { useStudy } from "@/contexts/StudyContext";
import { ConsentScreen } from "./ConsentScreen";
import { InstructionsScreen } from "./InstructionsScreen";
import { CalibrationScreen } from "./calibration/CalibrationScreen";
import { ConditionIntroScreen } from "./ConditionIntroScreen";
import { TaskScreen } from "./TaskScreen";
import { ConditionCompleteScreen } from "./ConditionCompleteScreen";
import { CompletionScreen } from "./CompletionScreen";
import { DebugPanel } from "./DebugPanel";

export function StudyContainer() {
  const { state, setCalibrationData } = useStudy();

  const renderPhase = () => {
    switch (state.phase) {
      case "consent":
        return <ConsentScreen />;
      case "instructions":
        return <InstructionsScreen />;
      case "calibration":
        return (
          <CalibrationScreen 
            participantId={state.participantId}
            onComplete={setCalibrationData}
          />
        );
      case "condition-intro":
        return <ConditionIntroScreen />;
      case "task":
        return <TaskScreen />;
      case "condition-complete":
        return <ConditionCompleteScreen />;
      case "completion":
        return <CompletionScreen />;
      default:
        return <ConsentScreen />;
    }
  };

  return (
    <>
      {renderPhase()}
      <DebugPanel />
    </>
  );
}
