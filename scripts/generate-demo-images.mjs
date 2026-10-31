/**
 * Generates the demo product SVGs found in public/images/products.
 *
 * These are deliberately small vector illustrations, not photos. Replace them
 * with real JPG/WebP photos before launch (see docs/PRODUCTS.md).
 *
 * Run: npm run images
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT_DIR = join(process.cwd(), 'public', 'images', 'products');

const COMMON_DEFS = `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#15181d"/>
      <stop offset="55%" stop-color="#0d0f12"/>
      <stop offset="100%" stop-color="#08090b"/>
    </linearGradient>
    <linearGradient id="metal" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f2f4f6"/>
      <stop offset="42%" stop-color="#b7bec7"/>
      <stop offset="55%" stop-color="#7b8490"/>
      <stop offset="100%" stop-color="#d7dce2"/>
    </linearGradient>
    <linearGradient id="darkmetal" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#3a414a"/>
      <stop offset="100%" stop-color="#171b20"/>
    </linearGradient>
    <linearGradient id="lens" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f7f9fb"/>
      <stop offset="45%" stop-color="#aeb7c2"/>
      <stop offset="100%" stop-color="#5d6672"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#e10600" stop-opacity=".30"/>
      <stop offset="100%" stop-color="#e10600" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M40 0H0V40" fill="none" stroke="#ffffff" stroke-opacity=".045" stroke-width="1"/>
    </pattern>
    <filter id="blur"><feGaussianBlur stdDeviation="36"/></filter>
  </defs>`;

function frame(slug, index, accent, art) {
  const transform =
    index === 2
      ? 'translate(-104 -74) scale(1.26) rotate(-2 400 300)'
      : 'translate(0 0)';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600" role="img" aria-label="Demo product illustration">
  <title>${slug} — demo illustration ${index}</title>
  ${COMMON_DEFS}
  <rect width="800" height="600" fill="url(#bg)"/>
  <rect width="800" height="600" fill="url(#grid)"/>
  <ellipse cx="${index === 2 ? 250 : 570}" cy="${index === 2 ? 160 : 110}" rx="300" ry="230" fill="${accent}" opacity=".16" filter="url(#blur)"/>
  <ellipse cx="400" cy="510" rx="270" ry="34" fill="#000000" opacity=".5" filter="url(#blur)"/>
  <g transform="${transform}" stroke-linecap="round" stroke-linejoin="round">
    ${art}
  </g>
  <g font-family="Segoe UI, Arial, sans-serif">
    <rect x="28" y="28" width="112" height="24" fill="none" stroke="${accent}" stroke-opacity=".65"/>
    <text x="40" y="45" fill="${accent}" font-size="10" font-weight="700" letter-spacing="2.4">DEMO ASSET</text>
    <text x="28" y="556" fill="#8e97a2" font-size="12" letter-spacing=".6">Demo product image · replace with a real photo</text>
    <text x="28" y="576" fill="#5b636d" font-size="12" font-family="Tahoma, Segoe UI, sans-serif">صورة منتج تجريبية · استبدلها بصورة حقيقية</text>
    <text x="772" y="556" fill="#4d545d" font-size="11" text-anchor="end">VIEW 0${index} / 02</text>
  </g>
</svg>`;
}

const ART = {
  'led-headlights': `
    <g>
      <rect x="82" y="196" width="286" height="218" rx="34" fill="#0f1216" stroke="#6f7883" stroke-width="3"/>
      <rect x="432" y="196" width="286" height="218" rx="34" fill="#0f1216" stroke="#6f7883" stroke-width="3"/>
      <circle cx="205" cy="305" r="78" fill="#080a0d" stroke="url(#metal)" stroke-width="8"/>
      <circle cx="205" cy="305" r="56" fill="url(#lens)" opacity=".9"/>
      <circle cx="205" cy="305" r="22" fill="#e10600" opacity=".75"/>
      <circle cx="555" cy="305" r="78" fill="#080a0d" stroke="url(#metal)" stroke-width="8"/>
      <circle cx="555" cy="305" r="56" fill="url(#lens)" opacity=".9"/>
      <circle cx="555" cy="305" r="22" fill="#e10600" opacity=".75"/>
      <path d="M118 236h60M118 254h34" stroke="#e10600" stroke-width="6"/>
      <path d="M468 236h60M468 254h34" stroke="#e10600" stroke-width="6"/>
      <path d="M120 372h84M500 372h84" stroke="#6f7883" stroke-width="3"/>
      <path d="M205 227v-14M555 227v-14" stroke="#aab2bc" stroke-width="3"/>
      <path d="M132 300h20M482 300h20" stroke="#aab2bc" stroke-width="3"/>
    </g>`,
  'motorcycle-phone-holder': `
    <g>
      <rect x="76" y="424" width="648" height="42" rx="21" fill="url(#metal)" stroke="#4e5661" stroke-width="2"/>
      <rect x="190" y="408" width="86" height="74" rx="12" fill="url(#darkmetal)" stroke="#737d88" stroke-width="3"/>
      <rect x="524" y="408" width="86" height="74" rx="12" fill="url(#darkmetal)" stroke="#737d88" stroke-width="3"/>
      <rect x="348" y="360" width="104" height="74" rx="10" fill="#1b2026" stroke="#7b8590" stroke-width="3"/>
      <path d="M382 426v-36h36v36" fill="none" stroke="#9aa3ae" stroke-width="4"/>
      <rect x="286" y="108" width="228" height="306" rx="28" fill="#0a0d10" stroke="url(#metal)" stroke-width="5"/>
      <rect x="300" y="128" width="200" height="266" rx="16" fill="#111820" stroke="#3f4853" stroke-width="2"/>
      <path d="M318 330l48-62 42 38 30-44 44 66" fill="none" stroke="#3f6575" stroke-width="4"/>
      <path d="M318 198c48 10 70 56 118 42s54 18 64 56" fill="none" stroke="#e10600" stroke-width="5"/>
      <circle cx="400" cy="300" r="8" fill="#e10600"/>
      <path d="M306 386h188" stroke="#e10600" stroke-width="6"/>
      <path d="M272 150c-28 26-28 60 0 86M538 150c28 26 28 60 0 86" fill="none" stroke="#e10600" stroke-width="4"/>
      <path d="M198 470h404" stroke="#4e5661" stroke-width="2" stroke-dasharray="7 9"/>
      <path d="M596 316c10-8 10-18 0-26M620 330c18-16 18-36 0-52" fill="none" stroke="#9aa3ae" stroke-width="3" opacity=".7"/>
    </g>`,
  'car-floor-mats': `
    <g>
      <path d="M92 448L182 244q10-22 34-22h206v226z" fill="#171b20" stroke="#7d8792" stroke-width="4"/>
      <path d="M108 434L192 254q6-12 22-12h188v192z" fill="none" stroke="#414a55" stroke-width="3"/>
      <path d="M150 402L218 268M190 414L254 268M230 414L290 268M270 414L326 268" stroke="#2b323a" stroke-width="18"/>
      <path d="M122 444L204 262" stroke="#e10600" stroke-width="5"/>
      <path d="M488 448V198q0-24 24-24h208v226z" fill="#171b20" stroke="#7d8792" stroke-width="4" transform="rotate(0 0 0)"/>
      <path d="M504 430V208q0-14 16-14h180v208z" fill="none" stroke="#414a55" stroke-width="3"/>
      <g fill="#252c34" stroke="#3b444e" stroke-width="2">
        <path d="M560 246l22 13v26l-22 13-22-13v-26z"/>
        <path d="M626 246l22 13v26l-22 13-22-13v-26z"/>
        <path d="M593 300l22 13v26l-22 13-22-13v-26z"/>
        <path d="M560 354l22 13v26l-22 13-22-13v-26z"/>
        <path d="M626 354l22 13v26l-22 13-22-13v-26z"/>
      </g>
      <path d="M512 424V206" stroke="#e10600" stroke-width="5"/>
      <path d="M688 190v236" stroke="#5c6570" stroke-width="2" stroke-dasharray="6 8"/>
    </g>`,
  'front-brake-pads': `
    <g>
      <g transform="rotate(-9 400 300)">
        <rect x="128" y="226" width="252" height="148" rx="16" fill="url(#metal)" stroke="#5d6671" stroke-width="3"/>
        <rect x="150" y="248" width="208" height="104" rx="10" fill="#1b2026" stroke="#49525d" stroke-width="3"/>
        <path d="M168 268h172M168 332h172" stroke="#e10600" stroke-width="3" opacity=".8"/>
        <circle cx="166" cy="248" r="7" fill="#0a0c0f" stroke="#88919c" stroke-width="2"/>
        <circle cx="342" cy="248" r="7" fill="#0a0c0f" stroke="#88919c" stroke-width="2"/>
        <path d="M180 300h148" stroke="#5d6671" stroke-width="2" stroke-dasharray="5 7"/>
      </g>
      <g transform="rotate(9 400 300) translate(290 0)">
        <rect x="128" y="226" width="252" height="148" rx="16" fill="url(#metal)" stroke="#5d6671" stroke-width="3"/>
        <rect x="150" y="248" width="208" height="104" rx="10" fill="#1b2026" stroke="#49525d" stroke-width="3"/>
        <path d="M168 268h172M168 332h172" stroke="#e10600" stroke-width="3" opacity=".8"/>
        <circle cx="166" cy="248" r="7" fill="#0a0c0f" stroke="#88919c" stroke-width="2"/>
        <circle cx="342" cy="248" r="7" fill="#0a0c0f" stroke="#88919c" stroke-width="2"/>
        <path d="M180 300h148" stroke="#5d6671" stroke-width="2" stroke-dasharray="5 7"/>
      </g>
      <path d="M110 486h580" stroke="#3c444e" stroke-width="2" stroke-dasharray="4 10"/>
    </g>`,
  'motorcycle-chain-kit': `
    <g>
      <circle cx="294" cy="324" r="150" fill="#101418" stroke="#cfd5dc" stroke-width="26" stroke-dasharray="9 13"/>
      <circle cx="294" cy="324" r="132" fill="none" stroke="#5f6873" stroke-width="3"/>
      <circle cx="294" cy="324" r="58" fill="#151a1f" stroke="#9aa3ae" stroke-width="5"/>
      <circle cx="294" cy="324" r="18" fill="#e10600"/>
      <g fill="#0b0e11" stroke="#7e8792" stroke-width="3">
        <circle cx="294" cy="210" r="11"/><circle cx="380" cy="258" r="11"/>
        <circle cx="404" cy="350" r="11"/><circle cx="336" cy="424" r="11"/>
        <circle cx="240" cy="424" r="11"/><circle cx="184" cy="356" r="11"/>
        <circle cx="192" cy="262" r="11"/><circle cx="250" cy="208" r="11"/>
      </g>
      <path d="M294 174C452 130 612 206 626 352c8 88-38 140-104 164" fill="none" stroke="#1b2026" stroke-width="26"/>
      <path d="M294 174C452 130 612 206 626 352c8 88-38 140-104 164" fill="none" stroke="#aab2bc" stroke-width="8" stroke-dasharray="12 9"/>
      <circle cx="610" cy="404" r="86" fill="#101418" stroke="#cfd5dc" stroke-width="18" stroke-dasharray="7 10"/>
      <circle cx="610" cy="404" r="56" fill="#151a1f" stroke="#6f7883" stroke-width="4"/>
      <circle cx="610" cy="404" r="12" fill="#e10600"/>
      <path d="M128 188l40-28 24 34-40 28z" fill="url(#metal)" stroke="#59626d" stroke-width="2"/>
    </g>`,
  'oil-filter': `
    <g>
      <rect x="292" y="152" width="216" height="316" rx="22" fill="url(#metal)" stroke="#5d6671" stroke-width="3"/>
      <ellipse cx="400" cy="152" rx="108" ry="30" fill="#d9dee4" stroke="#5d6671" stroke-width="3"/>
      <ellipse cx="400" cy="152" rx="76" ry="20" fill="#262c33" stroke="#8b949f" stroke-width="3"/>
      <path d="M348 152l14-24h76l14 24" fill="none" stroke="#8b949f" stroke-width="4"/>
      <rect x="292" y="226" width="216" height="86" fill="#e10600"/>
      <text x="400" y="278" fill="#ffffff" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="700" text-anchor="middle" letter-spacing="3">DEMO</text>
      <g stroke="#6d7681" stroke-width="2">
        <path d="M312 330v110M336 330v110M360 330v110M384 330v110M408 330v110M432 330v110M456 330v110M480 330v110"/>
      </g>
      <path d="M292 462h216" stroke="#5d6671" stroke-width="3"/>
      <path d="M320 482h160" stroke="#e10600" stroke-width="5"/>
      <path d="M400 94v30" stroke="#aab2bc" stroke-width="3" stroke-dasharray="4 6"/>
      <circle cx="400" cy="84" r="8" fill="none" stroke="#e10600" stroke-width="3"/>
    </g>`,
  'car-seat-covers': `
    <g>
      <rect x="270" y="84" width="160" height="96" rx="34" fill="#191e24" stroke="#8c95a0" stroke-width="4"/>
      <path d="M244 228q0-52 52-58h136q54 8 54 62v160q0 54-54 62H302q-58-8-58-62z" fill="#1b2026" stroke="#8c95a0" stroke-width="4"/>
      <path d="M282 238q0-30 30-34h96q30 4 30 34v132q0 32-30 36h-96q-30-4-30-36z" fill="none" stroke="#e10600" stroke-width="4" stroke-dasharray="10 7"/>
      <path d="M300 280h120M300 316h120M300 352h120" stroke="#39414b" stroke-width="3"/>
      <path d="M254 470q-6 42 38 46h248q44-4 38-46v-30H254z" fill="#1b2026" stroke="#8c95a0" stroke-width="4"/>
      <path d="M274 450h276" stroke="#e10600" stroke-width="4"/>
      <path d="M340 462v24M400 462v24M460 462v24" stroke="#4a535e" stroke-width="3"/>
      <g fill="#2b323a" stroke="#4a535e" stroke-width="1.5">
        <circle cx="320" cy="404" r="3"/><circle cx="356" cy="404" r="3"/>
        <circle cx="392" cy="404" r="3"/><circle cx="428" cy="404" r="3"/>
        <circle cx="464" cy="404" r="3"/>
      </g>
      <path d="M500 150c34 30 34 80 0 110M526 132c48 44 48 112 0 156" fill="none" stroke="#414a55" stroke-width="3" stroke-dasharray="5 7"/>
    </g>`,
  'motorcycle-led-turn-signals': `
    <g>
      <g transform="rotate(-12 280 300)">
        <rect x="196" y="238" width="170" height="118" rx="58" fill="#11151a" stroke="url(#metal)" stroke-width="4"/>
        <ellipse cx="282" cy="297" rx="62" ry="38" fill="#e8a33e" opacity=".85"/>
        <ellipse cx="282" cy="297" rx="38" ry="20" fill="#ffe1a6"/>
        <circle cx="282" cy="297" r="9" fill="#fff5d6"/>
        <path d="M296 356h42v42h-42z" fill="#242a31" stroke="#737d88" stroke-width="3"/>
        <path d="M338 377h52" stroke="#aab2bc" stroke-width="7"/>
      </g>
      <g transform="rotate(12 520 300)">
        <rect x="434" y="238" width="170" height="118" rx="58" fill="#11151a" stroke="url(#metal)" stroke-width="4"/>
        <ellipse cx="520" cy="297" rx="62" ry="38" fill="#e8a33e" opacity=".85"/>
        <ellipse cx="520" cy="297" rx="38" ry="20" fill="#ffe1a6"/>
        <circle cx="520" cy="297" r="9" fill="#fff5d6"/>
        <path d="M464 356h-42v42h42z" fill="#242a31" stroke="#737d88" stroke-width="3"/>
        <path d="M422 377h-52" stroke="#aab2bc" stroke-width="7"/>
      </g>
      <path d="M164 190l-34-20M636 190l34-20M400 142v-34" stroke="#e8a33e" stroke-width="4" opacity=".8"/>
      <path d="M138 416l-28 18M662 416l28 18" stroke="#e10600" stroke-width="4" opacity=".65"/>
      <circle cx="282" cy="297" r="92" fill="none" stroke="#e8a33e" stroke-width="1" opacity=".22"/>
      <circle cx="520" cy="297" r="92" fill="none" stroke="#e8a33e" stroke-width="1" opacity=".22"/>
    </g>`,
};

mkdirSync(OUT_DIR, { recursive: true });

let count = 0;
for (const [slug, art] of Object.entries(ART)) {
  for (const index of [1, 2]) {
    const accent = slug.includes('turn-signals') ? '#e8a33e' : '#e10600';
    writeFileSync(join(OUT_DIR, `${slug}-${index}.svg`), frame(slug, index, accent, art), 'utf8');
    count += 1;
  }
}

// Fallback used when a product has no images configured.
const placeholder = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <rect width="800" height="600" fill="#111317"/>
  <rect x="1" y="1" width="798" height="598" fill="none" stroke="#262a30" stroke-width="2"/>
  <g fill="none" stroke="#4e5661" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
    <rect x="310" y="210" width="180" height="150" rx="12"/>
    <circle cx="355" cy="255" r="16"/>
    <path d="M320 345l58-58 40 40 26-26 36 44"/>
  </g>
  <text x="400" y="420" fill="#6f7782" font-family="Segoe UI, Arial, sans-serif" font-size="14" text-anchor="middle">Product image</text>
</svg>`;
writeFileSync(join(OUT_DIR, 'placeholder.svg'), placeholder, 'utf8');

console.log(`Generated ${count} demo product images + placeholder in public/images/products`);