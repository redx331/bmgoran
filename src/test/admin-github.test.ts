import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  GitHubError,
  commitChanges,
  decodeBase64Utf8,
  loadCatalogue,
  parseRepository,
  textToBase64,
  verifyAccess,
} from '../lib/admin/github';

const API = 'https://api.github.com';

interface RecordedCall {
  url: string;
  init?: RequestInit;
}

function reply(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response;
}

function mockFetch(
  handler: (url: string, init: RequestInit | undefined, index: number) => Response,
): { calls: RecordedCall[] } {
  const calls: RecordedCall[] = [];
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, init });
    return handler(url, init, calls.length - 1);
  });
  vi.stubGlobal('fetch', fetchMock);
  return { calls };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('parseRepository', () => {
  it('accepts owner/repo, github URLs and .git clone URLs', () => {
    expect(parseRepository('bmg-oran/site')?.fullName).toBe('bmg-oran/site');
    expect(parseRepository('https://github.com/bmg-oran/site')?.fullName).toBe('bmg-oran/site');
    expect(parseRepository('https://github.com/bmg-oran/site.git')?.fullName).toBe(
      'bmg-oran/site',
    );
    expect(parseRepository('  bmg-oran/site/  ')?.fullName).toBe('bmg-oran/site');
  });

  it('rejects malformed repositories', () => {
    expect(parseRepository('')).toBeNull();
    expect(parseRepository('owner')).toBeNull();
    expect(parseRepository('a/b/c')).toBeNull();
    expect(parseRepository('owner/re po')).toBeNull();
  });
});

describe('base64 helpers', () => {
  it('round-trips UTF-8 text including Arabic and accents', () => {
    const text = '{"nameAr":"مصابيح LED","nameFr":"Éclairage"}';
    expect(decodeBase64Utf8(textToBase64(text))).toBe(text);
  });
});

describe('verifyAccess', () => {
  it('returns the login and confirms push permission', async () => {
    const { calls } = mockFetch((url) => {
      if (url.endsWith('/user')) return reply({ login: 'bmg' });
      if (url.endsWith('/repos/bmg-oran/site')) {
        return reply({ default_branch: 'main', permissions: { push: true } });
      }
      return reply({}, 404);
    });

    await expect(verifyAccess('token', 'bmg-oran/site')).resolves.toEqual({
      login: 'bmg',
      defaultBranch: 'main',
    });

    expect(calls[0]?.url).toBe(`${API}/user`);
    expect(
      (calls[0]?.init?.headers as Record<string, string> | undefined)?.Authorization,
    ).toBe('Bearer token');
    // A Workers `fetch` sends no User-Agent, and GitHub answers 403 without one.
    expect(
      (calls[0]?.init?.headers as Record<string, string> | undefined)?.['User-Agent'],
    ).toBe('bmg-oran-admin');
    expect(calls[1]?.url).toBe(`${API}/repos/bmg-oran/site`);
  });

  it('rejects a token without write permission', async () => {
    mockFetch((url) => {
      if (url.endsWith('/user')) return reply({ login: 'bmg' });
      return reply({ default_branch: 'main', permissions: { push: false } });
    });

    await expect(verifyAccess('token', 'bmg-oran/site')).rejects.toBeInstanceOf(GitHubError);
    await expect(verifyAccess('token', 'bmg-oran/site')).rejects.toThrow(/Contents/);
  });

  it('explains an invalid token', async () => {
    mockFetch(() => reply({ message: 'Bad credentials' }, 401));
    await expect(verifyAccess('token', 'bmg-oran/site')).rejects.toThrow(/Jeton invalide/);
  });

  it('refuses a repository that is not configured', async () => {
    await expect(verifyAccess('token', '')).rejects.toThrow(/Dépôt mal configuré/);
  });
});

