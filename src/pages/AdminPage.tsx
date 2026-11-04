import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { ProductEditor, type PendingImage } from '../components/admin/ProductEditor';
import { ProductList } from '../components/admin/ProductList';
import { Icon } from '../components/Icon';
import { SITE } from '../config/business';
import type { CategoryId, Product, Specification } from '../data/products';
import { filterByCategory, searchProducts, PRODUCTS } from '../data/products';
import {
  createEmptyProduct,
  emptySpecification,
  nextImagePath,
  prepareProduct,
  productsToJson,
  removeProduct,
  uniqueSlug,
  upsertProduct,
  validateProduct,
  type ProductErrors,
} from '../lib/admin/catalogue';
import {
  commitChanges,
  getSession,
  loadCatalogue,
  login as adminLogin,
  logout as adminLogout,
  type AdminSession,
} from '../lib/admin/api';
import { GitHubError, type FileChange } from '../lib/admin/github';
import { buildOgImage, prepareProductImage } from '../lib/admin/image';
import {
  clearLocalData,
  deleteLocalImage,
  loadLocalImages,
  loadLocalProducts,
  putLocalImage,
  saveLocalProducts,
} from '../lib/admin/local';
import { createZip, type ZipEntry } from '../lib/admin/zip';
import { formatPrice } from '../lib/format';
import { usePageMeta } from '../lib/seo';
import '../admin.css';

const BRANCH = SITE.branch || 'main';
const MAX_IMAGES = 8;

type Phase = 'login' | 'connecting' | 'ready';

interface Notice {
  kind: 'success' | 'error' | 'info';
  text: string;
  url?: string;
}

function errorMessage(error: unknown): string {
  if (error instanceof GitHubError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return 'Une erreur est survenue. Vérifiez votre connexion puis réessayez.';
}

function hostOf(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/\/+$/, '');
}

function collectImagePaths(products: Product[]): string[] {
  return Array.from(new Set(products.flatMap((product) => product.images)));
}

