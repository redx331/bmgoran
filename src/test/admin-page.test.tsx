import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PRODUCTS, type Product } from '../data/products';
import {
  commitChanges,
  getSession,
  loadCatalogue,
  login as adminLogin,
  logout,
} from '../lib/admin/api';
import { GitHubError } from '../lib/admin/github';
import { buildOgImage } from '../lib/admin/image';
import { saveLocalProducts } from '../lib/admin/local';
import { createZip } from '../lib/admin/zip';
import { renderApp } from './render';

vi.mock('../lib/admin/api', () => ({
  getSession: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  loadCatalogue: vi.fn(),
  commitChanges: vi.fn(),
}));

vi.mock('../lib/admin/image', () => ({
  buildOgImage: vi.fn(),
  prepareProductImage: vi.fn(),
}));

vi.mock('../lib/admin/zip', () => ({
  createZip: vi.fn(),
}));

const SAMPLE = PRODUCTS.slice(0, 2);

function signIn() {
  vi.mocked(getSession).mockResolvedValue({
    login: 'bmg',
    repository: 'bmg-oran/site',
    branch: 'main',
    githubConfigured: true,
  });
  vi.mocked(loadCatalogue).mockResolvedValue({ products: SAMPLE, sha: 'catalogue-sha' });
}

beforeEach(() => {
  vi.mocked(getSession).mockReset();
  vi.mocked(adminLogin).mockReset();
  vi.mocked(logout).mockReset();
  vi.mocked(loadCatalogue).mockReset();
  vi.mocked(commitChanges).mockReset();
  vi.mocked(buildOgImage).mockReset();
  vi.mocked(createZip).mockReset();

  // Default: no valid session cookie.
  vi.mocked(getSession).mockRejectedValue(new GitHubError('Session expirée.', 401));
  vi.mocked(logout).mockResolvedValue();
});

