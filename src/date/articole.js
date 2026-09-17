// Sursa unica pentru articole. Inlocuieste tokenul {an} din titlu/h1/descriere
// cu anul curent la build, ca sa nu editam manual titlurile la trecerea in noul an.
import { getCollection } from 'astro:content';

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
