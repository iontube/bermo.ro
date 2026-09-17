// bermo.ro — genereaza public/_redirects: 301 de la versiunea VECHE (articole auto-gen Gemini)
// catre structura NOUA (portal cele-mai-bune). Ruleaza inainte de build.
// Vechi: articole flat /slug/, categorii /electrocasnice-premium|it-electronice|fitness-sport|mobilier-dormitor/
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// reguli speciale care raman (Profitshare + articol #1 mutat + cautare friendly)
const speciale = [
  '# verificare Profitshare: serveste .html cu 200 direct',
  '/3cd812df2df103f6a79d95a625afe7db.html  /3cd812df2df103f6a79d95a625afe7db  200',
  '',
  '# cautare cu URL friendly: /cauta/<termen>/ serveste pagina de articole (filtrare client-side)',
  '/cauta/*  /articole/  200',
  '',
  '# articolul #1 a fost mutat de la path adanc la URL plat',
  '/electrocasnice/aspiratoare-robot/cele-mai-bune-aspiratoare-robot/  /cele-mai-bune-aspiratoare-robot/  301',
];

// ARTICOLE vechi (slug flat) -> tinta noua (cel mai relevant)
const articole = {
  // --- electrocasnice-premium (bucatarie) ---
  'espressor-automat-de-lux': '/cele-mai-bune-espressoare/',
  'espressor-profesional-barista': '/cele-mai-bune-espressoare/',
  'masina-de-cafea-delonghi': '/cele-mai-bune-espressoare/',
  'robot-de-bucatarie-bosch': '/cele-mai-bune-roboti-de-bucatarie/',
  'friteuza-fara-ulei-xl': '/cele-mai-bune-friteuze-cu-aer/',
  'blender-profesional-vitamix': '/cele-mai-bune-blendere/',
  'storcator-fructe-slow-juicer': '/bucatarie/',
  'aparat-sous-vide-profesional': '/bucatarie/',
  'masina-de-paine-premium': '/bucatarie/',
  'aparat-vidat-alimente-profesional': '/bucatarie/',
  'purificator-aer-camera': '/electrocasnice/',
  // --- it-electronice ---
  'laptop-gaming-performant': '/cele-mai-bune-laptopuri-gaming/',
  'laptop-ultrabook-business': '/cele-mai-bune-laptopuri/',
  'monitor-gaming-144hz': '/cele-mai-bune-monitoare/',
  'casti-gaming-hyperx': '/cele-mai-bune-casti-wireless/',
  'placa-video-rtx-4070': '/it-si-laptop/',
  'procesor-intel-core-i7': '/it-si-laptop/',
  'ssd-nvme-samsung-2tb': '/it-si-laptop/',
  'router-wifi-6-mesh': '/it-si-laptop/',
  'mouse-gaming-wireless-logitech': '/it-si-laptop/',
  'camera-web-4k-streaming': '/it-si-laptop/',
  'microfon-podcast-usb': '/it-si-laptop/',
  // --- mobilier-dormitor ---
  'saltea-memory-foam-premium': '/cele-mai-bune-saltele/',
  'saltea-ortopedica-latex': '/cele-mai-bune-saltele/',
  'pat-matrimonial-tapitat': '/cele-mai-bune-paturi/',
  'scaun-ergonomic-herman-miller': '/cele-mai-bune-scaune-de-birou/',
  'canapea-extensibila-living': '/casa-si-gradina/mobila/',
  'fotoliu-relaxare-recliner': '/casa-si-gradina/mobila/',
  'comoda-dormitor-stejar': '/casa-si-gradina/mobila/',
  'dulap-usi-glisante': '/casa-si-gradina/mobila/',
  'noptiera-moderna-minimalist': '/casa-si-gradina/mobila/',
  // --- fitness-sport (fara echivalent -> homepage) ---
  'aparat-multifunctional-forta': '/',
  'banda-alergat-pliabila': '/',
  'bara-tractiuni-multifunctionala': '/',
  'bicicleta-eliptica-magnetica': '/',
  'bicicleta-spinning-profesionala': '/',
  'gantere-reglabile-bowflex': '/',
  'kettlebell-set-profesional': '/',
  'minge-fitness-antiburst': '/',
  'stepper-fitness-hidraulic': '/',
  'trx-suspension-original': '/',
};

// PAGINI vechi -> noi (contact si termeni-si-conditii au acelasi slug, nu necesita redirect)
const pagini = {
  'politica-de-confidentialitate': '/confidentialitate/',
  'politica-cookies': '/cookies/',
  'sitemap': '/articole/', // vechea harta HTML
  'cautare': '/', // pagina de cautare eliminata (search mutat in footer -> Google site search)
};

// CATEGORII vechi -> noi (splat pentru paginare /page/2/ etc.)
const categorii = {
  'electrocasnice-premium': '/electrocasnice/',
  'it-electronice': '/it-si-laptop/',
  'mobilier-dormitor': '/casa-si-gradina/mobila/',
  'fitness-sport': '/',
};

// Slug-uri ale articolelor NOASTRE care au fost redenumite dupa publicare.
// Nu are legatura cu migrarea versiunii vechi de mai sus.
const redenumite = {
  // „scris copii" se citea „copii de documente", iar „lampa pentru unghii" inseamna in mod
  // obisnuit lampa UV de uscat gel, alt produs. Reformulat pe „lucru de precizie".
  'lampa-de-birou-pentru-scris-copii-si-unghii': '/lampa-de-birou-pentru-copii-scris-si-precizie/',
};

const L = [...speciale, ''];
L.push('# --- ARTICOLE REDENUMITE dupa publicare (301) ---');
for (const [slug, dest] of Object.entries(redenumite)) {
  L.push(`/${slug}/  ${dest}  301`);
  L.push(`/${slug}  ${dest}  301`);
}
L.push('');

// articole + pagini: exact, ambele variante (cu si fara trailing slash)
const flat = { ...articole, ...pagini };
L.push('# --- ARTICOLE + PAGINI vechi -> structura noua (301) ---');
for (const [slug, dest] of Object.entries(flat)) {
  L.push(`/${slug}/  ${dest}  301`);
  L.push(`/${slug}  ${dest}  301`);
}
L.push('');

// categorii: splat + bare
L.push('# --- CATEGORII vechi -> categorii noi (301) ---');
for (const [slug, dest] of Object.entries(categorii)) {
  L.push(`/${slug}/*  ${dest}  301`);
  L.push(`/${slug}  ${dest}  301`);
}
L.push('');

const out = fileURLToPath(new URL('../public/_redirects', import.meta.url));
writeFileSync(out, L.join('\n') + '\n');
const nr = Object.keys(flat).length + Object.keys(categorii).length;
console.log(`_redirects: ${Object.keys(articole).length} articole + ${Object.keys(pagini).length} pagini + ${Object.keys(categorii).length} categorii vechi -> nou (${nr} mapari, ${L.length} linii)`);
