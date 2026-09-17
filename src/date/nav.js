// bermo.ro — structura de categorii si navigare (RO, sursa unica)

const ic = {
  telefoane: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/></svg>',
  electrocasnice: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M9 12h.01"/></svg>',
  it: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M2 20h20"/></svg>',
  bucatarie: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 6h16M4 6l1.5 13h13L20 6M9 10v5M15 10v5"/></svg>',
  tv: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8"/></svg>',
  casa: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 20V9l8-5 8 5v11M9 20v-6h6v6"/></svg>',
  auto: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 17h14M3 17v-4l2.5-5h13L21 13v4"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="16.5" cy="17.5" r="1.5"/></svg>',
  ingrijire: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 3h6v4H9zM8 7h8l1 3v10a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V10z"/><path d="M10 14h4"/></svg>',
  iluminat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.5.4.8 1 .8 1.6v.5h5.4v-.5c0-.6.3-1.2.8-1.6A6 6 0 0 0 12 3Z"/></svg>',
};

const sub = (nume, slug) => ({ nume, slug });

// sursa unica de adevar pentru categorii
// inrudite = categoriile din care completam „Citeste si” cand categoria articolului nu are destule articole
export const categorii = [
  {
    slug: 'telefoane', nume: 'Telefoane', numar: '168 articole', icon: ic.telefoane,
    inrudite: ['it-si-laptop', 'tv-si-foto'],
    descriere: 'Articole si comparatii pentru smartphone-uri si accesorii, alese pe recenzii reale si raport pret-calitate.',
    subcategorii: [sub('Smartphone', 'smartphone'), sub('Casti', 'casti'), sub('Huse', 'huse'), sub('Incarcatoare', 'incarcatoare')],
  },
  {
    slug: 'electrocasnice', nume: 'Electrocasnice', numar: '210 articole', icon: ic.electrocasnice,
    inrudite: ['bucatarie', 'casa-si-gradina'],
    descriere: 'Articole si comparatii pentru masini de spalat, frigidere, aspiratoare si tot ce tine casa in miscare. Alegem pe consum, fiabilitate si raport pret-calitate, pe baza de recenzii reale.',
    subcategorii: [sub('Masini de spalat', 'masini-de-spalat'), sub('Frigidere', 'frigidere'), sub('Aspiratoare robot', 'aspiratoare-robot'), sub('Aspiratoare', 'aspiratoare'), sub('Uscatoare', 'uscatoare'), sub('Plite', 'plite')],
  },
  {
    slug: 'it-si-laptop', nume: 'IT si Laptop', numar: '142 articole', icon: ic.it,
    inrudite: ['telefoane', 'tv-si-foto'],
    descriere: 'Laptopuri, componente si periferice pe intelesul tuturor. Ce conteaza cu adevarat la performanta si ce e doar marketing.',
    subcategorii: [sub('Laptopuri', 'laptopuri'), sub('Imprimante', 'imprimante'), sub('Monitoare', 'monitoare'), sub('Periferice', 'periferice'), sub('Componente', 'componente')],
  },
  {
    slug: 'bucatarie', nume: 'Bucatarie', numar: '88 articole', icon: ic.bucatarie,
    inrudite: ['electrocasnice', 'casa-si-gradina'],
    descriere: 'Mici electrocasnice de bucatarie testate pe ce conteaza: espressoare, friteuze cu aer, roboti si blendere.',
    subcategorii: [sub('Espressoare', 'espressoare'), sub('Friteuze cu aer', 'friteuze-cu-aer'), sub('Roboti de bucatarie', 'roboti-de-bucatarie'), sub('Blendere', 'blendere')],
  },
  {
    slug: 'tv-si-foto', nume: 'TV si Foto', numar: '96 articole', icon: ic.tv,
    inrudite: ['it-si-laptop', 'telefoane'],
    descriere: 'Televizoare, sisteme audio si camere foto, comparate pe imagine, sunet si raport pret-calitate.',
    subcategorii: [sub('Televizoare', 'televizoare'), sub('Boxe portabile', 'boxe-portabile'), sub('Soundbar', 'soundbar'), sub('Camere foto', 'camere-foto'), sub('Proiectoare', 'proiectoare')],
  },
  {
    slug: 'iluminat', nume: 'Iluminat si electrice', numar: '', icon: ic.iluminat,
    inrudite: ['casa-si-gradina', 'electrocasnice'],
    descriere: 'Corpuri de iluminat, becuri, benzi LED, iluminat de exterior si partea electrica a casei. Calculam consumul real si cat te costa pe an, si comparam pe lumeni si temperatura de culoare, nu pe wati.',
    subcategorii: [
      sub('Corpuri de iluminat', 'corpuri-de-iluminat'),
      sub('Becuri si spoturi', 'becuri-si-spoturi'),
      sub('Benzi LED', 'benzi-led'),
      sub('Iluminat exterior', 'iluminat-exterior'),
      sub('Electrice', 'electrice'),
    ],
  },
  {
    slug: 'auto', nume: 'Auto', numar: '', icon: ic.auto,
    inrudite: ['tv-si-foto', 'telefoane'],
    descriere: 'Camere de bord, trotinete electrice, anvelope si accesorii, comparate pe fise, recenzii reale si ce folosesti efectiv la drum.',
    subcategorii: [sub('Camere de bord', 'camere-de-bord'), sub('Trotinete electrice', 'trotinete-electrice'), sub('Anvelope', 'anvelope'), sub('Accesorii auto', 'accesorii-auto'), sub('Intretinere auto', 'intretinere-auto')],
  },
  {
    slug: 'ingrijire', nume: 'Ingrijire personala', numar: '', icon: ic.ingrijire,
    inrudite: ['casa-si-gradina', 'electrocasnice'],
    descriere: 'Creme, igiena orala, ingrijirea parului si aparate de ingrijire, comparate pe ingrediente declarate, fise si recenzii reale, fara promisiuni medicale.',
    subcategorii: [sub('Ingrijirea tenului', 'ingrijirea-tenului'), sub('Igiena orala', 'igiena-orala'), sub('Ingrijirea parului', 'ingrijirea-parului'), sub('Aparate de ingrijire', 'aparate-de-ingrijire')],
  },
  {
    slug: 'casa-si-gradina', nume: 'Casa si Gradina', numar: '124 articole', icon: ic.casa,
    inrudite: ['iluminat', 'electrocasnice'],
    descriere: 'Mobila, saltele si tot ce face casa mai buna, plus unelte si echipamente de gradina.',
    subcategorii: [sub('Mobila', 'mobila'), sub('Saltele', 'saltele'), sub('Decoratiuni', 'decoratiuni'), sub('Gradina', 'gradina')],
  },
];

// derivate pentru homepage si antet
export const categoriiGrid = categorii.map((c) => ({
  nume: c.nume, slug: c.slug, numar: c.numar, icon: c.icon,
  subs: c.subcategorii.slice(0, 4).map((s) => s.nume),
}));

export const megaMeniu = categorii.map((c) => ({
  grup: c.nume,
  items: c.subcategorii.slice(0, 4).map((s) => [s.nume, `/${c.slug}/${s.slug}/`]),
}));

export const meniuPrincipal = [
  { nume: 'Articole', href: '/articole/' },
  { nume: 'Cum alegem', href: '/cum-alegem/' },
];

export const gasesteCategorie = (slug) => categorii.find((c) => c.slug === slug);
