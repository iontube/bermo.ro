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


// Strip brand names from image prompt to avoid Cloudflare AI content filter
function stripBrands(text) {
  return text
    .replace(/\b[A-Z][a-z]+[A-Z]\w*/g, '')  // camelCase brands: HyperX, PlayStation
    .replace(/\b[A-Z]{2,}\b/g, '')            // ALL CAPS: ASUS, RGB, LED
    .replace(/\s{2,}/g, ' ')                   // collapse double spaces
    .trim();
}

// Use Gemini to rephrase a title into a generic description without brand names
async function rephraseWithoutBrands(text) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const apiKey = getNextGeminiKey();
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Rephrase the following into a short, generic English description for an image prompt. Remove ALL brand names, trademarks, product names, and game names. Replace them with generic descriptions of what they are. Return ONLY the rephrased text, nothing else.\n\nExample: "Boggle classic word game" -> "classic letter dice word game on a table"\nExample: "Kindle Paperwhite review" -> "slim e-reader device with paper-like screen"\nExample: "Duolingo app for learning languages" -> "colorful language learning mobile app interface"\n\nText: "${text}"` }] }],
          generationConfig: { temperature: 0.5, maxOutputTokens: 100 }
        })
      });
      const data = await response.json();
      if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        const result = data.candidates[0].content.parts[0].text.trim();
        console.log(`  Rephrased prompt (no brands): ${result}`);
        return result;
      }
    } catch (error) {
      console.error(`  Rephrase attempt ${attempt + 1} error: ${error.message}`);
    }
    if (attempt < 2) await new Promise(r => setTimeout(r, 2000));
  }
  // Fallback to basic stripBrands
  return stripBrands(text);
}

async function generateSafePrompt(text, categorySlug) {
  const categoryFallbacks = {
    'electrocasnice-premium': 'modern kitchen appliances on a clean countertop, soft natural light',
    'it-electronice': 'electronic devices and gadgets arranged on a minimalist desk, studio lighting',
    'mobilier-dormitor': 'cozy bedroom furniture with neutral tones, warm ambient lighting',
    'fitness-sport': 'fitness equipment and sports gear on a clean gym floor, bright lighting',
  };

  for (let attempt = 0; attempt < 3; attempt++) {
    const apiKey = getNextGeminiKey();
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Create a short, safe English image prompt for a stock photo related to this topic. The prompt must describe ONLY objects, scenery, and atmosphere. NEVER mention people, children, babies, faces, hands, or any human body parts. NEVER use brand names. Focus on products, objects, books, devices, furniture, or abstract scenes. Return ONLY the description.\n\nTopic: "${text}"` }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 100 }
        })
      });
      const data = await response.json();
      if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        const result = data.candidates[0].content.parts[0].text.trim();
        console.log(`  Safe prompt generated: ${result}`);
        return result;
      }
    } catch (error) {
      console.error(`  generateSafePrompt attempt ${attempt + 1} error: ${error.message}`);
    }
    if (attempt < 2) await new Promise(r => setTimeout(r, 2000));
  }
  // Fallback to hardcoded category description
  return categoryFallbacks[categorySlug] || 'assorted household products on a clean neutral background, soft studio lighting';
}

