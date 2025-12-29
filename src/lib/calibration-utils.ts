import { 
  FittsTrialData, 
  HicksTrialData, 
  FittsLawEquation, 
  HicksLawEquation,
  TaskType 
} from "@/types/study";

// Calculate Index of Difficulty for Fitts' Law: ID = log2(D/W + 1)
export function calculateIndexOfDifficulty(distance: number, width: number): number {
  return Math.log2(distance / width + 1);
}

// Linear regression helper
function linearRegression(xValues: number[], yValues: number[]): { a: number; b: number; r2: number } {
  const n = xValues.length;
  if (n < 2) {
    return { a: 0, b: 0, r2: 0 };
  }

  const sumX = xValues.reduce((acc, x) => acc + x, 0);
  const sumY = yValues.reduce((acc, y) => acc + y, 0);
  const sumXY = xValues.reduce((acc, x, i) => acc + x * yValues[i], 0);
  const sumX2 = xValues.reduce((acc, x) => acc + x * x, 0);
  const sumY2 = yValues.reduce((acc, y) => acc + y * y, 0);

  const denominator = n * sumX2 - sumX * sumX;
  if (denominator === 0) {
    return { a: sumY / n, b: 0, r2: 0 };
  }

  const b = (n * sumXY - sumX * sumY) / denominator;
  const a = (sumY - b * sumX) / n;

  // Calculate R² (coefficient of determination)
  const yMean = sumY / n;
  const ssTotal = yValues.reduce((acc, y) => acc + Math.pow(y - yMean, 2), 0);
  const ssResidual = yValues.reduce((acc, y, i) => {
    const predicted = a + b * xValues[i];
    return acc + Math.pow(y - predicted, 2);
  }, 0);
  const r2 = ssTotal > 0 ? 1 - ssResidual / ssTotal : 0;

  return { a, b, r2: Math.max(0, r2) };
}

// Compute Fitts' Law equation from trial data
// MT = a + b * ID where ID = log2(D/W + 1)
export function computeFittsEquation(trials: FittsTrialData[]): FittsLawEquation {
  const successfulTrials = trials.filter(t => t.success);
  if (successfulTrials.length < 3) {
    return { a: 200, b: 150, r2: 0 }; // Default fallback values
  }

  const xValues = successfulTrials.map(t => t.indexOfDifficulty);
  const yValues = successfulTrials.map(t => t.movementTimeMs);

  return linearRegression(xValues, yValues);
}

// Compute Hick's Law equation from trial data
// RT = a + b * log2(n) where n is number of choices
export function computeHicksEquation(trials: HicksTrialData[]): HicksLawEquation {
  const correctTrials = trials.filter(t => t.correct);
  if (correctTrials.length < 3) {
    return { a: 200, b: 150, r2: 0 }; // Default fallback values
  }

  const xValues = correctTrials.map(t => Math.log2(t.numChoices));
  const yValues = correctTrials.map(t => t.reactionTimeMs);

  return linearRegression(xValues, yValues);
}

// Predict movement time using Fitts' Law
export function predictFittsTime(
  equation: FittsLawEquation, 
  distance: number, 
  width: number
): number {
  const id = calculateIndexOfDifficulty(distance, width);
  return Math.max(0, equation.a + equation.b * id);
}

// Predict reaction time using Hick's Law
export function predictHicksTime(equation: HicksLawEquation, numChoices: number): number {
  return Math.max(0, equation.a + equation.b * Math.log2(numChoices));
}

// Get predicted time for a task based on its type
export function getPredictedTimeForTask(
  taskType: TaskType,
  fittsEquation?: FittsLawEquation,
  hicksEquation?: HicksLawEquation
): number | undefined {
  // Default task parameters for predictions
  const taskParams: Record<TaskType, { type: 'fitts' | 'hicks' | 'mixed'; params: any }> = {
    'button-click': {
      type: 'fitts',
      params: { distance: 200, width: 80 } // Typical button parameters
    },
    'drag-drop': {
      type: 'fitts',
      params: { distance: 250, width: 100 } // Drag distance and target size
    },
    'list-select': {
      type: 'mixed',
      params: { 
        fitts: { distance: 150, width: 40 },
        choices: 4 // Number of list options
      }
    },
    'form-input': {
      type: 'mixed',
      params: {
        fitts: { distance: 100, width: 200 },
        choices: 2 // Input + submit
      }
    }
  };

  const config = taskParams[taskType];
  
  if (config.type === 'fitts' && fittsEquation) {
    return Math.round(predictFittsTime(fittsEquation, config.params.distance, config.params.width));
  } else if (config.type === 'hicks' && hicksEquation) {
    return Math.round(predictHicksTime(hicksEquation, config.params.choices));
  } else if (config.type === 'mixed' && fittsEquation && hicksEquation) {
    const fittsTime = predictFittsTime(fittsEquation, config.params.fitts.distance, config.params.fitts.width);
    const hicksTime = predictHicksTime(hicksEquation, config.params.choices);
    return Math.round(fittsTime + hicksTime);
  }
  
  return undefined;
}

// Generate Fitts' Law trial configurations
export function generateFittsTrials(): { width: number; distance: number }[] {
  const widths = [30, 60, 100]; // Target widths in pixels
  const distances = [150, 300, 450]; // Target distances in pixels
  const trials: { width: number; distance: number }[] = [];

  // Create trials for each combination, with repetitions
  for (const width of widths) {
    for (const distance of distances) {
      // 2 repetitions per combination
      trials.push({ width, distance });
      trials.push({ width, distance });
    }
  }

  // Shuffle trials
  return shuffleArray(trials);
}

// Generate Hick's Law trial configurations
export function generateHicksTrials(): {
  numChoices: number;
  targetKey: string;
  rangeStartIndex: number;
}[] {
  const allKeys = ["1", "2", "3", "4", "5", "6", "7"];
  const trials: {
    numChoices: number;
    targetKey: string;
    rangeStartIndex: number;
  }[] = [];

  const choiceLevels = [2, 3, 4, 5, 6, 7];

  for (const numChoices of choiceLevels) {
    for (let rep = 0; rep < 4; rep++) {
      const rangeStartIndex = Math.floor(
        Math.random() * (allKeys.length - numChoices + 1)
      );

      const activeKeys = allKeys.slice(
        rangeStartIndex,
        rangeStartIndex + numChoices
      );

      const targetKey =
        activeKeys[Math.floor(Math.random() * activeKeys.length)];

      trials.push({
        numChoices,
        targetKey,
        rangeStartIndex,
      });
    }
  }

  return shuffleArray(trials);
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
