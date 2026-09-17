import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const articole = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/continut/articole' }),
  schema: z.object({
    titlu: z.string(),
    descriere: z.string(),
    h1: z.string().optional(),
    categorie: z.string(),
    categorieSlug: z.string(),
    subcategorie: z.string().optional(),
    subcategorieSlug: z.string().optional(),
    data: z.coerce.date(),
    modificat: z.coerce.date().optional(),
    autor: z.string().default('Redactia bermo'),
    autorRol: z.string().default('Analiza produse'),
    imagine: z.string().optional(),
    minute: z.number().default(8),
    destacat: z.boolean().default(false),
    faq: z.array(z.object({ q: z.string(), a: z.string() })).optional(),
  }),
});

export const collections = { articole };
