import { createFileRoute } from "@tanstack/react-router";
import { ElectionEmbedBoard } from "@/components/election-embed";
import { ElectionProvider, useElection } from "@/lib/election-live";

export const Route = createFileRoute("/election/embed")({ component: EmbedRoute });

function EmbedRoute() {
  return (
    <ElectionProvider>
      <Board />
    </ElectionProvider>
  );
}

function Board() {
  const { data } = useElection();
  return <ElectionEmbedBoard data={data} />;
}
