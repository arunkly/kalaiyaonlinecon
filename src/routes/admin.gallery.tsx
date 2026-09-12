import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/gallery")({
  component: () => <Navigate to="/admin" />,
});
