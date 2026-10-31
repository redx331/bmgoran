const PRODUCT_WIDTH = 1200;
const PRODUCT_HEIGHT = 900;
const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const FONT = '"Segoe UI", Arial, Helvetica, sans-serif';

type Drawable = ImageBitmap | HTMLImageElement;

function sourceSize(source: Drawable): { width: number; height: number } {
  if ('naturalWidth' in source) {
    return { width: source.naturalWidth, height: source.naturalHeight };
  }
  return { width: source.width, height: source.height };
}

async function loadSource(source: Blob | string): Promise<Drawable> {
  if (typeof source !== 'string' && typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(source);
    } catch {
      // Fall through to an <img> element (some browsers reject certain blobs).
    }
  }

  const url = typeof source === 'string' ? source : URL.createObjectURL(source);
  try {
    const image = new Image();
    image.decoding = 'async';
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Image illisible'));
      image.src = url;
    });
    return image;
  } finally {
    if (typeof source !== 'string') URL.revokeObjectURL(url);
  }
}

function drawCover(
  context: CanvasRenderingContext2D,
  source: Drawable,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  const { width: sourceWidth, height: sourceHeight } = sourceSize(source);
  if (!sourceWidth || !sourceHeight) return;
  const scale = Math.max(width / sourceWidth, height / sourceHeight);
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  context.drawImage(
    source,
    x + (width - drawWidth) / 2,
    y + (height - drawHeight) / 2,
    drawWidth,
    drawHeight,
  );
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Export d’image impossible'))),
      type,
      quality,
    );
  });
}

/** Resizes and compresses an uploaded photo to a 1200×900 JPEG (4:3). */
export async function prepareProductImage(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Choisissez un fichier image (JPEG, PNG ou WebP).');
  }
  if (file.size > 20 * 1024 * 1024) {
    throw new Error('Cette image dépasse 20 Mo. Utilisez une photo plus légère.');
  }

  const source = await loadSource(file);
  const canvas = document.createElement('canvas');
  canvas.width = PRODUCT_WIDTH;
  canvas.height = PRODUCT_HEIGHT;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Ce navigateur ne peut pas préparer les images.');

  context.fillStyle = '#0b0c0e';
  context.fillRect(0, 0, PRODUCT_WIDTH, PRODUCT_HEIGHT);
  drawCover(context, source, 0, 0, PRODUCT_WIDTH, PRODUCT_HEIGHT);
  if ('close' in source) source.close();

  return canvasToBlob(canvas, 'image/jpeg', 0.86);
}

function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  let truncated = false;

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (context.measureText(candidate).width <= maxWidth) {
      line = candidate;
      continue;
    }
    if (line) lines.push(line);
    line = word;
    if (lines.length === maxLines) {
      truncated = true;
      break;
    }
  }

  if (!truncated && line && lines.length < maxLines) lines.push(line);
  if (truncated) {
    let last = lines[maxLines - 1] ?? '';
    while (last && context.measureText(`${last}…`).width > maxWidth) {
      last = last.slice(0, -1);
    }
    lines[maxLines - 1] = `${last.trimEnd()}…`;
  }

  return lines;
}

export interface OgImageOptions {
  name: string;
  price: string;
  brand: string;
  mark: string;
  domain: string;
  demo: boolean;
  image: Blob | string | null;
}

/** Builds a branded 1200×630 social image so new products never ship a broken preview. */
export async function buildOgImage(options: OgImageOptions): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = OG_WIDTH;
  canvas.height = OG_HEIGHT;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Ce navigateur ne peut pas générer l’image de partage.');

  context.fillStyle = '#0b0c0e';
  context.fillRect(0, 0, OG_WIDTH, OG_HEIGHT);

  if (options.image) {
    try {
      const source = await loadSource(options.image);
      drawCover(context, source, 0, 0, OG_WIDTH, OG_HEIGHT);
      if ('close' in source) source.close();
    } catch {
      // Keep the dark background if the photo cannot be read.
    }
  }

  const gradient = context.createLinearGradient(0, 0, OG_WIDTH, 0);
  gradient.addColorStop(0, 'rgba(11,12,14,0.97)');
  gradient.addColorStop(0.55, 'rgba(11,12,14,0.86)');
  gradient.addColorStop(1, 'rgba(11,12,14,0.35)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, OG_WIDTH, OG_HEIGHT);

  context.fillStyle = '#e10600';
  context.fillRect(0, 0, OG_WIDTH, 8);

  const markSize = 62;
  context.fillStyle = '#e10600';
  context.fillRect(64, 64, markSize, markSize);
  context.fillStyle = '#ffffff';
  context.font = `800 24px ${FONT}`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(options.mark.slice(0, 3), 64 + markSize / 2, 64 + markSize / 2 + 1);
  context.textAlign = 'left';
  context.textBaseline = 'alphabetic';

  context.fillStyle = '#f5f6f7';
  context.font = `700 30px ${FONT}`;
  context.fillText(options.brand, 64 + markSize + 18, 96);

  context.fillStyle = '#ff4d47';
  context.font = `700 16px ${FONT}`;
  context.fillText('COMMANDE WHATSAPP · 58 WILAYAS', 64, 190);

  context.fillStyle = '#f5f6f7';
  context.font = `800 54px ${FONT}`;
  const lines = wrapText(context, options.name, 700, 3);
  lines.forEach((line, index) => {
    context.fillText(line, 64, 262 + index * 62);
  });

  const priceY = 262 + lines.length * 62 + 26;
  context.fillStyle = '#ffffff';
  context.font = `800 34px ${FONT}`;
  context.fillText(options.price, 64, priceY);

  if (options.demo) {
    context.fillStyle = '#ffb4b0';
    context.font = `600 16px ${FONT}`;
    context.fillText('Prix de démonstration — à remplacer', 64, priceY + 34);
  }

  context.fillStyle = '#a7aeb7';
  context.font = `500 17px ${FONT}`;
  context.fillText(options.domain, 64, OG_HEIGHT - 46);

  return canvasToBlob(canvas, 'image/png');
}
