import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');

// Load .env for standalone usage
try {
  const envContent = fs.readFileSync(path.join(ROOT_DIR, '.env'), 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0 && !process.env[key.trim()]) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    }
  }
} catch (e) {}

// API Keys
const GEMINI_KEYS = [
  'AIzaSyAbRzbs0WRJMb0gcojgyJlrjqOPr3o2Cmk',
  'AIzaSyDZ2TklBMM8TU3FA6aIS8vdUc-2iMyHWaM',
  'AIzaSyBdmChQ0ARDdDAqSMSlDIit_xz5ucrWjkY',
  'AIzaSyAE57AIwobFO4byKbeoa-tVDMV5lMgcAxQ',
  'AIzaSyBskPrKeQvxit_Rmm8PG_NO0ZhMQsrktTE',
  'AIzaSyAkUcQ3YiD9cFiwNh8pkmKVxVFxEKFJl2Q',
  'AIzaSyDnX940N-U-Sa0202-v3_TOjXf42XzoNxE',
  'AIzaSyAMl3ueRPwzT1CklxkylmTXzXkFd0A_MqI',
  'AIzaSyA82h-eIBvHWvaYLoP26zMWI_YqwT78OaI',
  'AIzaSyBRI7pd1H2EdCoBunJkteKaCDSH3vfqKUg',
  'AIzaSyA3IuLmRWyTtygsRJYyzHHvSiTPii-4Dbk',
  'AIzaSyB6RHadv3m1WWTFKb_rB9ev_r4r2fM9fNU',
  'AIzaSyCexyfNhzT2py3FLo3sXftqKh0KUdAT--A',
  'AIzaSyC_SN_RdQ2iXzgpqng5Byr-GU5KC5npiAE',
  'AIzaSyBOV9a_TmVAayjpWemkQNGtcEf_QuiXMG0',
  'AIzaSyCFOafntdykM82jJ8ILUqY2l97gdOmwiGg',
  'AIzaSyACxFhgs3tzeeI5cFzrlKmO2jW0l8poPN4',
  'AIzaSyBhZXBhPJCv9x8jKQljZCS4b5bwF3Ip3pk',
  'AIzaSyDF7_-_lXcAKF81SYpcD-NiA5At4Bi8tp8',
  'AIzaSyAwinD7oQiQnXeB2I5kyQsq_hEyJGhSrNg',
];

const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

let currentKeyIndex = 0;

function getNextGeminiKey() {
  const key = GEMINI_KEYS[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % GEMINI_KEYS.length;
  return key;
}

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  fs.appendFileSync(path.join(ROOT_DIR, 'generation.log'), logMessage + '\n');
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[ăâ]/g, 'a')
    .replace(/[îï]/g, 'i')
    .replace(/[șş]/g, 's')
    .replace(/[țţ]/g, 't')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function escapeSpecialChars(text) {
  if (!text) return '';
  return text
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...');
}

