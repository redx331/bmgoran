import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type AnchorHTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from 'react';

interface RouterLocation {
  path: string;
  search: string;
  hash: string;
}

interface RouterValue extends RouterLocation {
  navigate: (to: string, options?: { replace?: boolean }) => void;
}

const RouterContext = createContext<RouterValue | null>(null);

export function normalizePath(pathname: string): string {
  if (!pathname || pathname === '/') return '/';
  const withLeadingSlash = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return withLeadingSlash.replace(/\/+$/, '') || '/';
}

function readLocation(): RouterLocation {
  return {
    path: normalizePath(window.location.pathname),
    search: window.location.search,
    hash: window.location.hash,
  };
}

function scrollToHash(hash: string) {
  if (!hash) {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    return;
  }
  const target = document.getElementById(hash.replace('#', ''));
  if (target) {
    target.scrollIntoView({ block: 'start' });
  }
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<RouterLocation>(() => readLocation());

  useEffect(() => {
    const onPopState = () => {
      setLocation(readLocation());
      scrollToHash(window.location.hash);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback((to: string, options?: { replace?: boolean }) => {
    const url = new URL(to, window.location.origin);
    const next: RouterLocation = {
      path: normalizePath(url.pathname),
      search: url.search,
      hash: url.hash,
    };

    if (options?.replace) {
      window.history.replaceState({}, '', `${next.path}${next.search}${next.hash}`);
    } else {
      window.history.pushState({}, '', `${next.path}${next.search}${next.hash}`);
    }
    setLocation(next);
    scrollToHash(next.hash);
  }, []);

  const value = useMemo<RouterValue>(
    () => ({ ...location, navigate }),
    [location, navigate],
  );

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useRouter(): RouterValue {
  const value = useContext(RouterContext);
  if (!value) throw new Error('useRouter must be used inside <RouterProvider>');
  return value;
}

export function useQuery(): URLSearchParams {
  const { search } = useRouter();
  return useMemo(() => new URLSearchParams(search), [search]);
}

interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  to: string;
  replace?: boolean;
}

export function Link({ to, replace, onClick, children, ...rest }: LinkProps) {
  const { navigate } = useRouter();
  const isExternal = /^([a-z]+:)?\/\//i.test(to) || to.startsWith('mailto:') || to.startsWith('tel:');

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented) return;
    if (isExternal) return;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    if (rest.target && rest.target !== '_self') return;
    event.preventDefault();
    navigate(to, { replace });
  };

  return (
    <a href={to} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}
