import type { AvatarLocation, ContentLayout, NavbarStyle } from "./layout";

export function applyContentLayout(value: ContentLayout) {
  const root = document.documentElement;
  root.setAttribute("data-content-layout", value);
}

export function applyNavbarStyle(value: NavbarStyle) {
  const root = document.documentElement;
  root.setAttribute("data-navbar-style", value);
}

export function applyAvatarLocation(value: AvatarLocation) {
  const root = document.documentElement;
  root.setAttribute("data-avatar-location", value);
}

export function applySidebarVariant(value: string) {
  const root = document.documentElement;
  root.setAttribute("data-sidebar-variant", value);
}

export function applySidebarCollapsible(value: string) {
  const root = document.documentElement;
  root.setAttribute("data-sidebar-collapsible", value);
}

export function applyFont(value: string) {
  const root = document.documentElement;
  root.setAttribute("data-font", value);
}
