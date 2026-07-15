import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

const publishingStatus = z.enum(['draft', 'review', 'ready', 'published']);
const visibility = z.enum(['private', 'public']);

const sharedSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  status: publishingStatus.default('published'),
  visibility: visibility.default('public'),
  slug: z.string().min(1),
  created: z.coerce.date(),
  updated: z.coerce.date(),
  published: z.coerce.date().optional(),
  tags: z.array(z.string()).default([]),
  category: z.string().optional(),
  cover: z.string().optional(),
  featured: z.boolean().default(false),
  problem: z.string().optional(),
  environment: z.string().optional(),
  conclusion: z.string().optional(),
  applicable_version: z.string().optional(),
  verified: z.coerce.date().optional(),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/generated/blog' }),
  schema: sharedSchema.extend({ content_type: z.literal('blog') }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/generated/projects' }),
  schema: sharedSchema.extend({
    content_type: z.literal('project'),
    featured_order: z.number().int().positive().optional(),
    time_range: z.string().optional(),
    role: z.string().optional(),
    hardware: z.string().optional(),
    software: z.string().optional(),
    stack: z.array(z.string()).default([]),
    result: z.string().optional(),
    limitations: z.string().optional(),
    next_step: z.string().optional(),
    validation: z.string().optional(),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/generated/pages' }),
  schema: sharedSchema.extend({ content_type: z.literal('page') }),
});

export const collections = {
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
  blog,
  projects,
  pages,
};
