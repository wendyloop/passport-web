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