describe('loadCatalogue', () => {
  it('decodes products.json from the selected branch', async () => {
    const products = [{ slug: 'phares-led', nameAr: 'مصابيح LED' }];
    const { calls } = mockFetch(() =>
      reply({ content: textToBase64(JSON.stringify(products)), sha: 'file-sha', encoding: 'base64' }),
    );

    await expect(loadCatalogue('token', 'bmg-oran/site', 'main')).resolves.toEqual({
      products,
      sha: 'file-sha',
    });
    expect(calls[0]?.url).toBe(
      `${API}/repos/bmg-oran/site/contents/src/data/products.json?ref=main`,
    );
  });

  it('reports an unreadable catalogue', async () => {
    mockFetch(() => reply({ content: textToBase64('{oops'), sha: 'x', encoding: 'base64' }));
    await expect(loadCatalogue('token', 'bmg-oran/site', 'main')).rejects.toThrow(/illisible/);
  });
});

describe('commitChanges', () => {
  it('writes every file in a single commit, including deletions', async () => {
    const blobBodies: string[] = [];
    const { calls } = mockFetch((url, init, index) => {
      if (url.endsWith('/git/ref/heads/main')) {
        return reply({ object: { sha: 'parent-sha' } });
      }
      if (url.endsWith('/git/commits/parent-sha')) {
        return reply({ tree: { sha: 'tree-sha' } });
      }
      if (url.endsWith('/git/blobs')) {
        blobBodies.push(String(init?.body));
        return reply({ sha: `blob-${blobBodies.length}` });
      }
      if (url.endsWith('/git/trees')) {
        return reply({ sha: 'new-tree' });
      }
      if (url.endsWith('/git/commits') && init?.method === 'POST') {
        return reply({ sha: 'commit-sha', html_url: 'https://github.com/bmg-oran/site/commit/c' });
      }
      if (url.endsWith('/git/refs/heads/main')) {
        return reply({});
      }
      return reply({ message: `unexpected ${index}` }, 500);
    });

    const result = await commitChanges('token', 'bmg-oran/site', 'main', 'Admin : test', [
      { path: 'src/data/products.json', content: '{"ok":true}' },
      { path: 'public/images/products/a-1.jpg', content: new Blob(['photo']) },
      { path: 'public/images/products/old.jpg', delete: true },
    ]);

    expect(result).toEqual({
      commitSha: 'commit-sha',
      htmlUrl: 'https://github.com/bmg-oran/site/commit/c',
    });

    const sequence = calls.map(
      (call) => `${call.init?.method ?? 'GET'} ${call.url.replace(API, '')}`,
    );
    expect(sequence).toEqual([
      'GET /repos/bmg-oran/site/git/ref/heads/main',
      'GET /repos/bmg-oran/site/git/commits/parent-sha',
      'POST /repos/bmg-oran/site/git/blobs',
      'POST /repos/bmg-oran/site/git/blobs',
      'POST /repos/bmg-oran/site/git/trees',
      'POST /repos/bmg-oran/site/git/commits',
      'PATCH /repos/bmg-oran/site/git/refs/heads/main',
    ]);

    expect(JSON.parse(blobBodies[0] ?? '{}')).toEqual({
      content: textToBase64('{"ok":true}'),
      encoding: 'base64',
    });
    expect(decodeBase64Utf8(JSON.parse(blobBodies[1] ?? '{}').content)).toBe('photo');

    const treeBody = JSON.parse(String(calls[4]?.init?.body));
    expect(treeBody.base_tree).toBe('tree-sha');
    expect(treeBody.tree).toEqual([
      {
        path: 'src/data/products.json',
        mode: '100644',
        type: 'blob',
        sha: 'blob-1',
      },
      {
        path: 'public/images/products/a-1.jpg',
        mode: '100644',
        type: 'blob',
        sha: 'blob-2',
      },
      {
        path: 'public/images/products/old.jpg',
        mode: '100644',
        type: 'blob',
        sha: null,
      },
    ]);

    const commitBody = JSON.parse(String(calls[5]?.init?.body));
    expect(commitBody).toEqual({
      message: 'Admin : test',
      tree: 'new-tree',
      parents: ['parent-sha'],
    });

    expect(JSON.parse(String(calls[6]?.init?.body))).toEqual({
      sha: 'commit-sha',
      force: false,
    });
  });

  it('refuses an empty change list', async () => {
    await expect(
      commitChanges('token', 'bmg-oran/site', 'main', 'nothing', []),
    ).rejects.toThrow(/Aucune modification/);
  });
});
