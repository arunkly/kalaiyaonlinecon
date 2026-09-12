import { Link } from "@tanstack/react-router";
import { useSite } from "@/components/site-provider";
import type { Article } from "@/data/articles";
import { cn } from "@/lib/cn";

export function AuthorByline({
  article,
  className,
}: {
  article: Pick<Article, "author" | "authorId" | "authorPhoto">;
  className?: string;
}) {
  const site = useSite();
  const name = article.author?.trim() || site.nameNp || site.name;
  const photo = article.authorPhoto?.trim();
  const inner = (
    <span className={cn("inline-flex items-center gap-2 font-bold text-crimson", className)}>
      {photo ? (
        <img src={photo} alt="" className="size-7 rounded-full object-cover ring-1 ring-crimson/20" />
      ) : (
        <img src="/logo.jpg" alt="" className="size-7 rounded-full object-cover ring-1 ring-crimson/20" />
      )}
      {name}
    </span>
  );
  if (article.authorId) {
    return (
      <Link to="/member/$id" params={{ id: article.authorId }} className="hover:underline">
        {inner}
      </Link>
    );
  }
  return inner;
}
