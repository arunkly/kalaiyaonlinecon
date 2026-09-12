import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/share-image/article/$slug")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { proxyArticleImage } = await import("@/lib/og-card.server");
        return proxyArticleImage(params.slug);
      },
    },
  },
});
