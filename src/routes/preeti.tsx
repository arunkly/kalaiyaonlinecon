import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { preetiToUnicode, unicodeToPreeti } from "@/lib/preeti";
import { cn } from "@/lib/cn";

export const Route = createFileRoute("/preeti")({ component: PreetiPage });

function PreetiPage() {
  const [tab, setTab] = useState<"p2u" | "u2p">("p2u");
  const [source, setSource] = useState("");
  const out = useMemo(
    () => (tab === "p2u" ? preetiToUnicode(source) : unicodeToPreeti(source)),
    [tab, source],
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="kicker">फन्ट</p>
        <h1 className="mt-2 font-display text-4xl font-bold">प्रीति कन्भर्टर</h1>
        <p className="mt-2 text-sm text-muted">प्रीति र युनिकोड एक अर्कामा बदल्नुहोस्।</p>
      </div>

      <div className="grid grid-cols-2 rounded-full border border-line bg-paper p-1 text-sm font-semibold">
        <button
          type="button"
          onClick={() => {
            setTab("p2u");
            setSource("");
          }}
          className={cn("rounded-full py-2", tab === "p2u" ? "bg-crimson text-paper" : "text-muted")}
        >
          प्रीति → युनिकोड
        </button>
        <button
          type="button"
          onClick={() => {
            setTab("u2p");
            setSource("");
          }}
          className={cn("rounded-full py-2", tab === "u2p" ? "bg-crimson text-paper" : "text-muted")}
        >
          युनिकोड → प्रीति
        </button>
      </div>

      <section className="rounded-2xl border border-line bg-white p-5">
        <label className="block text-sm font-medium">
          {tab === "p2u" ? "प्रीतिमा लेख्नुहोस्" : "युनिकोडमा लेख्नुहोस्"}
          <textarea
            value={source}
            onChange={(e) => setSource(e.target.value)}
            rows={7}
            className="mt-2 w-full rounded-xl border border-line bg-paper px-3 py-3 outline-none focus:border-crimson"
            placeholder={tab === "p2u" ? "g]kfn" : "नेपाल"}
          />
        </label>
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm font-medium">{tab === "p2u" ? "युनिकोड" : "प्रीति"}</p>
          <button
            type="button"
            className="text-sm font-semibold text-crimson"
            onClick={() => {
              if (out) void navigator.clipboard.writeText(out);
            }}
          >
            कपी
          </button>
        </div>
        <p className="mt-2 min-h-24 whitespace-pre-wrap rounded-xl bg-[#E8F5E9] px-3 py-3 font-display text-lg">
          {out || "—"}
        </p>
      </section>
    </div>
  );
}