function escapeForHtml(str) {
  if (!str) return '';
  return str.replace(/"/g, '&quot;');
}

function processContentToHtml(content) {
  if (!content) return '';

  let sectionContent = escapeSpecialChars(content);

  // Bold
  sectionContent = sectionContent.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Normalize: if content already has <p> tags, strip them first
  if (sectionContent.includes('<p>') || sectionContent.includes('<p ')) {
    sectionContent = sectionContent
      .replace(/<\/p>\s*<p>/g, '\n')
      .replace(/<p[^>]*>/g, '')
      .replace(/<\/p>/g, '\n');
  }

  // Insert breaks around block-level elements so they get properly separated
  sectionContent = sectionContent
    .replace(/(<(?:h[1-6]|ul|ol|blockquote|table|div)[\s>])/gi, '\n\n$1')
    .replace(/(<\/(?:h[1-6]|ul|ol|blockquote|table|div)>)/gi, '$1\n\n');

  // Split into blocks and wrap text in <p>, leave block elements as-is
  let blocks = sectionContent.split(/\n\n+/).map(p => p.trim()).filter(p => p);
  // Fallback: if \n\n split produced a single large block, try splitting on \n
  if (blocks.length <= 1 && sectionContent.includes('\n')) {
    blocks = sectionContent.split(/\n/).map(p => p.trim()).filter(p => p);
  }
  sectionContent = blocks.map(p => {
    if (p.match(/^<(?:ul|ol|h[1-6]|table|blockquote|div|section)/i)) {
      return p;
    }
    return `<p>${p}</p>`;
  }).join('\n        ');

  // Split overly long paragraphs for better readability
  sectionContent = sectionContent.replace(/<p>([\s\S]*?)<\/p>/g, (match, inner) => {
    if (inner.length < 500) return match;
    // Split on sentence boundaries (. followed by space and uppercase letter)
    const sentences = inner.split(/(?<=\.)\s+(?=[A-Z])/);
    if (sentences.length <= 3) return match;
    // Group sentences into paragraphs of 2-4 sentences
    const paragraphs = [];
    let current = [];
    let currentLen = 0;
    for (const s of sentences) {
      current.push(s);
      currentLen += s.length;
      if (current.length >= 3 || currentLen > 400) {
        paragraphs.push(current.join(' '));
        current = [];
        currentLen = 0;
      }
    }
    if (current.length > 0) paragraphs.push(current.join(' '));
    if (paragraphs.length <= 1) return match;
    return paragraphs.map(p => `<p>${p}</p>`).join('\n        ');
  });

  return sectionContent;
}

function extractExcerpt(content, maxLength = 160) {
  if (!content) return '';
  let text = content.replace(/<[^>]+>/g, '').replace(/\*\*/g, '');
  text = text.replace(/\s+/g, ' ').trim();
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3).replace(/\s+\S*$/, '') + '...';
}

function stripStrong(str) {
  return str.replace(/<\/?strong>/g, '');
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function translateToEnglish(text) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const apiKey = getNextGeminiKey();
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Translate the following Romanian text to English. Return ONLY the English translation, nothing else:\n\n${text}` }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 200 }
        })
      });
      const data = await response.json();
      if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        return data.candidates[0].content.parts[0].text.trim();
      }
      console.error(`  Translation attempt ${attempt + 1} failed: no candidates`);
    } catch (error) {
      console.error(`  Translation attempt ${attempt + 1} error: ${error.message}`);
    }
    if (attempt < 2) await new Promise(r => setTimeout(r, 2000));
  }
  return text;
}

async function translateTitle(title) {
  const apiKey = getNextGeminiKey();
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `Translate the following Romanian text to English. Return ONLY the English translation, nothing else:\n\n${title}` }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 200 }
      })
    });

    const data = await response.json();
    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text.trim();
    }
    return title;
  } catch (error) {
    log(`Translation failed: ${error.message}`);
    return title;
  }
}

async function generateImage(imagePrompt, slug, categorySlug) {
  const categoryPrompts = {
    'electrocasnice-premium': 'in a modern kitchen or home interior, premium lifestyle photography, soft natural lighting',
    'it-electronice': 'on a clean modern desk, soft studio lighting, minimalist tech workspace',
    'mobilier-dormitor': 'in a cozy modern bedroom interior, warm ambient lighting, contemporary home setting',
    'fitness-sport': 'in a bright modern home gym or fitness space, energetic atmosphere, clean background',
  };

  console.log(`  Generating image for: ${imagePrompt}`);

  const MAX_IMAGE_RETRIES = 3;

  for (let attempt = 1; attempt <= MAX_IMAGE_RETRIES; attempt++) {

    if (attempt > 1) {

      console.log(`  Image retry attempt ${attempt}/${MAX_IMAGE_RETRIES}...`);

      await new Promise(r => setTimeout(r, 3000 * attempt));

    }


  try {
    const titleEn = await translateToEnglish(imagePrompt);
    console.log(`  Translated title: ${titleEn}`);

    const setting = categoryPrompts[categorySlug] || 'in a modern home setting, soft natural lighting, clean contemporary background';
    const prompt = `Realistic photograph of ${titleEn} ${setting}, no text, no brand name, no writing, no words, no letters, no numbers. Photorealistic, high quality, professional product photography.`;

    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('steps', '20');
    formData.append('width', '1024');
    formData.append('height', '768');

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/@cf/black-forest-labs/flux-2-dev`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CF_API_TOKEN}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`  Image API error: ${response.status} - ${errorText.slice(0, 200)}`);
      continue;
    }

    const data = await response.json();
    if (!data.result?.image) {
      console.error('  No image in response');
      continue;
    }

    const imageBuffer = Buffer.from(data.result.image, 'base64');

    const imagesDir = path.join(ROOT_DIR, 'public', 'images', 'articles');
    fs.mkdirSync(imagesDir, { recursive: true });
    const outputPath = path.join(imagesDir, `${slug}.webp`);

    await sharp(imageBuffer)
      .resize(800, 600, { fit: 'cover' })
      .webp({ quality: 82, effort: 6 })
      .toFile(outputPath);

    console.log(`  Image saved: /images/articles/${slug}.webp`);
    return `/images/articles/${slug}.webp`;
  } catch (error) {
    console.error(`  Image generation error: ${error.message}`);
    continue;
  }


  }

  console.error('  Image generation failed after all retries');

  return null;
}