async function generateImage(imagePrompt, slug, categorySlug) {
  const categoryPrompts = {
    'electrocasnice-premium': 'in a modern kitchen or home interior, premium lifestyle photography, soft natural lighting',
    'it-electronice': 'on a clean modern desk, soft studio lighting, minimalist tech workspace',
    'mobilier-dormitor': 'in a cozy modern bedroom interior, warm ambient lighting, contemporary home setting',
    'fitness-sport': 'in a bright modern home gym or fitness space, energetic atmosphere, clean background',
  };

  console.log(`  Generating image for: ${imagePrompt}`);

  const MAX_IMAGE_RETRIES = 4;
  let promptFlagged = false;

  for (let attempt = 1; attempt <= MAX_IMAGE_RETRIES; attempt++) {

    if (attempt > 1) {

      console.log(`  Image retry attempt ${attempt}/${MAX_IMAGE_RETRIES}...`);

      await new Promise(r => setTimeout(r, 3000 * attempt));

    }


  try {
    const titleEn = await translateToEnglish(imagePrompt);
    console.log(`  Translated title: ${titleEn}`);

    let prompt;
    if (attempt >= 3) {
      const safeSubject = await generateSafePrompt(titleEn, categorySlug);
      prompt = `Realistic photograph of ${safeSubject}, no text, no writing, no words, no letters, no numbers. Photorealistic, high quality, professional photography.`;
    } else {
      const setting = categoryPrompts[categorySlug] || 'in a modern home setting, soft natural lighting, clean contemporary background';
      const subject = promptFlagged ? await rephraseWithoutBrands(titleEn) : titleEn;
      prompt = `Realistic photograph of ${subject} ${setting}, no text, no brand name, no writing, no words, no letters, no numbers. Photorealistic, high quality, professional product photography.`;
    }

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
      if (errorText.includes('flagged')) promptFlagged = true;
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

async function generateArticleContent(keyword, category, completedArticles = [], maxRetries = 10) {
  // Build interlink list from completed articles
  const interlinkCandidates = completedArticles
    .filter(a => a.keyword !== keyword)
    .map(a => {
      const aSlug = a.keyword.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      return { title: a.keyword.charAt(0).toUpperCase() + a.keyword.slice(1), slug: aSlug, category: a.category, categorySlug: a.categorySlug };
    });
  const sameCat = interlinkCandidates.filter(a => a.categorySlug === completedArticles.find(c => c.keyword === keyword)?.categorySlug);
  const otherCat = interlinkCandidates.filter(a => !sameCat.includes(a));
  const interlinkList = [...sameCat, ...otherCat].slice(0, 15)
    .map(a => `- <a href="/${a.slug}/">${a.title}</a> (categorie: ${a.category})`)
    .join('\n');

  const prompt = `Scrii articole pe un site romanesc despre scule, unelte si echipamente pentru casa si gradina. Stilul e informativ dar directionat spre conversie - ajuti cititorul sa ia o decizie de cumparare. NU esti un AI.

Keyword: "${keyword}"
Categorie: "${category}"

GENEREAZA un articol complet in format JSON. Fara diacritice. Minim 2000 cuvinte.

=== TONUL SI STILUL (CRITIC) ===
Tonul e informativ-conversional, NU personal/jurnal. Scopul e sa raspunzi la intentia de cautare si sa ghidezi spre cumparare.

INTRO:
- Primul paragraf RASPUNDE DIRECT la intentia din keyword. Daca cineva cauta "${keyword}", ce vrea sa afle? Raspunde-i imediat.
- Nu incepe cu anecdote, nu incepe cu "tu" sau "daca vrei". Incepe cu RASPUNSUL.

REVIEW-URI PRODUSE:
- Ton obiectiv dar accesibil - ca un review pe un site de specialitate, nu ca o poveste personala
- Translatezi specs in beneficii practice: "puterea de 2000W inseamna ca taie lemn uscat pana la 20cm grosime fara efort"
- Compari cu alternative directe
- Preturi concrete in lei
- Review-ul include pentru cine e potrivit si se incheie cu o recomandare clara
- Maximum 1-2 referinte personale ("am testat") in tot articolul
- Tonul e de expert care informeaza, nu de prieten care povesteste

CONVERSIE:
- Ghideaza spre decizie: "daca ai nevoie de forta, alege X; daca vrei versatilitate, alege Y"
- Mentioneaza pretul si unde se gaseste
- Concluzia fiecarui review sa fie actionabila

=== ANTI-AI ===
- CUVINTE INTERZISE: "Asadar", "De asemenea", "Cu toate acestea", "Este important de mentionat", "Nu in ultimul rand", "in era actuala", "descopera", "fara indoiala", "in concluzie", "este esential", "este crucial", "o alegere excelenta", "ghid", "ghiduri", "exploreaza", "aprofundam", "remarcabil", "exceptional", "revolutionar", "inovativ", "vom detalia", "vom analiza", "vom explora", "vom prezenta", "in cele ce urmeaza", "in continuare vom", "sa aruncam o privire", "buget optimizat", "alegerea editorului", "editor's choice"
- TAG-URI INTERZISE IN PRODUSE: "Buget Optimizat", "Alegerea Editorului" - suna a cliseu. Foloseste: "Alegerea Noastra", "Pentru Buget Mic", "Best Buy 2026", "Raport Calitate-Pret", "Premium"
- Amesteca paragrafe scurte (1-2 prop) cu medii (3-4 prop)
- Critici oneste: fiecare produs minim 3-4 dezavantaje reale
- Limbaj natural dar nu excesiv informal

=== PARAGRAFE CU INTREBARI (IMPORTANT PENTRU AI SEARCH) ===
Multe paragrafe trebuie sa inceapa cu o INTREBARE directa urmata de raspuns. Asta permite AI-ului (Google AI Overview, ChatGPT, Perplexity) sa citeze textul tau.
- In intro: minim 1 paragraf care incepe cu intrebare
- In review-urile de produse: minim 1 paragraf per review care incepe cu intrebare
- In sectiunea de sfaturi: fiecare h4 sa fie intrebare, iar paragraful de sub el sa inceapa cu raspunsul direct
- Exemplu bun: "Merita un bormasina cu acumulator? Da, modelul X are autonomie de 4 ore si cuplu de 80Nm, suficient pentru orice lucrare casnica."

=== STRUCTURA JSON ===

IMPORTANT: Returneaza DOAR JSON valid. Fara markdown, fara backticks.
In valorile string din JSON, foloseste \\n pentru newline si escaped quotes \\".

{
  "intro": "2-3 paragrafe HTML (<p>). PRIMUL PARAGRAF raspunde direct la intentia de cautare - ce produs e cel mai bun si de ce, cu date concrete. Din el se extrage automat descrierea.",
  "items": [
    {
      "name": "Numele complet al produsului",
      "tag": "Best Buy 2026",
      "specs": {
        "putere": "ex: 2000W / 80Nm cuplu",
        "material": "ex: otel carbon, maner ergonomic cauciucat",
        "capacitate": "ex: 50L / taiere max 30cm",
        "functii": "ex: 3 viteze, LED, reverse",
        "dimensiuni": "ex: 45x30x25 cm, 3.2 kg"
      },
      "review": "4-6 paragrafe HTML (<p>). Review obiectiv: ce face bine, ce face prost, comparat cu ce, pentru cine, la ce pret. Ultimul paragraf = recomandare actionabila.",
      "avantaje": ["avantaj 1", "avantaj 2", "avantaj 3", "avantaj 4"],
      "dezavantaje": ["dezavantaj 1", "dezavantaj 2", "dezavantaj 3"]
    }
  ],
  "comparison": {
    "intro": "1 paragraf introductiv pentru tabelul comparativ",
    "rows": [
      {
        "model": "Numele modelului",
        "putere": "watt/Nm",
        "capacitate": "scurt",
        "greutate": "kg",
        "functii": "principalele",
        "potrivitPentru": "scurt, 3-5 cuvinte"
      }
    ]
  },
  "guide": {
    "title": "Titlu ca intrebare (ex: Cum alegi cea mai buna unealta pentru proiectul tau?)",
    "content": "3-5 paragrafe HTML (<p>, <h4>, <p>) cu sfaturi de cumparare orientate spre decizie. Sub-intrebari ca <h4>. Fiecare sfat directioneaza spre un tip de produs."
  },
  "faq": [
    {
      "question": "Intrebare naturala de cautare Google",
      "answer": "Raspuns direct 40-70 cuvinte cu cifre concrete."
    }
  ]
}

=== CERINTE PRODUSE ===
- 5-7 produse relevante pentru "${keyword}", ordonate dupa relevanta
- Specs REALE si CORECTE
- Preturi realiste in lei, Romania 2026
- Review minim 200 cuvinte per produs
- Avantaje: 4-6 | Dezavantaje: 3-5 (oneste, nu cosmetice)
- Tag-uri: "Best Buy 2026", "Raport Calitate-Pret", "Premium", "Pentru Buget Mic", "Alegerea Noastra"

=== CERINTE FAQ ===
- 5 intrebari formulari naturale: "cat costa...", "care e diferenta intre...", "merita sa..."
- Raspunsuri cu cifre concrete, auto-suficiente, fara diacritice

=== REGULI ===
- FARA diacritice (fara ă, î, ș, ț, â)
- Preturile in LEI, realiste
- Keyword "${keyword}" in <strong> de 4-6 ori in articol
- NICIODATA <strong> in titluri/headings
- Total minim 2000 cuvinte

${interlinkList.length > 0 ? `
=== INTERLINK-URI INTERNE (SEO) ===
Mentioneaza NATURAL in text 2-4 articole de pe site, cu link-uri <a href="/{slug}/">{titlu}</a>.
Integreaza in propozitii, NU ca lista separata. Max 4 link-uri. Doar unde are sens contextual.
NU forta link-uri daca nu au legatura cu subiectul. Mai bine 0 link-uri decat link-uri fortate.

Articole disponibile:
${interlinkList}` : ''}`;

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
          if (parsed.intro && parsed.items && parsed.faq) {
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

  // Process intro HTML and extract excerpt from first <p>
  const introHtml = processContentToHtml(content.intro);
  const firstPMatch = (content.intro || '').match(/<p>([\s\S]*?)<\/p>/);
  const excerpt = firstPMatch ? firstPMatch[1].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().substring(0, 160) : extractExcerpt(content.intro || '');

  // Build items HTML
  let itemsHtml = '';
  (content.items || []).forEach((item) => {
    const specsGrid = item.specs ? Object.entries(item.specs).map(([key, val]) => {
      return `<div class="product-review__spec"><strong>${capitalizeFirst(key.replace(/_/g, ' '))}</strong>${escapeSpecialChars(val)}</div>`;
    }).join('\n              ') : '';

    const prosHtml = (item.avantaje || []).map(a => `<li>${escapeSpecialChars(a)}</li>`).join('\n                  ');
    const consHtml = (item.dezavantaje || []).map(d => `<li>${escapeSpecialChars(d)}</li>`).join('\n                  ');

    itemsHtml += `
          <article class="product-review" id="${slugify(stripStrong(item.name))}">
            <div class="product-review__header">
              ${item.tag ? `<span class="section-tag">${escapeSpecialChars(item.tag)}</span>` : ''}
              <h3>${stripStrong(escapeSpecialChars(item.name))}</h3>
              ${specsGrid ? `<div class="product-review__specs-grid">\n              ${specsGrid}\n            </div>` : ''}
            </div>
            <div class="product-review__content">
              ${processContentToHtml(item.review)}
              <div class="product-review__lists">
                <div>
                  <h4>Avantaje</h4>
                  <ul class="product-review__pros">
                  ${prosHtml}
                  </ul>
                </div>
                <div>
                  <h4>Dezavantaje</h4>
                  <ul class="product-review__cons">
                  ${consHtml}
                  </ul>
                </div>
              </div>
            </div>
          </article>`;
  });

  // Build comparison table HTML
  let comparisonHtml = '';
  if (content.comparison && content.comparison.rows && content.comparison.rows.length > 0) {
    const cols = Object.keys(content.comparison.rows[0]);
    const headerCells = cols.map(c => `<th>${capitalizeFirst(c.replace(/_/g, ' '))}</th>`).join('');
    const bodyRows = content.comparison.rows.map(row => {
      const cells = cols.map(c => `<td>${escapeSpecialChars(row[c] || '')}</td>`).join('');
      return `<tr>${cells}</tr>`;
    }).join('\n            ');

    comparisonHtml = `
        <section id="comparatie">
          <h2>Comparatie rapida</h2>
          ${content.comparison.intro ? `<p>${escapeSpecialChars(content.comparison.intro)}</p>` : ''}
          <div class="comparison-outer">
            <div class="comparison-hint"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg> Scroll pentru mai multe coloane</div>
            <div class="comparison-wrap">
              <table class="comparison-table">
                <thead><tr>${headerCells}</tr></thead>
                <tbody>
            ${bodyRows}
                </tbody>
              </table>
            </div>
          </div>
        </section>`;
  }

  // Build guide HTML
  let guideHtml = '';
  if (content.guide) {
    const guideTitle = stripStrong(escapeSpecialChars(content.guide.title || 'Cum alegi cel mai bun produs?'));
    guideHtml = `
        <section class="guide" id="ghid-cumparare">
          <h2>${guideTitle}</h2>
          ${processContentToHtml(content.guide.content)}
        </section>`;
  }

  // Build TOC HTML
  let tocHtml = '';
  (content.items || []).forEach((item) => {
    const itemId = slugify(stripStrong(item.name));
    tocHtml += `            <li><a href="#${itemId}">${stripStrong(escapeSpecialChars(item.name))}</a></li>\n`;
  });
  if (comparisonHtml) {
    tocHtml += `            <li><a href="#comparatie">Comparatie rapida</a></li>\n`;
  }
  if (guideHtml) {
    const guideTocTitle = stripStrong(escapeSpecialChars(content.guide.title || 'Ghid de cumparare'));
    tocHtml += `            <li><a href="#ghid-cumparare">${guideTocTitle}</a></li>\n`;
  }
  tocHtml += '            <li><a href="#faq">Intrebari Frecvente</a></li>';

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

  const faqJson = JSON.stringify((content.faq || []).map(item => ({ question: stripStrong(item.question), answer: stripStrong(item.answer) })));

  const pageContent = `---
import Layout from '../layouts/Layout.astro';
import SimilarArticles from '../components/SimilarArticles.astro';
import PrevNextNav from '../components/PrevNextNav.astro';
import keywordsData from '../../keywords.json';

const allArticles = (keywordsData.completed || []).map(item => ({
  title: item.keyword.charAt(0).toUpperCase() + item.keyword.slice(1),
  slug: item.keyword.toLowerCase()
    .replace(/ă/g, 'a').replace(/â/g, 'a').replace(/î/g, 'i')
    .replace(/ș/g, 's').replace(/ț/g, 't')
    .replace(/\\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
  category: item.category,
  categorySlug: item.categorySlug,
  date: item.date || new Date().toISOString()
}));

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
  title="${escapeForHtml(title)} - Bermo"
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
          ${introHtml}

          ${itemsHtml}

          ${comparisonHtml}

          ${guideHtml}
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

        <PrevNextNav
          currentSlug="${slug}"
          currentCategory="${categorySlug}"
          articles={allArticles}
        />
      </article>
    </div>
  </main>

  <script>
    // Comparison table scroll fade
    document.addEventListener('DOMContentLoaded', () => {
      document.querySelectorAll('.comparison-outer').forEach(outer => {
        const wrap = outer.querySelector('.comparison-wrap');
        if (!wrap) return;
        const check = () => {
          if (wrap.scrollWidth > wrap.clientWidth) {
            outer.classList.add('can-scroll');
          } else {
            outer.classList.remove('can-scroll');
          }
        };
        check();
        window.addEventListener('resize', check);
        wrap.addEventListener('scroll', () => {
          if (wrap.scrollLeft + wrap.clientWidth >= wrap.scrollWidth - 10) {
            outer.classList.remove('can-scroll');
          } else if (wrap.scrollWidth > wrap.clientWidth) {
            outer.classList.add('can-scroll');
          }
        });
      });

      // TOC active section tracking
      const tocLinks = document.querySelectorAll('.toc-list a');
      if (tocLinks.length > 0) {
        const ids = Array.from(tocLinks).map(a => a.getAttribute('href').replace('#', '')).filter(Boolean);
        const observer = new IntersectionObserver(entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              tocLinks.forEach(l => l.classList.remove('active'));
              const active = document.querySelector('.toc-list a[href="#' + entry.target.id + '"]');
              if (active) active.classList.add('active');
            }
          });
        }, { rootMargin: '-80px 0px -60% 0px', threshold: 0 });
        ids.forEach(id => {
          const el = document.getElementById(id);
          if (el) observer.observe(el);
        });
      }
    });
  </script>
</Layout>`;

  const filePath = path.join(ROOT_DIR, 'src', 'pages', `${slug}.astro`);
  fs.writeFileSync(filePath, pageContent);
  log(`  Article saved: ${slug}.astro`);

  return { title, slug, excerpt, success: true };
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
      const content = await generateArticleContent(item.keyword, item.category, keywordsData?.completed || []);
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
