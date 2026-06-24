export function redirectSystemPath({
  path
}: {
  path: string;
  initial: boolean;
}): string {
  try {
    const url = new URL(path);
    const isCustomSchemeShare =
      url.protocol === "minimalsudoku:" &&
      (url.hostname === "share" || url.pathname === "/share");

    if (isCustomSchemeShare) {
      return `/share${url.search}`;
    }
  } catch {
    return path;
  }

  return path;
}
