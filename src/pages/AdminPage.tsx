import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { ProductEditor, type PendingImage } from '../components/admin/ProductEditor';
import { ProductList } from '../components/admin/ProductList';
import { Icon } from '../components/Icon';
import { SITE } from '../config/business';
import type { CategoryId, Product, Specification } from '../data/products';
import { filterByCategory, searchProducts } from '../data/products';
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
  GitHubError,
  commitChanges,
  loadCatalogue,
  verifyAccess,
  type FileChange,
} from '../lib/admin/github';
import { buildOgImage, prepareProductImage } from '../lib/admin/image';
import { formatPrice } from '../lib/format';
import { usePageMeta } from '../lib/seo';
import '../admin.css';

export const ADMIN_TOKEN_KEY = 'bmg.admin.token';
export const ADMIN_REPO_KEY = 'bmg.admin.repo';

const BRANCH = SITE.branch || 'main';
const MAX_IMAGES = 8;

type Phase = 'login' | 'connecting' | 'ready';

interface Notice {
  kind: 'success' | 'error' | 'info';
  text: string;
  url?: string;
}

function readStored(key: string): string {
  if (typeof window === 'undefined') return '';
  try {
    return window.sessionStorage.getItem(key) ?? '';
  } catch {
    return '';
  }
}

function writeStored(key: string, value: string): void {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // Private mode / storage disabled: the session simply won't survive a reload.
  }
}

function removeStored(key: string): void {
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // Ignore.
  }
}

function errorMessage(error: unknown): string {
  if (error instanceof GitHubError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return 'Une erreur est survenue. Vérifiez votre connexion puis réessayez.';
}

function hostOf(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/\/+$/, '');
}