describe('admin login', () => {
  it('renders a standalone login page, excluded from search engines', () => {
    renderApp({ path: '/admin', locale: 'fr' });

    expect(
      screen.getByRole('heading', { level: 1, name: /connexion administrateur/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Identifiant')).toHaveAttribute('autocomplete', 'username');
    expect(screen.getByLabelText('Mot de passe')).toHaveAttribute('type', 'password');

    expect(document.title).toContain('Administration');
    expect(document.head.querySelector('meta[name="robots"]')).toHaveAttribute(
      'content',
      'noindex, nofollow',
    );
    // No storefront header/footer around the admin page.
    expect(document.querySelector('.admin-bar')).toBeNull();
    expect(screen.queryByRole('banner')).toBeNull();
    expect(screen.queryByRole('contentinfo')).toBeNull();
  });

  it('restores a server session and lists the catalogue', async () => {
    signIn();
    renderApp({ path: '/admin', locale: 'fr' });

    expect(await screen.findByRole('heading', { name: 'Produits' })).toBeInTheDocument();
    expect(screen.getByText('@bmg')).toBeInTheDocument();
    expect(screen.getByText('bmg-oran/site · main')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: (name) => name.includes(PRODUCTS[0]!.nameFr) }),
    ).toBeInTheDocument();
    expect(vi.mocked(getSession)).toHaveBeenCalled();
    expect(vi.mocked(loadCatalogue)).toHaveBeenCalled();
  });

  it('shows an error and stays on the form when the password is wrong', async () => {
    vi.mocked(adminLogin).mockRejectedValue(
      new GitHubError('Identifiant ou mot de passe incorrect.', 401),
    );

    const user = userEvent.setup();
    renderApp({ path: '/admin', locale: 'fr' });

    await user.type(await screen.findByLabelText('Identifiant'), 'bmg');
    await user.type(screen.getByLabelText('Mot de passe'), 'wrong-password');
    await user.click(screen.getByRole('button', { name: 'Se connecter' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/mot de passe incorrect/i);
    expect(screen.getByLabelText('Mot de passe')).toBeInTheDocument();
    expect(vi.mocked(adminLogin)).toHaveBeenCalledWith('bmg', 'wrong-password');
  });

  it('stays signed in and explains when the catalogue cannot load', async () => {
    vi.mocked(adminLogin).mockResolvedValue({
      login: 'bmg',
      repository: 'bmg-oran/site',
      branch: 'main',
      githubConfigured: false,
    });
    vi.mocked(loadCatalogue).mockRejectedValue(
      new GitHubError('Le jeton GitHub du serveur n’est pas configuré (GITHUB_TOKEN).', 503),
    );

    const user = userEvent.setup();
    renderApp({ path: '/admin', locale: 'fr' });

    await user.type(await screen.findByLabelText('Identifiant'), 'bmg');
    await user.type(screen.getByLabelText('Mot de passe'), 'bmg-demo-2026');
    await user.click(screen.getByRole('button', { name: 'Se connecter' }));

    expect(await screen.findByText(/connexion réussie/i)).toBeInTheDocument();
    expect(screen.queryByLabelText('Mot de passe')).toBeNull();
    expect(screen.getByText('@bmg')).toBeInTheDocument();
  });

  it('allows testing in local mode without a GitHub token', async () => {
    const user = userEvent.setup();
    renderApp({ path: '/admin', locale: 'fr' });

    const localBtn = screen.getByRole('button', { name: /tester en mode local/i });
    expect(localBtn).toBeInTheDocument();
    await user.click(localBtn);

    expect(await screen.findByRole('heading', { name: 'Produits' })).toBeInTheDocument();
    expect(screen.getByText(/mode local actif/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /exporter le zip/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /réinitialiser/i })).toBeInTheDocument();
  });
});

describe('admin local persistence', () => {
  async function openLocal() {
    const user = userEvent.setup();
    renderApp({ path: '/admin', locale: 'fr' });
    await user.click(screen.getByRole('button', { name: /tester en mode local/i }));
    await screen.findByRole('heading', { name: 'Produits' });
    return user;
  }

  it('persists a price change in localStorage', async () => {
    const user = await openLocal();
    await user.click(
      screen.getByRole('button', { name: (name) => name.includes(PRODUCTS[0]!.nameFr) }),
    );

    const price = screen.getByLabelText(/prix en dinars/i);
    await user.clear(price);
    await user.type(price, '9876');
    await user.click(screen.getByRole('button', { name: /enregistrer les modifications/i }));

    expect(await screen.findByText(/enregistré dans ce navigateur/i)).toBeInTheDocument();
    const raw = window.localStorage.getItem('bmg.admin.local.products');
    expect(raw).not.toBeNull();
    const stored = JSON.parse(raw!) as { version: number; products: Product[] };
    expect(stored.version).toBe(1);
    expect(
      stored.products.find((product) => product.slug === PRODUCTS[0]!.slug)?.price,
    ).toBe(9876);
  });

  it('restores the saved catalogue when local mode is reopened', async () => {
    saveLocalProducts([{ ...PRODUCTS[0]!, price: 12345 }, ...PRODUCTS.slice(1)]);
    const user = await openLocal();

    expect(await screen.findByText(/catalogue restauré/i)).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: (name) => name.includes(PRODUCTS[0]!.nameFr) }),
    );
    expect(screen.getByLabelText(/prix en dinars/i)).toHaveValue(12345);
  });

  it('clears the saved catalogue after confirmation', async () => {
    saveLocalProducts([{ ...PRODUCTS[0]!, price: 12345 }]);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const user = await openLocal();

    await user.click(screen.getByRole('button', { name: /réinitialiser/i }));

    expect(await screen.findByText(/stockage local réinitialisé/i)).toBeInTheDocument();
    expect(window.localStorage.getItem('bmg.admin.local.products')).toBeNull();
  });

  it('exports a ZIP with the catalogue, photos, social images and instructions', async () => {
    vi.mocked(buildOgImage).mockResolvedValue(new Blob(['og']));
    vi.mocked(createZip).mockResolvedValue(new Blob(['zip'], { type: 'application/zip' }));
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, blob: async () => new Blob(['photo']) })),
    );
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    const user = await openLocal();
    await user.click(screen.getByRole('button', { name: /exporter le zip/i }));

    expect(await screen.findByText(/dossier zip téléchargé/i)).toBeInTheDocument();
    expect(click).toHaveBeenCalled();
    expect(vi.mocked(createZip)).toHaveBeenCalledTimes(1);

    const entries = vi.mocked(createZip).mock.calls[0]![0];
    expect(entries.some((entry) => entry.path === 'src/data/products.json')).toBe(true);
    expect(entries.some((entry) => entry.path === 'LISEZ-MOI.txt')).toBe(true);
    expect(entries.some((entry) => entry.path === `public/og/${PRODUCTS[0]!.slug}.png`)).toBe(true);
    expect(
      entries.filter((entry) => entry.path.startsWith('public/images/products/')).length,
    ).toBeGreaterThan(0);
    expect(vi.mocked(buildOgImage)).toHaveBeenCalledTimes(PRODUCTS.length);
  });
});

