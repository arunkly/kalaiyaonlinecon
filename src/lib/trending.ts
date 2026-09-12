import { createServerFn } from "@tanstack/react-start";

export type TrendingStory = {
  slug: string;
  score: number;
  views: number;
};

export type TrendingTopic = {
  tag: string;
  score: number;
  posts: number;
};

function recencyBoost(createdAt: string) {
  const ageH = Math.max(0, (Date.now() - new Date(createdAt).getTime()) / 36e5);
  return Math.exp(-ageH / 72);
}

function storyScore(views: number, likes: number, comments: number, createdAt: string) {
  return (views + 1) * recencyBoost(createdAt) + likes * 3 + comments * 5;
}

function splitTags(raw: unknown) {
  return String(raw ?? "")
    .split(/[,،،|]+/)
    .map((t) => t.trim().replace(/^#/, ""))
    .filter((t) => t.length >= 2 && t.length <= 32);
}

export const getTrending = createServerFn({ method: "GET" }).handler(async () => {
  const { getSql } = await import("@/lib/db");
  const sql = await getSql();
  try {
    const rows = await sql<{
      slug: string;
      tags: string;
      createdAt: string;
      views: number;
      likes: string;
      comments: string;
    }>`
      select
        s.slug,
        coalesce(s.tags, '') as tags,
        s.created_at as "createdAt",
        coalesce(s.views, 0) as views,
        (select count(*)::text from desk_votes v where v.slug = s.slug and v.value = 1) as likes,
        (select count(*)::text from desk_comments c where c.slug = s.slug) as comments
      from desk_stories s
      where s.deleted_at is null
    `;
    const scored = rows
      .map((r) => ({
        slug: r.slug,
        tags: r.tags,
        views: Number(r.views ?? 0),
        score: storyScore(
          Number(r.views ?? 0),
          Number(r.likes ?? 0),
          Number(r.comments ?? 0),
          r.createdAt,
        ),
      }))
      .sort((a, b) => b.score - a.score);

    const topicMap = new Map<string, { score: number; posts: number }>();
    for (const row of scored) {
      for (const tag of splitTags(row.tags)) {
        const key = tag.toLowerCase();
        const prev = topicMap.get(key) || { score: 0, posts: 0 };
        topicMap.set(key, { score: prev.score + row.score, posts: prev.posts + 1 });
      }
    }
    const topics: TrendingTopic[] = [...topicMap.entries()]
      .map(([tag, v]) => ({ tag, score: v.score, posts: v.posts }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);

    const stories: TrendingStory[] = scored.slice(0, 30).map((r) => ({
      slug: r.slug,
      score: r.score,
      views: r.views,
    }));
    return { stories, topics };
  } catch {
    return { stories: [] as TrendingStory[], topics: [] as TrendingTopic[] };
  }
});
