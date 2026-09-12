import { Navigate, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/election/politician/$id")({
  component: function RedirectPol() {
    const { id } = Route.useParams();
    return <Navigate to="/politician/$id" params={{ id }} />;
  },
});