function cleanJsonText(text) {
  // Remove markdown code blocks
  text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  // Fix common JSON issues
  text = text.replace(/[\u201C\u201D\u201E\u201F]/g, '"');
  text = text.replace(/[\u2018\u2019\u201A\u201B]/g, "'");
  // Remove control characters except newlines
  text = text.replace(/[\x00-\x09\x0B\x0C\x0E-\x1F]/g, '');
  // Extract JSON object if there's extra text before/after
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    text = jsonMatch[0];
  }
  return text;
}

async function generateArticleContent(keyword, category, maxRetries = 10) {
  const prompt = `Esti un expert in produse pentru casa si gradina care scrie pe un blog romanesc. Scrii intr-un stil direct, conversational, ca un prieten care se pricepe si iti da sfaturi concrete. NU esti un AI. Esti un om real cu experienta reala.

Keyword: "${keyword}"
Categorie: "${category}"

GENEREAZA un articol complet in format JSON cu structura de mai jos. Articolul trebuie sa fie informativ, natural, scris de un om care chiar stie domeniul. Fara diacritice. Intre 1500-2500 de cuvinte.

=== 1. SEARCH INTENT MAPPING (CRITIC) ===
Structura articolului urmeaza EXACT ce cauta userul cand tasteaza "${keyword}" in Google:
- PRIMA sectiune = raspunsul direct, concret, fara introducere, fara "bun venit", fara preambul. Userul vrea raspunsul ACUM.
- Dupa raspunsul direct, vin detaliile, comparatiile, criteriile de alegere.
- Fiecare sectiune raspunde la o sub-intrebare pe care userul o are in minte.
- NU incepe NICIODATA cu o introducere generica. Prima propozitie = recomandarea ta directa sau raspunsul la intentia de cautare.
- Excerptul = primele 2-3 propozitii din articol care dau raspunsul direct. Asta apare in Google ca snippet.

=== 2. ANTI-AI FOOTPRINT (FOARTE IMPORTANT) ===
Articolul TREBUIE sa para scris de un om real, nu de AI. Reguli concrete:
- FARA tranzitii generice: NU folosi "Asadar", "In primul rand", "De asemenea", "Cu toate acestea", "Este important de mentionat", "Trebuie sa tinem cont", "Nu in ultimul rand"
- FARA structura predictibila: nu toate paragrafele sa aiba aceeasi lungime. Amesteca: un paragraf de 2 propozitii, urmat de unul de 4, apoi unul de 1 propozitie.
- IMPERFECTIUNI NATURALE: include formulari imperfecte dar naturale: "bon, stai", "cum sa zic", "pana la urma", "na, asta e", "ma rog", "zic si eu"
- Amesteca propozitii FOARTE scurte (3-5 cuvinte: "Merita. Punct." / "Nu-i rau." / "Depinde de buget.") cu propozitii lungi (18-22 cuvinte)
- Foloseste MULT limbaj conversational romanesc: "na", "uite", "stai putin", "pe bune", "sincer", "daca ma intrebi pe mine", "am sa fiu direct", "uite care-i treaba"
- INTERZIS TOTAL: "in era actuala", "descopera", "fara indoiala", "ghid complet", "in concluzie", "in acest articol", "hai sa exploram", "sa aprofundam", "merita mentionat", "este esential", "este crucial", "o alegere excelenta"
- INTERZIS: liste de 3 adjective consecutive, inceperea a doua propozitii la rand cu acelasi cuvant, folosirea aceluiasi pattern de inceput de paragraf
- Include anecdote personale CONCRETE: "am avut un X care a tinut 4 ani", "un prieten si-a luat un Y si dupa 2 luni...", "am testat personal modelul asta vreo 3 saptamani"
- Include critici ONESTE: fiecare produs sa aiba minim 1-2 minusuri reale, nu critici false gen "singurul minus e ca e prea bun"
- Recunoaste incertitudine: "n-am testat personal, dar din ce am auzit...", "pe asta nu pun mana in foc, dar..."
- Vorbeste ca pe un forum romanesc, nu ca o enciclopedie

=== 3. FAQ OPTIMIZAT PEOPLE ALSO ASK ===
8 intrebari formatate EXACT cum le tasteaza oamenii in Google Romania:
- Foloseste formulari naturale de cautare: "cat costa...", "care e diferenta intre...", "merita sa...", "ce ... e mai bun", "de ce...", "cum sa...", "unde gasesc..."
- FARA intrebari artificiale sau formale. Gandeste-te: ce ar tasta un roman in Google?
- Raspunsurile au structura de FEATURED SNIPPET: prima propozitie = raspunsul direct si clar, apoi 1-2 propozitii cu detalii si cifre concrete
- Raspuns = 40-70 cuvinte, auto-suficient (sa poata fi afisat singur ca snippet fara context)
- Include cifre concrete: preturi in lei, procente, durate, dimensiuni
- Acoperiti: pret, comparatie, durabilitate, alegere, probleme frecvente, intretinere, autenticitate, unde sa cumperi

=== 4. LIZIBILITATE PERFECTA PARAGRAFE ===
- MAXIM 3-4 propozitii per paragraf. Niciodata mai mult.
- Paragrafele lungi sunt INTERZISE. Daca un paragraf are mai mult de 4 propozitii, sparge-l.
- Alterna paragrafele: unul mai lung (3-4 prop), unul scurt (1-2 prop), unul mediu (2-3 prop)
- Intre sectiuni lasa "aer" - nu pune paragraf dupa paragraf fara pauza
- Foloseste bullet points (<ul><li>) pentru liste de criterii, avantaje, dezavantaje - nu le pune in text continuu
- Subtitlurile (H3) sparg monotonia - foloseste-le in cadrul sectiunilor pentru a crea sub-puncte

=== 5. CUVINTE CHEIE IN STRONG ===
- Pune keyword-ul principal si variatiile lui in <strong> tags de fiecare data cand apar natural in text
- Keyword principal: "${keyword}" - trebuie sa apara de 4-6 ori in tot articolul, in <strong>
- Variatii naturale ale keyword-ului: pune si ele in <strong>
- NU pune in strong cuvinte random sau irelevante. Doar keyword-urile si variatiile lor.
- Nu forta keyword density. Trebuie sa sune natural, ca si cum ai sublinia ce e important.
- NICIODATA nu pune <strong> in titluri de sectiuni (heading), in intrebarile FAQ, sau in textul din cuprins/TOC. Strong se foloseste DOAR in paragrafe de text (<p>), nu in <h2>, <h3>, "question", sau "heading".

=== REGULI SUPLIMENTARE ===
- Scrie FARA diacritice (fara ă, î, ș, ț, â - foloseste a, i, s, t)
- Preturile sa fie in LEI si realiste pentru piata din Romania
- Fiecare sectiune minim 250 cuvinte

STRUCTURA JSON (returneaza DOAR JSON valid, fara markdown, fara \`\`\`):
{
  "excerpt": "Primele 2-3 propozitii care dau raspunsul direct la ce cauta userul. Recomandarea concreta + context scurt. FARA introducere.",
  "sections": [
    {
      "title": "Titlu sectiune cu keyword integrat natural",
      "content": "HTML formatat cu <p>, <strong>, <ul>/<li>. Minim 250 cuvinte per sectiune. Paragrafele separate cu </p><p>. Maxim 3-4 propozitii per paragraf."
    }
  ],
  "faq": [
    {
      "question": "Intrebare EXACT cum ar tasta-o un roman in Google",
      "answer": "Prima propozitie = raspuns direct (featured snippet). Apoi 1-2 propozitii cu detalii si cifre. Total 40-70 cuvinte."
    }
  ]
}

SECTIUNI OBLIGATORII (6 sectiuni, titluri creative, NU generice):
1. [Raspuns direct] - recomandarea ta principala cu explicatie, fara preambul (titlu creativ legat de keyword, NU "raspunsul direct")
2. [Top recomandari] - 4-5 produse cu preturi reale in lei, avantaje si dezavantaje oneste (cu minusuri reale)
3. [Criterii de alegere] - pe ce sa te uiti cand alegi, explicat pe intelesul tuturor, cu exemple concrete
4. [Comparatie] - head-to-head intre 2-3 optiuni populare, cu preturi si diferente clare
5. [Greseli si tips] - ce sa eviti, sfaturi de insider, greseli pe care le fac toti
6. [Verdict pe buget] - recomandare finala pe 3 categorii de buget: mic, mediu, mare (NU folosi cuvantul "concluzie")

FAQ: 8 intrebari naturale, formulari de cautare Google reale, raspunsuri cu structura featured snippet.`;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const apiKey = getNextGeminiKey();
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 16000
          }
        })
      });

      const data = await response.json();

      if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        let text = cleanJsonText(data.candidates[0].content.parts[0].text);
        try {
          const parsed = JSON.parse(text);
          // Validate structure
          if (parsed.excerpt && parsed.sections && parsed.faq) {
            return parsed;
          }
          log(`  Invalid JSON structure (attempt ${attempt + 1})`);
          if (attempt < maxRetries - 1) {
            await delay(2000);
            continue;
          }
        } catch (parseError) {
          log(`  JSON parse error (attempt ${attempt + 1}): ${parseError.message.substring(0, 50)}`);
          if (attempt < maxRetries - 1) {
            await delay(2000);
            continue;
          }
        }
      }

      if (data.error) {
        log(`  Gemini error: ${data.error.message}`);
        if (attempt < maxRetries - 1) {
          await delay(2000);
          continue;
        }
      }

    } catch (error) {
      log(`  Request error (attempt ${attempt + 1}): ${error.message}`);
      if (attempt < maxRetries - 1) {
        await delay(2000);
        continue;
      }
    }
  }

  throw new Error('Failed after all retries');
}

