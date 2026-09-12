import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/share-image/directory/$id")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { proxyDirectoryImage } = await import("@/lib/og-card.server");
        return proxyDirectoryImage(Number(params.id) || 0);
      },
    },
  },
});
