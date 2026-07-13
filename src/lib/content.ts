import type { CollectionEntry } from 'astro:content';

type PublishableEntry = CollectionEntry<'blog'> | CollectionEntry<'projects'> | CollectionEntry<'pages'>;

export function isPublic(entry: PublishableEntry) {
  return entry.data.visibility === 'public' && ['ready', 'published'].includes(entry.data.status);
}

export function byNewest(a: PublishableEntry, b: PublishableEntry) {
  return b.data.updated.getTime() - a.data.updated.getTime();
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium' }).format(date);
}