function getAuthorForCategory(categorySlug, authors) {
  const categoryAuthors = {
    'electrocasnice-premium': authors.find(a => a.role.includes('Electrocasnice')),
    'it-electronice': authors.find(a => a.role.includes('IT')),
    'mobilier-dormitor': authors.find(a => a.role.includes('Home')),
    'fitness-sport': authors.find(a => a.role.includes('Fitness'))
  };
  return categoryAuthors[categorySlug] || authors[0];
}

function createArticlePage(keyword, category, categorySlug, content, imagePath, author) {
  const slug = slugify(keyword);
  const title = capitalizeFirst(keyword);
  const date = new Date().toISOString();
  const initials = author.name.split(' ').map(n => n[0]).join('');

  const formattedDate = new Date().toLocaleDateString('ro-RO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Build TOC HTML
  let tocHtml = '';
  content.sections.forEach((section) => {
    const sectionId = slugify(stripStrong(section.title));
    tocHtml += `            <li><a href="#${sectionId}">${stripStrong(escapeSpecialChars(section.title))}</a></li>\n`;
  });
  tocHtml += '            <li><a href="#faq">Intrebari Frecvente</a></li>';

  // Build article content HTML
  let sectionsHtml = '';
  content.sections.forEach((section) => {
    const sectionId = slugify(stripStrong(section.title));
    sectionsHtml += `\n<h2 id="${sectionId}">${stripStrong(escapeSpecialChars(section.title))}</h2>\n`;
    sectionsHtml += processContentToHtml(section.content);

    if (section.subsections) {
      section.subsections.forEach(sub => {
        sectionsHtml += `\n<h3>${escapeSpecialChars(sub.title)}</h3>\n`;
        sectionsHtml += processContentToHtml(sub.content);
      });
    }
  });

  // Build FAQ HTML
  let faqHtml = '';
  content.faq.forEach(item => {
    faqHtml += `
      <div class="faq-item">
        <div class="faq-question">
          ${stripStrong(escapeSpecialChars(item.question))}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
          </svg>
        </div>
        <div class="faq-answer">${stripStrong(escapeSpecialChars(item.answer))}</div>
      </div>`;
  });

  // Extract excerpt from first section content
  const rawExcerpt = content.excerpt || extractExcerpt(content.sections[0]?.content || '');
  const excerpt = rawExcerpt.replace(/<[^>]*>/g, '');  // Strip HTML tags
  const faqJson = JSON.stringify((content.faq || []).map(item => ({ question: stripStrong(item.question), answer: stripStrong(item.answer) })));

  const pageContent = `---
import Layout from '../layouts/Layout.astro';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
import SimilarArticles from '../components/SimilarArticles.astro';
import CookieBanner from '../components/CookieBanner.astro';

export const frontmatter = {
  title: "${title}",
  excerpt: "${excerpt.replace(/"/g, '\\"')}",
  image: "${imagePath || '/images/articles/placeholder.webp'}",
  category: "${category}",
  categorySlug: "${categorySlug}",
  date: "${date}",
  author: "${author.name}",
  authorRole: "${author.role}",
  authorBio: "${author.bio.replace(/"/g, '\\"')}"
};

const faq = ${faqJson};
---

<Layout
  title="${escapeForHtml(title)}"
  description="${escapeForHtml(excerpt)}"
  image="${imagePath || '/images/articles/placeholder.webp'}"
  type="article"
  publishedDate="${date}"
  modifiedDate="${date}"
  category="${escapeForHtml(category)}"
  categorySlug="${categorySlug}"
  author="${escapeForHtml(author.name)}"
  faq={faq}
>
  <Header />

  <main class="article-page">
    <div class="container">
      <article class="article-container">
        <nav class="breadcrumb">
          <a href="/">Acasa</a>
          <span class="breadcrumb-sep">/</span>
          <a href="/${categorySlug}/">${category}</a>
          <span class="breadcrumb-sep">/</span>
          <span>${title}</span>
        </nav>

        <header class="article-header">
          <a href="/${categorySlug}/" class="article-category-badge">
            ${category}
          </a>
          <h1 class="article-title">${title}</h1>
          <div class="article-meta">
            <div class="article-author">
              <div class="author-avatar">${initials}</div>
              <div class="author-info">
                <span class="author-name">${author.name}</span>
                <span class="author-role">${author.role}</span>
              </div>
            </div>
            <div class="article-date">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              ${formattedDate}
            </div>
          </div>
        </header>

        ${imagePath ? `<div class="article-image">
          <img src="${imagePath}" alt="${escapeForHtml(title)}" width="800" height="600" loading="eager" fetchpriority="high" decoding="async">
        </div>` : ''}

        <div class="toc">
          <div class="toc-title">
            Cuprins
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
          </div>
          <ol class="toc-list">
${tocHtml}
          </ol>
        </div>

        <div class="prose-article">
          ${sectionsHtml}
        </div>

        <section class="faq-section" id="faq">
          <h2 class="faq-title">Intrebari Frecvente</h2>
          ${faqHtml}
        </section>

        <div class="author-box">
          <div class="author-box-avatar">${initials}</div>
          <div class="author-box-info">
            <h4>${author.name}</h4>
            <p>${author.role}</p>
            <p class="author-box-bio">${author.bio}</p>
          </div>
        </div>

        <SimilarArticles currentSlug="${slug}" categorySlug="${categorySlug}" />
      </article>
    </div>
  </main>

  <Footer />
  <CookieBanner />
</Layout>`;

  const filePath = path.join(ROOT_DIR, 'src', 'pages', `${slug}.astro`);
  fs.writeFileSync(filePath, pageContent);
  log(`  Article saved: ${slug}.astro`);

  return { title, slug, success: true };
}

async function main() {
  log('========================================');
  log('ARTICLE GENERATION STARTED');
  log('========================================');

  const keywordsPath = path.join(ROOT_DIR, 'keywords.json');
  const tempArticlesPath = path.join(ROOT_DIR, 'temp-articles.json');
  const keywordsData = JSON.parse(fs.readFileSync(keywordsPath, 'utf-8'));

  // Check if temp-articles.json exists (auto-generate mode)
  let pending;
  let autoGenerateMode = false;

  if (fs.existsSync(tempArticlesPath)) {
    autoGenerateMode = true;
    const tempData = JSON.parse(fs.readFileSync(tempArticlesPath, 'utf-8'));
    pending = tempData.articles || [];
    log('Running in auto-generate mode');
  } else {
    pending = keywordsData.pending;
  }

  const authors = keywordsData.authors;

  if (pending.length === 0) {
    log('No pending keywords to process');
    return;
  }

  log(`Pending keywords: ${pending.length}`);

  const results = [];

  for (const item of pending) {
    try {
      log(`\nGenerating: ${item.keyword}`);

      // Generate content
      log('  Generating content with Gemini...');
      const content = await generateArticleContent(item.keyword, item.category);
      log('  Content generated successfully');

      // Generate image
      log('  Generating image...');
      const slug = slugify(item.keyword);
      const imagePath = await generateImage(capitalizeFirst(item.keyword), slug, item.categorySlug);

      // Get author
      const author = getAuthorForCategory(item.categorySlug, authors);

      // Create article page
      const result = createArticlePage(
        item.keyword,
        item.category,
        item.categorySlug,
        content,
        imagePath,
        author
      );

      results.push({ ...item, ...result });

      // Move to completed (only in normal mode, not auto-generate mode)
      if (!autoGenerateMode) {
        keywordsData.completed.push(item);
        keywordsData.pending = keywordsData.pending.filter(k => k.keyword !== item.keyword);
        fs.writeFileSync(keywordsPath, JSON.stringify(keywordsData, null, 2));
      }

      log(`  SUCCESS!`);

      // Delay between articles
      await delay(2000);

    } catch (error) {
      log(`  FAILED: ${error.message}`);
      results.push({ ...item, success: false, error: error.message });
    }
  }

  // Write successful keywords for auto-generate.js
  const successfulKeywords = results.filter(r => r.success).map(r => r.keyword);
  const successfulKeywordsPath = path.join(__dirname, 'successful-keywords.json');
  fs.writeFileSync(successfulKeywordsPath, JSON.stringify(successfulKeywords, null, 2));

  log('\n========================================');
  log(`GENERATION COMPLETE: ${results.filter(r => r.success).length}/${results.length} articles`);
  log('========================================');
}

main().catch(error => {
  log(`Fatal error: ${error.message}`);
  process.exit(1);
});
