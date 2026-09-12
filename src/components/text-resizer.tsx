import { Minus, Plus } from "lucide-react";
import { usePrefs } from "@/lib/prefs";
import { cn } from "@/lib/cn";

export function TextResizer() {
  const { textScale, setTextScale } = usePrefs();
  return (
    <div className="inline-flex items-center rounded-full border border-line bg-paper p-1">
      <button
        type="button"
        onClick={() => setTextScale(textScale - 0.1)}
        className="inline-flex size-9 items-center justify-center rounded-full hover:bg-chip"
        aria-label="अक्षर सानो"
      >
        <Minus className="size-4" />
      </button>
      <span className="min-w-10 text-center text-sm font-bold">अ</span>
      <button
        type="button"
        onClick={() => setTextScale(textScale + 0.1)}
        className="inline-flex size-9 items-center justify-center rounded-full hover:bg-chip"
        aria-label="अक्षर ठूलो"
      >
        <Plus className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => setTextScale(1)}
        className={cn(
          "ml-1 rounded-full px-2 py-1 text-[11px] font-semibold",
          textScale === 1 ? "text-muted" : "text-crimson",
        )}
      >
        {Math.round(textScale * 100)}%
      </button>
    </div>
  );
}