describe('admin editor', () => {
  it('opens a product with its price, names and photos', async () => {
    signIn();
    const user = userEvent.setup();
    renderApp({ path: '/admin', locale: 'fr' });

    await user.click(
      await screen.findByRole('button', { name: (name) => name.includes(PRODUCTS[0]!.nameFr) }),
    );

    expect(
      screen.getByRole('heading', { level: 2, name: PRODUCTS[0]!.nameFr }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/nom \(français\)/i)).toHaveValue(PRODUCTS[0]!.nameFr);
    expect(screen.getByLabelText(/nom \(arabe\)/i)).toHaveValue(PRODUCTS[0]!.nameAr);
    expect(screen.getByLabelText(/prix en dinars/i)).toHaveValue(PRODUCTS[0]!.price);
    expect(screen.getByAltText(`Photo 1 de ${PRODUCTS[0]!.nameFr}`)).toBeInTheDocument();
  });

  it('publishes a new product with one commit and a generated social image', async () => {
    signIn();
    vi.mocked(commitChanges).mockResolvedValue({
      commitSha: 'commit-sha',
      htmlUrl: 'https://github.com/bmg-oran/site/commit/commit-sha',
    });
    vi.mocked(buildOgImage).mockResolvedValue(new Blob(['og']));

    const user = userEvent.setup();
    renderApp({ path: '/admin', locale: 'fr' });
    await screen.findByRole('heading', { name: 'Produits' });

    await user.click(screen.getByRole('button', { name: 'Nouveau' }));
    await user.type(screen.getByLabelText(/nom \(français\)/i), 'Plaquettes de frein avant');
    expect(screen.getByLabelText(/adresse de la fiche/i)).toHaveValue(
      'plaquettes-de-frein-avant',
    );
    await user.type(screen.getByLabelText(/nom \(arabe\)/i), 'أقراص الفرامل الأمامية');
    await user.type(screen.getByLabelText(/prix en dinars/i), '4500');
    await user.type(
      screen.getByLabelText(/description \(français\)/i),
      'Plaquettes de frein avant pour usage urbain.',
    );
    await user.type(
      screen.getByLabelText(/description \(arabe\)/i),
      'أقراص الفرامل الأمامية للاستخدام الحضري.',
    );

    await user.click(screen.getByRole('button', { name: /publier le produit/i }));

    expect(await screen.findByText(/modifications enregistrées/i)).toBeInTheDocument();
    expect(vi.mocked(commitChanges)).toHaveBeenCalledTimes(1);

    const [message, changes] = vi.mocked(commitChanges).mock.calls[0]!;
    expect(message).toContain('Plaquettes de frein avant');

    const jsonChange = changes.find(
      (change) => change.path === 'src/data/products.json' && 'content' in change,
    );
    expect(jsonChange).toBeDefined();
    const saved = JSON.parse(String((jsonChange as { content: string }).content)) as Product[];
    expect(saved).toHaveLength(SAMPLE.length + 1);

    const created = saved.find((product) => product.slug === 'plaquettes-de-frein-avant');
    expect(created?.price).toBe(4500);
    expect(created?.isDemo).toBe(true);
    expect(created?.nameAr).toBe('أقراص الفرامل الأمامية');
    expect(changes.some((change) => change.path === 'public/og/plaquettes-de-frein-avant.png')).toBe(
      true,
    );
    expect(vi.mocked(buildOgImage)).toHaveBeenCalledTimes(1);
  });

  it('blocks publishing when required fields are missing', async () => {
    signIn();
    const user = userEvent.setup();
    renderApp({ path: '/admin', locale: 'fr' });
    await screen.findByRole('heading', { name: 'Produits' });

    await user.click(screen.getByRole('button', { name: 'Nouveau' }));
    await user.click(screen.getByRole('button', { name: /publier le produit/i }));

    expect(await screen.findByText(/corrigez les champs indiqués/i)).toBeInTheDocument();
    expect(vi.mocked(commitChanges)).not.toHaveBeenCalled();
    expect(screen.getAllByText(/indiquez le nom français/i).length).toBeGreaterThan(0);  });
});
