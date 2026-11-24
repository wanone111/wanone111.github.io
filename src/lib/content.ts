import type { CollectionEntry } from 'astro:content';

type PublishableEntry = CollectionEntry<'blog'> | CollectionEntry<'projects'> | CollectionEntry<'pages'>;

export function isPublic(entry: PublishableEntry) {
  return entry.data.visibility === 'public' && ['ready', 'published'].includes(entry.data.status);
}

export function byNewest(a: PublishableEntry, b: PublishableEntry) {
  return b.data.updated.getTime() - a.data.updated.getTime();
}

export const statusLabels = { draft: '草稿', review: '复核中', ready: '待发布', published: '已公开' };

export function byFeaturedOrder(a: CollectionEntry<'projects'>, b: CollectionEntry<'projects'>) {
  const order = (a.data.featured_order ?? Number.MAX_SAFE_INTEGER) - (b.data.featured_order ?? Number.MAX_SAFE_INTEGER);
  return order || byNewest(a, b);
}

const dateFormat = new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium' });

export function formatDate(date: Date) {
  return dateFormat.format(date);
}
