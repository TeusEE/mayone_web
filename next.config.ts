import type { NextConfig } from "next";

const mockEnrollmentDeployment = process.env.NODE_ENV === "development" || process.env.VERCEL_ENV === "preview";
const mockOfferFixture = "./src/content/fixtures/class-offers.csv";
const mockOfferRoutes = {
  "/": [mockOfferFixture],
  "/haru/classes": [mockOfferFixture],
  "/haru/classes/*": [mockOfferFixture],
  "/haru/apply": [mockOfferFixture],
};
const localApplicantDataRoutes = {
  "/*": ["./.local-data/**/*"],
};

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  ...(mockEnrollmentDeployment
    ? {
        outputFileTracingIncludes: mockOfferRoutes,
        outputFileTracingExcludes: localApplicantDataRoutes,
      }
    : {
        outputFileTracingExcludes: { ...mockOfferRoutes, ...localApplicantDataRoutes },
      }),
};

export default nextConfig;
