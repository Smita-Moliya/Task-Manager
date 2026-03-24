import { PageAccessMap } from "../types/authType";
import { hasPageAccess } from "./access";
import { SidebarItem } from "../config/sidebarItems";

export function getVisibleSidebarItems(
  items: SidebarItem[],
  pages: PageAccessMap | undefined,
  isSuperuser = false
): SidebarItem[] {
  if (isSuperuser) return items;

  return items.filter((item) => {
    if (!item.pageKey) return true;
    return hasPageAccess(pages, item.pageKey);
  });
}