async function fetchImageBlob(path: string): Promise<Blob | null> {
  try {
    const response = await fetch(path, { cache: 'no-store' });
    if (!response.ok) return null;
    return await response.blob();
  } catch {
    return null;
  }
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function bundleReadme(productCount: number, imageCount: number, generatedAt: Date): string {
  return [
    'BMG Oran — catalogue exporté depuis le mode local de l’administration',
    '',
    `Date : ${generatedAt.toLocaleString('fr-FR')}`,
    `Produits : ${productCount}`,
    `Photos : ${imageCount}`,
    '',
    'Contenu du dossier :',
    '  src/data/products.json      → catalogue complet (noms, prix, descriptions, stocks)',
    '  public/images/products/     → photos des produits (JPEG 1200 × 900, SVG de démo conservés)',
    '  public/og/                  → images de partage (PNG 1200 × 630)',
    '',
    'Comment publier :',
    '  1. Décompressez ce dossier à la racine du projet, en remplaçant les fichiers existants.',
    '  2. Vérifiez les changements : git status',
    '  3. git add src/data/products.json public/images/products public/og',
    '  4. git commit -m "Catalogue : mise à jour depuis l’administration locale"',
    '  5. git push',
    '',
    'Cloudflare Pages republie le site automatiquement après le push (1 à 2 minutes).',
    'Les photos ajoutées en mode local restent dans ce navigateur tant que vous ne videz pas',
    'les données du site ; conservez ce fichier ZIP comme sauvegarde.',
    '',
  ].join('\n');
}

export function AdminPage() {
  usePageMeta({
    title: `Administration — ${SITE.businessName}`,
    description: 'Espace privé de gestion du catalogue.',
    path: '/admin',
    locale: 'fr',
    noindex: true,
  });

  const [session, setSession] = useState<AdminSession | null>(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [phase, setPhase] = useState<Phase>('connecting');
  const [repo, setRepo] = useState(SITE.repository);

  const [isLocalMode, setIsLocalMode] = useState(false);
  const [products, setProducts] = useState<Product[] | null>(null);
  const [draft, setDraft] = useState<Product | null>(null);
  const [originalSlug, setOriginalSlug] = useState<string | null>(null);
  const [errors, setErrors] = useState<ProductErrors>({});
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [removedImages, setRemovedImages] = useState<string[]>([]);
  const [slugLocked, setSlugLocked] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [deleteArmed, setDeleteArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryId | 'all'>('all');

  const previewsRef = useRef(previews);
  previewsRef.current = previews;

  const login = session?.login ?? (isLocalMode ? 'local' : '');
  const activeBranch = session?.branch || BRANCH;

  const revokePreviews = useCallback((paths: string[]) => {
    setPreviews((current) => {
      const next = { ...current };
      for (const path of paths) {
        const url = next[path];
        if (url) URL.revokeObjectURL(url);
        delete next[path];
      }
      return next;
    });
  }, []);

  useEffect(
    () => () => {
      for (const url of Object.values(previewsRef.current)) URL.revokeObjectURL(url);
    },
    [],
  );

  const applySession = useCallback(async (next: AdminSession) => {
    setSession(next);
    setRepo(next.repository);
    setPhase('ready');

    try {
      const snapshot = await loadCatalogue();
      setProducts(snapshot.products);
    } catch (error) {
      // The login itself succeeded; only the GitHub side is unavailable. Keep the
      // dashboard open so the message is not mistaken for a wrong password.
      setProducts([]);
      setNotice({
        kind: 'error',
        text: `Connexion réussie, mais le catalogue n’a pas pu être chargé. ${errorMessage(error)}`,
      });
    }
  }, []);

  const restoreSession = useCallback(async () => {
    try {
      const next = await getSession();
      await applySession(next);
    } catch (error) {
      setSession(null);
      setProducts(null);
      setPhase('login');
      const status = error instanceof GitHubError ? error.status : 0;
      setLoginError(status && status !== 401 ? errorMessage(error) : '');
    }
  }, [applySession]);

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  const connect = useCallback(
    async (username: string, password: string) => {
      setPhase('connecting');
      setLoginError('');
      setNotice(null);
      try {
        const next = await adminLogin(username, password);
        await applySession(next);
        setPasswordInput('');
      } catch (error) {
        setSession(null);
        setProducts(null);
        setPhase('login');
        setLoginError(errorMessage(error));
      }
    },
    [applySession],
  );

  function disconnect() {
    void adminLogout().catch(() => {});
    revokePreviews(Object.keys(previewsRef.current));
    setIsLocalMode(false);
    setSession(null);
    setUsernameInput('');
    setPasswordInput('');
    setProducts(null);
    setDraft(null);
    setOriginalSlug(null);
    setErrors({});
    setPendingImages([]);
    setRemovedImages([]);
    setDirty(false);
    setDeleteArmed(false);
    setNotice(null);
    setLoginError('');
    setPhase('login');
  }

  const hydrateLocalPreviews = useCallback(async (items: Product[]) => {
    const paths = collectImagePaths(items);
    const blobs = await loadLocalImages(paths);
    if (blobs.size === 0) return;
    setPreviews((current) => {
      const next = { ...current };
      for (const [path, blob] of blobs) {
        if (!next[path]) next[path] = URL.createObjectURL(blob);
      }
      return next;
    });
  }, []);

  const startLocalMode = useCallback(() => {
    const stored = loadLocalProducts(PRODUCTS);
    setIsLocalMode(true);
    setRepo('Mode local (sans GitHub)');
    setProducts(stored.products);
    setPhase('ready');
    setNotice({
      kind: 'info',
      text: stored.restored
        ? `Mode local actif : catalogue restauré depuis ce navigateur${
            stored.savedAt
              ? ` (enregistré le ${new Date(stored.savedAt).toLocaleString('fr-FR')})`
              : ''
          }.`
        : 'Mode local actif : vos modifications et vos photos sont enregistrées dans ce navigateur, puis exportables en dossier ZIP.',
    });
    void hydrateLocalPreviews(stored.products);
  }, [hydrateLocalPreviews]);

  const exportBundle = useCallback(async () => {
    if (!products || !isLocalMode) return;
    setBusy(true);
    setNotice({
      kind: 'info',
      text: 'Préparation du dossier ZIP (photos et images de partage)…',
    });
    try {
      const paths = collectImagePaths(products);
      const saved = await loadLocalImages(paths);
      const images = new Map<string, Blob>(saved);
      for (const image of pendingImages) images.set(image.path, image.blob);

      const entries: ZipEntry[] = [
        { path: 'src/data/products.json', data: productsToJson(products) },
      ];

      let missing = 0;
      for (const path of paths) {
        let blob = images.get(path) ?? null;
        if (!blob) {
          blob = await fetchImageBlob(path);
          if (blob) images.set(path, blob);
        }
        if (blob) entries.push({ path: `public${path}`, data: blob });
        else missing += 1;
      }

      for (const product of products) {
        const firstImage = product.images[0];
        const ogBlob = await buildOgImage({
          name: product.nameFr,
          price: formatPrice(product.price, 'fr'),
          brand: SITE.businessName,
          mark: SITE.brandMark,
          domain: hostOf(SITE.siteUrl),
          demo: product.isDemo,
          image: firstImage ? images.get(firstImage) ?? firstImage : null,
        });
        entries.push({ path: `public/og/${product.slug}.png`, data: ogBlob });
      }

      const generatedAt = new Date();
      entries.push({
        path: 'LISEZ-MOI.txt',
        data: bundleReadme(products.length, paths.length - missing, generatedAt),
      });

      const zip = await createZip(entries);
      downloadBlob(zip, `bmg-oran-catalogue-${generatedAt.toISOString().slice(0, 10)}.zip`);
      setNotice({
        kind: missing > 0 ? 'info' : 'success',
        text:
          missing > 0
            ? `Dossier ZIP téléchargé. ${missing} photo(s) n’ont pas pu être lues et sont absentes de l’archive.`
            : `Dossier ZIP téléchargé : ${products.length} produit(s), ${paths.length} photo(s) et les images de partage. Décompressez-le à la racine du projet puis commitez.`,
      });
    } catch (error) {
      setNotice({ kind: 'error', text: errorMessage(error) });
    } finally {
      setBusy(false);
    }
  }, [isLocalMode, pendingImages, products]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextUsername = usernameInput.trim();
    const nextPassword = passwordInput;
    if (!nextUsername || !nextPassword) {
      setLoginError('Renseignez votre identifiant et votre mot de passe.');
      return;
    }
    await connect(nextUsername, nextPassword);
  }

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return filterByCategory(searchProducts(query, products), category);
  }, [category, products, query]);

  function confirmDiscard(): boolean {
    if (!dirty) return true;
    return window.confirm('Abandonner les modifications non enregistrées ?');
  }

  function clearPending() {
    revokePreviews(pendingImages.map((image) => image.path));
    setPendingImages([]);
  }

  function openProduct(product: Product) {
    if (!confirmDiscard()) return;
    clearPending();
    setDraft(product);
    setOriginalSlug(product.slug);
    setErrors({});
    setRemovedImages([]);
    setDirty(false);
    setDeleteArmed(false);
    setSlugLocked(true);
    setNotice(null);
  }

  function openNew() {
    if (!confirmDiscard()) return;
    clearPending();
    const product = createEmptyProduct(products ?? []);
    setDraft(product);
    setOriginalSlug(null);
    setErrors({});
    setRemovedImages([]);
    setDirty(false);
    setDeleteArmed(false);
    setSlugLocked(false);
    setNotice(null);
  }

  function closeEditor() {
    if (!confirmDiscard()) return;
    clearPending();
    setDraft(null);
    setOriginalSlug(null);
    setErrors({});
    setRemovedImages([]);
    setDirty(false);
    setDeleteArmed(false);
  }

  function patchDraft(patch: Partial<Product>) {
    setDraft((current) => (current ? { ...current, ...patch } : current));
    setDirty(true);
  }

  function handleNameFrChange(value: string) {
    setDraft((current) => {
      if (!current) return current;
      const next = { ...current, nameFr: value };
      if (!slugLocked) {
        next.slug = uniqueSlug(value || 'nouveau-produit', products ?? [], originalSlug);
      }
      return next;
    });
    setDirty(true);
  }

  function handleSlugChange(value: string) {
    setSlugLocked(true);
    patchDraft({ slug: value.toLowerCase().replace(/\s+/g, '-') });
  }

  function handleSpecChange(index: number, patch: Partial<Specification>) {
    setDraft((current) => {
      if (!current) return current;
      const specifications = current.specifications.map((spec, position) =>
        position === index ? { ...spec, ...patch } : spec,
      );
      return { ...current, specifications };
    });
    setDirty(true);
  }

  function addSpec() {
    setDraft((current) =>
      current
        ? { ...current, specifications: [...current.specifications, emptySpecification()] }
        : current,
    );
    setDirty(true);
  }

  function removeSpec(index: number) {
    setDraft((current) =>
      current
        ? {
            ...current,
            specifications: current.specifications.filter(
              (_, position) => position !== index,
            ),
          }
        : current,
    );
    setDirty(true);
  }

  async function handleAddImages(files: FileList | null) {
    if (!files || files.length === 0 || !draft) return;
    const selected = Array.from(files);
    if (draft.images.length + selected.length > MAX_IMAGES) {
      setNotice({
        kind: 'error',
        text: `Maximum ${MAX_IMAGES} photos par produit. Supprimez une photo avant d’en ajouter.`,
      });
      return;
    }

    setImageBusy(true);
    const added: PendingImage[] = [];
    const addedPreviews: Record<string, string> = {};
    try {
      for (const file of selected) {
        const blob = await prepareProductImage(file);
        const existing = [
          ...draft.images,
          ...added.map((image) => image.path),
        ];
        const path = nextImagePath(draft.slug || 'produit', existing);
        added.push({ path, blob });
        addedPreviews[path] = URL.createObjectURL(blob);
      }
      setPendingImages((current) => [...current, ...added]);
      setPreviews((current) => ({ ...current, ...addedPreviews }));
      setDraft((current) =>
        current ? { ...current, images: [...current.images, ...added.map((image) => image.path)] } : current,
      );
      setDirty(true);
      setNotice(null);
    } catch (error) {
      for (const url of Object.values(addedPreviews)) URL.revokeObjectURL(url);
      setNotice({ kind: 'error', text: errorMessage(error) });
    } finally {
      setImageBusy(false);
    }
  }

  function handleRemoveImage(path: string) {
    if (!draft) return;
    revokePreviews([path]);
    const isPending = pendingImages.some((image) => image.path === path);
    if (isPending) {
      setPendingImages((current) => current.filter((image) => image.path !== path));
    } else {
      setRemovedImages((current) => (current.includes(path) ? current : [...current, path]));
    }
    setDraft((current) =>
      current ? { ...current, images: current.images.filter((image) => image !== path) } : current,
    );
    setDirty(true);
  }

  async function handleSave() {
    if ((!session && !isLocalMode) || !products || !draft) return;
    if (session && !session.canWrite) {
      setNotice({
        kind: 'error',
        text: 'Le jeton GitHub du serveur est en lecture seule : enregistrement impossible. Remplacez GITHUB_TOKEN par un jeton avec « Contents: Read and write ».',
      });
      return;
    }
    const prepared = prepareProduct(draft);
    const nextErrors = validateProduct(prepared, products, originalSlug);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setNotice({
        kind: 'error',
        text: 'Corrigez les champs indiqués avant d’enregistrer.',
      });
      return;
    }

    setBusy(true);
    setNotice(null);
    try {
      const nextProducts = upsertProduct(products, prepared, originalSlug);

      if (isLocalMode) {
        if (!saveLocalProducts(nextProducts)) {
          setNotice({
            kind: 'error',
            text: 'Impossible d’enregistrer dans ce navigateur : stockage plein ou désactivé. Exportez le ZIP pour conserver vos modifications.',
          });
          return;
        }

        const [imageWrites, imageDeletes] = await Promise.all([
          Promise.all(pendingImages.map((image) => putLocalImage(image.path, image.blob))),
          Promise.all(removedImages.map((path) => deleteLocalImage(path))),
        ]);
        const imagesSaved = imageWrites.every(Boolean) && imageDeletes.every(Boolean);

        setProducts(nextProducts);
        setDraft(prepared);
        setOriginalSlug(prepared.slug);
        setPendingImages([]);
        setRemovedImages([]);
        setErrors({});
        setDirty(false);
        setDeleteArmed(false);
        setSlugLocked(true);
        setNotice({
          kind: imagesSaved ? 'success' : 'info',
          text: imagesSaved
            ? 'Enregistré dans ce navigateur. Utilisez « Exporter le ZIP » pour ajouter ces fichiers au projet.'
            : 'Catalogue enregistré, mais certaines photos n’ont pas pu être stockées dans le navigateur. Exportez le ZIP pour les conserver.',
        });
        return;
      }

      const changes: FileChange[] = [
        { path: 'src/data/products.json', content: productsToJson(nextProducts) },
      ];

      for (const image of pendingImages) {
        changes.push({ path: `public${image.path}`, content: image.blob });
      }
      for (const path of removedImages) {
        changes.push({ path: `public${path}`, delete: true });
      }

      const firstImage = prepared.images[0];
      const firstPending = pendingImages.find((image) => image.path === firstImage);
      const ogSource = firstPending ? firstPending.blob : firstImage ?? null;
      const ogBlob = await buildOgImage({
        name: prepared.nameFr,
        price: formatPrice(prepared.price, 'fr'),
        brand: SITE.businessName,
        mark: SITE.brandMark,
        domain: hostOf(SITE.siteUrl),
        demo: prepared.isDemo,
        image: ogSource,
      });
      changes.push({ path: `public/og/${prepared.slug}.png`, content: ogBlob });
      if (originalSlug && originalSlug !== prepared.slug) {
        changes.push({ path: `public/og/${originalSlug}.png`, delete: true });
      }

      const result = await commitChanges(
        originalSlug
          ? `Admin : mettre à jour « ${prepared.nameFr} »`
          : `Admin : ajouter « ${prepared.nameFr} »`,
        changes,
      );

      setProducts(nextProducts);
      setDraft(prepared);
      setOriginalSlug(prepared.slug);
      setPendingImages([]);
      setRemovedImages([]);
      setErrors({});
      setDirty(false);
      setDeleteArmed(false);
      setSlugLocked(true);
      setNotice({
        kind: 'success',
        text: 'Modifications enregistrées. Cloudflare republie le site dans 1 à 2 minutes.',
        url: result.htmlUrl,
      });
    } catch (error) {
      setNotice({ kind: 'error', text: errorMessage(error) });
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if ((!session && !isLocalMode) || !products || !draft || !originalSlug) return;
    if (session && !session.canWrite) {
      setNotice({
        kind: 'error',
        text: 'Le jeton GitHub du serveur est en lecture seule : suppression impossible. Remplacez GITHUB_TOKEN par un jeton avec « Contents: Read and write ».',
      });
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      const nextProducts = removeProduct(products, originalSlug);

      if (isLocalMode) {
        if (!saveLocalProducts(nextProducts)) {
          setNotice({
            kind: 'error',
            text: 'Impossible de mettre à jour le stockage du navigateur : stockage plein ou désactivé.',
          });
          return;
        }

        const imagePaths = Array.from(new Set([...draft.images, ...removedImages]));
        await Promise.all(imagePaths.map((path) => deleteLocalImage(path)));
        revokePreviews(imagePaths);
        setProducts(nextProducts);
        setDraft(null);
        setOriginalSlug(null);
        setPendingImages([]);
        setRemovedImages([]);
        setErrors({});
        setDirty(false);
        setDeleteArmed(false);
        setNotice({
          kind: 'success',
          text: `« ${draft.nameFr} » a été supprimé. Le catalogue local a été mis à jour ; exportez le ZIP pour publier ce changement.`,
        });
        return;
      }

      const pendingPaths = new Set(pendingImages.map((image) => image.path));
      const imagePaths = new Set([
        ...draft.images.filter((image) => !pendingPaths.has(image)),
        ...removedImages,
      ]);
      const changes: FileChange[] = [
        { path: 'src/data/products.json', content: productsToJson(nextProducts) },
        ...[...imagePaths].map((path) => ({ path: `public${path}`, delete: true as const })),
        { path: `public/og/${originalSlug}.png`, delete: true },
      ];

      const result = await commitChanges(`Admin : supprimer « ${draft.nameFr} »`, changes);

      revokePreviews([...imagePaths]);
      setProducts(nextProducts);
      setDraft(null);
      setOriginalSlug(null);
      setPendingImages([]);
      setRemovedImages([]);
      setErrors({});
      setDirty(false);
      setDeleteArmed(false);
      setNotice({
        kind: 'success',
        text: `« ${draft.nameFr} » a été supprimé. Le site sera republié dans 1 à 2 minutes.`,
        url: result.htmlUrl,
      });
    } catch (error) {
      setNotice({ kind: 'error', text: errorMessage(error) });
    } finally {
      setBusy(false);
    }
  }

  async function reloadCatalogue() {
    if (!isLocalMode && !session) return;
    if (!confirmDiscard()) return;
    clearPending();
    setRemovedImages([]);
    setBusy(true);
    setNotice(null);
    try {
      if (isLocalMode) {
        const stored = loadLocalProducts(PRODUCTS);
        setProducts(stored.products);
        if (draft && originalSlug) {
          const fresh = stored.products.find((product) => product.slug === originalSlug);
          setDraft(fresh ?? null);
          if (!fresh) setOriginalSlug(null);
        }
        setDirty(false);
        setNotice({
          kind: 'info',
          text: stored.restored
            ? 'Catalogue local rechargé depuis ce navigateur.'
            : 'Aucun catalogue local enregistré : le catalogue d’origine est affiché.',
        });
        void hydrateLocalPreviews(stored.products);
        return;
      }

      const snapshot = await loadCatalogue();
      setProducts(snapshot.products);
      if (draft && originalSlug) {
        const fresh = snapshot.products.find((product) => product.slug === originalSlug);
        setDraft(fresh ?? null);
        if (!fresh) setOriginalSlug(null);
      }
      setDirty(false);
      setNotice({ kind: 'info', text: 'Catalogue rechargé depuis GitHub.' });
    } catch (error) {
      setNotice({ kind: 'error', text: errorMessage(error) });
    } finally {
      setBusy(false);
    }
  }

  async function resetLocalData() {
    if (!isLocalMode) return;
    const confirmed = window.confirm(
      'Supprimer le catalogue et les photos enregistrés dans ce navigateur ? Pensez à exporter le ZIP avant : cette action est irréversible.',
    );
    if (!confirmed) return;

    setBusy(true);
    setNotice(null);
    try {
      await clearLocalData();
      revokePreviews(Object.keys(previewsRef.current));
      setProducts(PRODUCTS);
      setDraft(null);
      setOriginalSlug(null);
      setPendingImages([]);
      setRemovedImages([]);
      setErrors({});
      setDirty(false);
      setDeleteArmed(false);
      setNotice({
        kind: 'info',
        text: 'Stockage local réinitialisé : le catalogue et les photos d’origine sont restaurés.',
      });
    } finally {
      setBusy(false);
    }
  }

  if (phase !== 'ready' || !products) {
    const connecting = phase === 'connecting';
    return (
      <div className="admin admin--login">
        <main className="admin-login">
          <div className="admin-login__card">
            <a className="admin-brand admin-brand--stacked" href="/">
              <span className="admin-brand__mark">{SITE.brandMark}</span>
              <span className="admin-brand__text">
                <strong>{SITE.businessName}</strong>
                <small>Administration</small>
              </span>
            </a>

            <h1>Connexion administrateur</h1>
            <p className="admin-login__lead">
              Connectez-vous avec votre identifiant et votre mot de passe pour ajouter des
              produits, modifier les prix et les photos. Chaque enregistrement met le site à jour
              automatiquement.
            </p>

            <form className="admin-login__form" onSubmit={handleLogin} noValidate>
              <div className="field">
                <label htmlFor="admin-username">Identifiant</label>
                <input
                  id="admin-username"
                  value={usernameInput}
                  dir="ltr"
                  autoComplete="username"
                  spellCheck={false}
                  disabled={connecting}
                  onChange={(event) => setUsernameInput(event.target.value)}
                />
              </div>

              <div className="field">
                <label htmlFor="admin-password">Mot de passe</label>
                <input
                  id="admin-password"
                  type="password"
                  value={passwordInput}
                  dir="ltr"
                  autoComplete="current-password"
                  disabled={connecting}
                  onChange={(event) => setPasswordInput(event.target.value)}
                />
                <p className="field-hint">
                  Identifiants définis dans les variables du serveur. Le jeton GitHub reste côté
                  serveur et n’est jamais envoyé au navigateur.
                </p>
              </div>

              {loginError ? (
                <p className="admin-error" role="alert">
                  {loginError}
                </p>
              ) : null}

              <button
                type="submit"
                className="btn btn--primary btn--block btn--lg"
                disabled={connecting}
              >
                {connecting ? 'Connexion…' : 'Se connecter'}
              </button>
            </form>

            <div className="admin-login__divider">
              <span>ou</span>
            </div>

            <button
              type="button"
              className="btn btn--ghost btn--block"
              onClick={startLocalMode}
            >
              Tester en mode local (sauvegarde dans ce navigateur)
            </button>
            <p className="field-hint admin-login__hint">
              Sans compte : vos produits, prix et photos sont enregistrés dans ce navigateur, puis
              exportables en dossier ZIP prêt à publier.
            </p>

            <a className="admin-login__back" href="/">
              <Icon name="arrow-left" size={15} />
              Retour à la boutique
            </a>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="admin">
      <header className="admin-bar">
        <div className="admin-bar__inner">
          <a className="admin-brand" href="/">
            <span className="admin-brand__mark">{SITE.brandMark}</span>
            <span className="admin-brand__text">
              <strong>{SITE.businessName}</strong>
              <small>Administration</small>
            </span>
          </a>

          <div className="admin-bar__meta">
            <span className="admin-bar__repo">
              {repo} · {activeBranch}
            </span>
            {login ? <span className="admin-bar__user">@{login}</span> : null}
            {isLocalMode && (
              <>
                <button
                  type="button"
                  className="btn btn--secondary btn--sm"
                  onClick={() => void exportBundle()}
                  disabled={busy}
                  title="Télécharger un dossier ZIP prêt à déposer dans le projet"
                >
                  <Icon name="download" size={14} />
                  Exporter le ZIP
                </button>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => void resetLocalData()}
                  disabled={busy}
                  title="Supprimer le catalogue et les photos enregistrés dans ce navigateur"
                >
                  Réinitialiser
                </button>
              </>
            )}
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => void reloadCatalogue()}
              disabled={busy}
            >
              Recharger
            </button>
            <button type="button" className="btn btn--ghost btn--sm" onClick={disconnect}>
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main className="admin-main">
        {session && !session.canWrite ? (
          <div className="notice notice--error" role="alert">
            <Icon name="alert" size={18} />
            <div>
              <p>
                Le jeton GitHub du serveur est en <strong>lecture seule</strong> : l’ajout, la
                modification et la suppression sont désactivés. Créez un jeton « fine-grained »
                avec <strong>Contents: Read and write</strong> sur ce dépôt, puis mettez à jour{' '}
                <code>GITHUB_TOKEN</code> sur le serveur.
              </p>
            </div>
          </div>
        ) : null}

        {notice ? (
          <div
            className={`notice notice--${notice.kind === 'success' ? 'success' : notice.kind}`}
            role={notice.kind === 'error' ? 'alert' : 'status'}
          >
            <Icon
              name={notice.kind === 'success' ? 'check' : 'alert'}
              size={18}
            />
            <div>
              <p>
                {notice.text}
                {notice.url ? (
                  <>
                    {' '}
                    <a href={notice.url} target="_blank" rel="noreferrer">
                      Voir le commit
                    </a>
                  </>
                ) : null}
              </p>
            </div>
          </div>
        ) : null}

        <div className="admin-layout">
          <ProductList
            products={filteredProducts}
            activeSlug={originalSlug}
            query={query}
            category={category}
            previews={previews}
            onQueryChange={setQuery}
            onCategoryChange={setCategory}
            onSelect={openProduct}
            onCreate={openNew}
          />

          <div className="admin-content">
            {draft ? (
              <ProductEditor
                key={originalSlug ?? 'new'}
                draft={draft}
                errors={errors}
                pendingImages={pendingImages}
                previews={previews}
                isNew={originalSlug === null}
                busy={busy}
                imageBusy={imageBusy}
                dirty={dirty}
                deleteArmed={deleteArmed}
                onChange={patchDraft}
                onNameFrChange={handleNameFrChange}
                onSlugChange={handleSlugChange}
                onSpecChange={handleSpecChange}
                onAddSpec={addSpec}
                onRemoveSpec={removeSpec}
                onAddImages={handleAddImages}
                onRemoveImage={handleRemoveImage}
                onSave={() => void handleSave()}
                onCancel={closeEditor}
                onArmDelete={() => setDeleteArmed(true)}
                onCancelDelete={() => setDeleteArmed(false)}
                onDelete={() => void handleDelete()}
              />
            ) : (
              <section className="admin-panel admin-empty">
                <Icon name="package" size={34} />
                <h2>Sélectionnez un produit</h2>
                <p>
                  Choisissez un produit dans la liste pour modifier son prix, ses photos ou sa
                  description — ou créez-en un nouveau.
                </p>
                <button type="button" className="btn btn--primary" onClick={openNew}>
                  <Icon name="plus" size={15} />
                  Ajouter un produit
                </button>
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
