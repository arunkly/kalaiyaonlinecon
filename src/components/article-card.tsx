import { Link } from "@tanstack/react-router";
import { Clock, MessageSquare } from "lucide-react";
import { displayTitle, toNpDigits, type Article } from "@/data/articles";
import { formatBsDateTime } from "@/lib/bs-date";
import { cn } from "@/lib/cn";
import { categoryLabel, useCategories } from "@/lib/use-categories";
import { NewsTitle } from "@/components/news-title";
import { AuthorByline } from "@/components/author-byline";

export function ArticleCard({
  article,
  variant = "standard",
  rank,
  comments = 0,
}: {
  article: Article;
  variant?: "hero" | "headline" | "lead" | "standard" | "compact" | "text";
  rank?: number;
  comments?: number;
}) {
  const cats = useCategories();
  const label = categoryLabel(cats, article.category);
  const title = displayTitle(article);
  const date = formatBsDateTime(article.date);

  if (variant === "headline") {
    return (
      <Link
        to="/article/$slug"
        params={{ slug: article.slug }}
        className="group block bg-surface"
      >
        <h2 className="text-center font-display text-[1.85rem] font-extrabold leading-[1.25] text-ink sm:text-[2.15rem]">
          <NewsTitle text={title} />
        </h2>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted">
          <AuthorByline article={article} />
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-4" />
            {date}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MessageSquare className="size-4" />
            {toNpDigits(comments)}
          </span>
        </div>
        {article.imageUrl ? (
          <img
            src={article.imageUrl}
            alt=""
            className="mt-6 aspect-[16/10] w-full object-cover"
          />
        ) : (
          <div className="mt-6 aspect-[16/10] w-full bg-gradient-to-br from-crimson to-ink" />
        )}
      </Link>
    );
  }

  if (variant === "hero") {
    return (
      <Link
        to="/article/$slug"
        params={{ slug: article.slug }}
        className="group relative isolate block min-h-80 overflow-hidden rounded-lg bg-ink text-paper sm:min-h-[30rem]"
      >
        {article.imageUrl ? (
          <img
            src={article.imageUrl}
            alt=""
            className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-crimson to-ink" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-transparent" />
        <div className="relative flex min-h-80 flex-col justify-end p-5 sm:min-h-[30rem] sm:p-8">
          <span className="w-fit bg-mark px-2.5 py-0.5 text-[11px] font-extrabold tracking-[0.14em] text-ink">
            हेडलाइन
          </span>
          <h2 className="mt-3 font-display text-3xl font-extrabold leading-[1.15] sm:text-5xl"><NewsTitle text={title} /></h2>
          {article.excerpt ? (
            <p className="mt-3 max-w-2xl line-clamp-2 text-sm text-paper/80 sm:text-base">{article.excerpt}</p>
          ) : null}
          <p className="mt-4 text-xs font-medium text-paper/65">
            {label} · {date}
          </p>
        </div>
      </Link>
    );
  }

  if (variant === "lead") {
    return (
      <Link
        to="/article/$slug"
        params={{ slug: article.slug }}
        className="group grid overflow-hidden rounded-lg border border-line bg-surface sm:grid-cols-2"
      >
        <div className="relative min-h-44 bg-chip sm:min-h-[17rem]">
          {article.imageUrl ? (
            <img
              src={article.imageUrl}
              alt=""
              className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-crimson to-crimson-deep" />
          )}
        </div>
        <div className="flex flex-col justify-center p-4 sm:p-6">
          <p className="text-[11px] font-bold tracking-[0.16em] text-crimson">{label}</p>
          <h3 className="mt-2 font-display text-2xl font-extrabold leading-snug group-hover:text-crimson sm:text-3xl">
            <NewsTitle text={title} />
          </h3>
          {article.excerpt ? (
            <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-soft">{article.excerpt}</p>
          ) : null}
          <p className="mt-3 text-xs text-muted">{date}</p>
        </div>
      </Link>
    );
  }

  if (variant === "standard") {
    return (
      <Link
        to="/article/$slug"
        params={{ slug: article.slug }}
        className="group overflow-hidden rounded-lg border border-line bg-surface"
      >
        {article.imageUrl ? (
          <img src={article.imageUrl} alt="" className="h-44 w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : null}
        <div className="p-4">
          <p className="text-[11px] font-bold tracking-[0.16em] text-crimson">{label}</p>
          <h3 className="mt-1 font-display text-xl font-bold leading-snug group-hover:text-crimson"><NewsTitle text={title} /></h3>
          <p className="mt-2 text-xs text-muted">{date}</p>
        </div>
      </Link>
    );
  }

  if (variant === "compact" || variant === "text") {
    return (
      <Link
        to="/article/$slug"
        params={{ slug: article.slug }}
        className="group grid grid-cols-[auto_auto_1fr] items-start gap-3 border-b border-line py-3 last:border-b-0"
      >
        {typeof rank === "number" ? (
          <span className="w-7 pt-0.5 font-display text-xl font-extrabold leading-none text-crimson">
            {toNpDigits(rank)}
          </span>
        ) : null}
        {article.imageUrl && variant === "compact" ? (
          <img
            src={article.imageUrl}
            alt=""
            className="size-16 rounded-md object-cover sm:size-[4.5rem]"
          />
        ) : (
          <span className="hidden" />
        )}
        <span>
          <p className="text-[11px] font-bold tracking-[0.14em] text-crimson">{label}</p>
          <h3 className="mt-0.5 font-display text-lg font-bold leading-snug group-hover:text-crimson sm:text-xl">
            <NewsTitle text={title} />
          </h3>
          {variant === "text" ? (
            <p className="mt-1 line-clamp-2 text-sm text-muted">{article.excerpt}</p>
          ) : null}
          <p className="mt-1 text-xs text-muted">{date}</p>
        </span>
      </Link>
    );
  }

  return (
    <Link
      to="/article/$slug"
      params={{ slug: article.slug }}
      className={cn("group card-lift flex h-full flex-col overflow-hidden rounded-lg border border-line bg-surface")}
    >
      <div className="relative overflow-hidden bg-chip">
        {article.imageUrl ? (
          <img
            src={article.imageUrl}
            alt=""
            className="h-44 w-full object-cover transition-transform duration-500 group-hover:scale-105 sm:h-48"
          />
        ) : (
          <div className="h-28 bg-gradient-to-br from-crimson to-crimson-deep" />
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-[11px] font-bold tracking-[0.16em] text-crimson">
          {label}
          {article.breaking ? " · ब्रेकिङ" : ""}
        </p>
        <h3 className="mt-2 font-display text-xl font-bold leading-snug group-hover:text-crimson"><NewsTitle text={title} /></h3>
        <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-ink-soft">{article.excerpt}</p>
        <p className="mt-3 text-xs text-muted">
          {article.location} · {date}
        </p>
      </div>
    </Link>
  );
}
