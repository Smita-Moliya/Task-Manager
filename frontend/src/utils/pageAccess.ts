import { PageAccessMap } from "../types/authType";

export function hasPageAccess(
  pages: PageAccessMap | undefined,
  pageKey: string
): boolean {
  if (!pages) return false;
  if (pages["*"] === true) return true;
  return pages[pageKey] === true;
}

export function filterSidebarItems<T extends { pageKey?: string }>(
  items: T[],
  pages: PageAccessMap | undefined
): T[] {
  return items.filter((item) => {
    if (!item.pageKey) return true;
    return hasPageAccess(pages, item.pageKey);
  });
}