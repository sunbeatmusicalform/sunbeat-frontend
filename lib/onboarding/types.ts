export const ONBOARDING_OPERATION_TYPES = [
  "label",
  "artist_management",
  "publisher",
  "agency",
  "distributor",
  "independent_artist",
  "other",
] as const;

export const ONBOARDING_TEAM_SIZES = ["1", "2-5", "6-15", "16+"] as const;
export const ONBOARDING_MONTHLY_VOLUMES = ["1-10", "11-50", "51-200", "200+"] as const;
export const ONBOARDING_INTEGRATIONS = [
  "airtable",
  "google_drive",
  "email",
  "slack",
  "webhooks",
] as const;

export type OnboardingOperationType = (typeof ONBOARDING_OPERATION_TYPES)[number];
export type OnboardingTeamSize = (typeof ONBOARDING_TEAM_SIZES)[number];
export type OnboardingMonthlyVolume = (typeof ONBOARDING_MONTHLY_VOLUMES)[number];
export type OnboardingIntegration = (typeof ONBOARDING_INTEGRATIONS)[number];

export type WorkspaceOnboardingProfile = {
  operationType: OnboardingOperationType;
  teamSize: OnboardingTeamSize;
  monthlyVolume: OnboardingMonthlyVolume;
  workflowTypes: string[];
  integrations: OnboardingIntegration[];
  primaryGoal: string;
};

export type OnboardingPreview = {
  workspaceSlug: string;
  planId: string;
  profile: WorkspaceOnboardingProfile;
  enabledWorkflows: string[];
  changes: Array<{
    key: string;
    title: string;
    detail: string;
  }>;
  warnings: string[];
  previewToken: string;
  expiresAt: string;
};

export type OnboardingInitialData = {
  workspaceSlug: string;
  workspaceName: string;
  planId: string;
  allowedWorkflowTypes: string[];
  enabledWorkflowTypes: string[];
  profile: WorkspaceOnboardingProfile;
  completedAt: string | null;
};
