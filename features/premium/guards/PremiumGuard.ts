export class PremiumFeatureError extends Error {
  constructor(featureName: string) {
    super(
      `"${featureName}" is a premium feature. Please upgrade to access this feature.`
    );
    this.name = "PremiumFeatureError";
  }
}

export const guardPremiumFeature = async (
  isPremium: boolean,
  featureName: string
): Promise<void> => {
  if (!isPremium) {
    throw new Error(
      `${featureName} is a premium feature. Please upgrade to access this feature.`
    );
  }
};
