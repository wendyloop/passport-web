export function getAppBasepath() {
  if (typeof window === "undefined") {
    return "/";
  }

  return window.location.pathname.startsWith("/passport-web/") ? "/passport-web" : "/";
}

export function getAppUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const basepath = getAppBasepath();
  const base = basepath === "/" ? "" : basepath;

  return `${window.location.origin}${base}${normalizedPath}`;
}

export function restoreRedirectedPath() {
  if (typeof window === "undefined") {
    return;
  }

  const searchParams = new URLSearchParams(window.location.search);
  const redirectedPath = searchParams.get("p");

  if (!redirectedPath) {
    return;
  }

  searchParams.delete("p");
  const query = searchParams.toString();
  const nextUrl = `${redirectedPath}${query ? `?${query}` : ""}${window.location.hash}`;

  window.history.replaceState(null, "", nextUrl);
}
