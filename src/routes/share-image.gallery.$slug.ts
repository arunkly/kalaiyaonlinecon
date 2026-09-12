import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/share-image/gallery/$slug")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { proxyGalleryImage } = await import("@/lib/og-card.server");
        return proxyGalleryImage(params.slug);
      },
    },
  },
});
