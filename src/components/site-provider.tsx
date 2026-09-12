import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { DEFAULT_SITE, getSiteIdentity, type SiteIdentity } from "@/lib/site";

const Ctx = createContext<SiteIdentity>(DEFAULT_SITE);

export function SiteProvider({
  children,
  initial,
}: {
  children: ReactNode;
  initial?: SiteIdentity;
}) {
  const [site, setSite] = useState<SiteIdentity>(initial ?? DEFAULT_SITE);

  useEffect(() => {
    void getSiteIdentity()
      .then(setSite)
      .catch(() => undefined);
  }, []);

  return <Ctx.Provider value={site}>{children}</Ctx.Provider>;
}

export function useSite() {
  return useContext(Ctx);
}
