export type PlanId = "MONTHLY" | "ANNUAL";

interface BasePlan {
  id: string;
  name: string;
  price: number;
  period: "month" | "year";
  features: readonly string[];
  stripePriceId: string;
}

interface MonthlyPlan extends BasePlan {
  period: "month";
}

interface AnnualPlan extends BasePlan {
  period: "year";
  savings: string;
}

// Only export the plans we want to use
export const SUBSCRIPTION_PLANS = {
  MONTHLY: {
    id: "price_monthly",
    name: "Monthly Premium",
    price: 4.99,
    period: "month",
    features: [
      "AI-powered definition improvements",
      "Smart study recommendations",
      "Performance analytics",
      "Unlimited flashcards",
      "Ad-free experience",
      "Priority support",
    ],
    stripePriceId: "price_monthly_xxx",
  } as MonthlyPlan,

  ANNUAL: {
    id: "price_annual",
    name: "Annual Premium",
    price: 39.99,
    period: "year",
    features: [
      "All Monthly Premium features",
      "2 months free",
      "Advanced study analytics",
      "Export capabilities",
      "Early access to new features",
    ],
    stripePriceId: "price_annual_xxx",
    savings: "33%",
  } as AnnualPlan,
} as const;
