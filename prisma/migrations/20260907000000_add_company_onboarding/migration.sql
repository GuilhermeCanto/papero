BEGIN;

ALTER TABLE "Company" ADD COLUMN "onboardingCompletedAt" TIMESTAMP(3);

-- Only companies present at deployment are exempt from first-run onboarding.
UPDATE "Company" SET "onboardingCompletedAt" = CURRENT_TIMESTAMP;

COMMIT;
