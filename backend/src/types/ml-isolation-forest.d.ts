declare module "ml-isolation-forest" {
  export interface IsolationForestOptions {
    nEstimators?: number;
    maxSamples?: number;
    contamination?: number;
    maxFeatures?: number;
    randomState?: number;
  }

  export interface TrainResult {
    anomalyScore(sample: number[]): number;
    predict(sample: number[]): number;
  }

  export default class IsolationForest {
    constructor(options?: IsolationForestOptions);
    fit(data: number[][]): void;
    predict(data: number[][]): number[];
    anomalyScore(data: number[][]): number[];
  }
}
