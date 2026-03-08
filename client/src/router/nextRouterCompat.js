import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

function parseAsPath(asPath) {
  const url = new URL(asPath || '/', 'http://localhost');

  return {
    pathname: url.pathname,
    search: url.search,
    hash: url.hash,
  };
}

function readRouteState() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.history.state?.__routeState ?? null;
}

function isActivePath(pathname, to, end) {
  if (end) {
    return pathname === to;
  }

  if (to === '/') {
    return pathname === '/';
  }

  return pathname === to || pathname.startsWith(`${to}/`);
}

export function useNavigate() {
  const router = useRouter();

  return (to, options = {}) => {
    const method = options.replace ? 'replace' : 'push';

    return Promise.resolve(router[method](to)).then((result) => {
      if (typeof window === 'undefined') {
        return result;
      }

      const historyState = window.history.state || {};

      if (options.state !== undefined) {
        window.history.replaceState(
          { ...historyState, __routeState: options.state },
          '',
          window.location.href
        );
      } else if (historyState.__routeState !== undefined) {
        const { __routeState, ...rest } = historyState;
        window.history.replaceState(rest, '', window.location.href);
      }

      return result;
    });
  };
}

export function useLocation() {
  const router = useRouter();
  const [routeState, setRouteState] = useState(null);
  const locationParts = useMemo(() => parseAsPath(router.asPath), [router.asPath]);

  useEffect(() => {
    const syncState = () => {
      setRouteState(readRouteState());
    };

    syncState();

    window.addEventListener('popstate', syncState);

    return () => {
      window.removeEventListener('popstate', syncState);
    };
  }, [router.asPath]);

  return {
    ...locationParts,
    state: routeState,
  };
}

export function useParams() {
  const router = useRouter();
  return router.query;
}

export function NavLink({ to, end = false, className, children, ...props }) {
  const { pathname } = useLocation();
  const isActive = isActivePath(pathname, to, end);
  const resolvedClassName = typeof className === 'function' ? className({ isActive }) : className;
  const resolvedChildren = typeof children === 'function' ? children({ isActive }) : children;

  return (
    <Link href={to} className={resolvedClassName} {...props}>
      {resolvedChildren}
    </Link>
  );
}

export function Navigate({ to, replace = false }) {
  const navigate = useNavigate();

  useEffect(() => {
    navigate(to, { replace });
  }, [navigate, replace, to]);

  return null;
}