export function AdminPage() {
  usePageMeta({
    title: `Administration — ${SITE.businessName}`,
    description: 'Espace privé de gestion du catalogue.',
    path: '/admin',
    locale: 'fr',
    noindex: true,
  });

  const [repo, setRepo] = useState(() => readStored(ADMIN_REPO_KEY) || SITE.repository);
  const [tokenInput, setTokenInput] = useState('');
  const [token, setToken] = useState(() => readStored(ADMIN_TOKEN_KEY));
  const [login, setLogin] = useState('');
  const [phase, setPhase] = useState<Phase>(() =>
    readStored(ADMIN_TOKEN_KEY) && (readStored(ADMIN_REPO_KEY) || SITE.repository)
      ? 'connecting'
      : 'login',
  );
  const [loginError, setLoginError] = useState('');

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

  const autoTried = useRef(false);
  const previewsRef = useRef(previews);
  previewsRef.current = previews;

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

  const connect = useCallback(async (nextToken: string, nextRepo: string) => {
    setPhase('connecting');
    setLoginError('');
    setNotice(null);
    try {
      const session = await verifyAccess(nextToken, nextRepo);
      const snapshot = await loadCatalogue(nextToken, nextRepo, BRANCH);
      writeStored(ADMIN_TOKEN_KEY, nextToken);
      writeStored(ADMIN_REPO_KEY, nextRepo);
      setToken(nextToken);
      setLogin(session.login);
      setProducts(snapshot.products);
      setPhase('ready');
    } catch (error) {
      removeStored(ADMIN_TOKEN_KEY);
      setToken('');
      setProducts(null);
      setPhase('login');
      setLoginError(errorMessage(error));
    }
  }, []);

  useEffect(() => {
    if (autoTried.current) return;
    autoTried.current = true;
    if (token && repo) void connect(token, repo);
  }, [connect, repo, token]);

  function disconnect() {
    revokePreviews(Object.keys(previewsRef.current));
    removeStored(ADMIN_TOKEN_KEY);
    setToken('');
    setTokenInput('');
    setLogin('');
    setProducts(null);
    setDraft(null);
    setOriginalSlug(null);
    setErrors({});
    setPendingImages([]);
    setRemovedImages([]);
    setDirty(false);
    setDeleteArmed(false);
    setNotice(null);
    setPhase('login');
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextRepo = repo.trim();
    const nextToken = tokenInput.trim();
    if (!nextRepo || !nextToken) {
      setLoginError('Renseignez le dépôt GitHub et le jeton.');
      return;
    }
    await connect(nextToken, nextRepo);
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
    if (!token || !products || !draft) return;
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
        token,
        repo,
        BRANCH,
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
    if (!token || !products || !draft || !originalSlug) return;
    setBusy(true);
    setNotice(null);
    try {
      const nextProducts = removeProduct(products, originalSlug);
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

      const result = await commitChanges(
        token,
        repo,
        BRANCH,
        `Admin : supprimer « ${draft.nameFr} »`,
        changes,
      );

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
    if (!token || !repo) return;
    if (!confirmDiscard()) return;
    clearPending();
    setRemovedImages([]);
    setBusy(true);
    setNotice(null);
    try {
      const snapshot = await loadCatalogue(token, repo, BRANCH);
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
              Connectez-vous avec un jeton GitHub pour ajouter des produits, modifier les prix et
              les photos. Chaque enregistrement met le site à jour automatiquement.
            </p>

            {!SITE.repository && !repo.trim() ? (
              <div className="notice notice--info">
                <Icon name="alert" size={18} />
                <div>
                  <p>
                    Première utilisation : indiquez le dépôt GitHub qui contient ce site
                    (par exemple <code>bmg-oran/site</code>). Vous pouvez aussi le renseigner
                    dans <code>site.config.json</code>, champ <code>repository</code>.
                  </p>
                </div>
              </div>
            ) : null}

            <form className="admin-login__form" onSubmit={handleLogin} noValidate>
              <div className="field">
                <label htmlFor="admin-repo">Dépôt GitHub</label>
                <input
                  id="admin-repo"
                  value={repo}
                  dir="ltr"
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="propriétaire/dépôt"
                  disabled={connecting}
                  onChange={(event) => setRepo(event.target.value)}
                />
                <p className="field-hint">
                  Le dépôt qui contient le site, branche <code>{BRANCH}</code>.
                </p>
              </div>

              <div className="field">
                <label htmlFor="admin-token">Jeton GitHub</label>
                <input
                  id="admin-token"
                  type="password"
                  value={tokenInput}
                  dir="ltr"
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="github_pat_…"
                  disabled={connecting}
                  onChange={(event) => setTokenInput(event.target.value)}
                />
                <p className="field-hint">
                  Jeton « fine-grained » avec <strong>Contents: Read and write</strong> et{' '}
                  <strong>Metadata: Read</strong> sur ce dépôt uniquement.
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
                {connecting ? 'Connexion à GitHub…' : 'Se connecter'}
              </button>
            </form>

            <details className="admin-help">
              <summary>Comment créer le jeton ?</summary>
              <ol>
                <li>
                  Ouvrez{' '}
                  <a
                    href="https://github.com/settings/personal-access-tokens/new"
                    target="_blank"
                    rel="noreferrer"
                  >
                    github.com/settings/personal-access-tokens/new
                  </a>
                  .
                </li>
                <li>Choisissez « Fine-grained token » et sélectionnez votre dépôt.</li>
                <li>
                  Dans « Repository permissions », réglez <strong>Contents</strong> sur{' '}
                  <em>Read and write</em> et <strong>Metadata</strong> sur <em>Read</em>.
                </li>
                <li>Créez le jeton, copiez-le et collez-le ci-dessus.</li>
              </ol>
              <p>
                Le jeton reste uniquement dans cet onglet (<code>sessionStorage</code>) et n’est
                envoyé qu’à <code>api.github.com</code>. Fermez l’onglet ou cliquez sur
                « Déconnexion » pour l’effacer.
              </p>
            </details>

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
              {repo} · {BRANCH}
            </span>
            {login ? <span className="admin-bar__user">@{login}</span> : null}
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
