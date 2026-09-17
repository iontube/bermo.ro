// Sursa unica pentru articole. Inlocuieste tokenul {an} din titlu/h1/descriere
// cu anul curent la build, ca sa nu editam manual titlurile la trecerea in noul an.
import { getCollection } from 'astro:content';
import { gasesteCategorie } from './nav.js';

export const AN = String(new Date().getFullYear());
const sub = (s) => (typeof s === 'string' ? s.replaceAll('{an}', AN) : s);

export async function getArticole() {
  const arts = await getCollection('articole');
  for (const a of arts) {
    a.data.titlu = sub(a.data.titlu);
    a.data.h1 = sub(a.data.h1);
    a.data.descriere = sub(a.data.descriere);
    if (Array.isArray(a.data.faq)) a.data.faq = a.data.faq.map((f) => ({ q: sub(f.q), a: sub(f.a) }));
  }
  return arts;
}

// „Citeste si”: intai aceeasi subcategorie, apoi aceeasi categorie, apoi categoriile inrudite
// (in ordinea din nav.js), apoi orice articol. In fiecare treapta, cele mai noi primele.
// Sortarea explicita tine rezultatul la fel pe orice calculator (getCollection nu garanteaza ordinea).
export function similare(a, toate, n = 3) {
  const d = a.data;
  const nouFirst = (x, y) => y.data.data - x.data.data || x.id.localeCompare(y.id);
  const rest = toate.filter((x) => x.id !== a.id).sort(nouFirst);
  const inrudite = gasesteCategorie(d.categorieSlug)?.inrudite ?? [];
  const trepte = [
    (x) => d.subcategorieSlug && x.data.categorieSlug === d.categorieSlug && x.data.subcategorieSlug === d.subcategorieSlug,
    (x) => x.data.categorieSlug === d.categorieSlug,
    ...inrudite.map((slug) => (x) => x.data.categorieSlug === slug),
    () => true,
  ];
  const ales = [];
  for (const potriveste of trepte) {
    for (const x of rest) {
      if (ales.length === n) return ales;
      if (!ales.includes(x) && potriveste(x)) ales.push(x);
    }
  }
  return ales;
}
