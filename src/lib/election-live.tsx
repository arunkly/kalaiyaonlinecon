import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getElectionDesk, syncElectionFeed } from "@/lib/election-desk";
import { election, type ElectionData } from "@/lib/election";

const ElectionCtx = createContext<{
  data: ElectionData;
  refresh: () => Promise<void>;
}>({
  data: election,
  refresh: async () => {},
});

export function ElectionProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<ElectionData>(election);

  async function refresh() {
    try {
      const live = await syncElectionFeed();
      if (live.desk?.constituencies?.length) {
        setData(live.desk);
        return;
      }
      const next = await getElectionDesk();
      if (next?.constituencies?.length) setData(next);
    } catch {
      try {
        const next = await getElectionDesk();
        if (next?.constituencies?.length) setData(next);
      } catch {
        /* keep baseline */
      }
    }
  }

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), 45_000);
    return () => window.clearInterval(id);
  }, []);

  return <ElectionCtx.Provider value={{ data, refresh }}>{children}</ElectionCtx.Provider>;
}

export function useElection() {
  return useContext(ElectionCtx);
}
