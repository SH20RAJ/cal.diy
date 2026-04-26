vi.mock("@calcom/lib/next-seo.config", () => ({
  default: {
    headSeo: {
      siteName: "CreatorCall",
    },
    defaultNextSeo: {
      title: "CreatorCall",
      description: "Scheduling infrastructure for everyone.",
    },
  },
  seoConfig: {
    headSeo: {
      siteName: "CreatorCall",
    },
  },
  buildSeoMeta: vi.fn().mockReturnValue({}),
}));
