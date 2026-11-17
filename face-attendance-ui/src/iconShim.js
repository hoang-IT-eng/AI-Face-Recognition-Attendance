/**
 * Offline-resilient Material Symbols -> crisp inline SVG shim.
 * Ensures zero raw ligature text ("dashboard", "center_focus_strong", etc.) ever leaks
 * when Google Fonts CDN is blocked, offline, or slow to load.
 */

const PATHS = {
  dashboard: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/>',
  badge: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="11" r="2.2"/><path d="M6 16.5c.8-1.4 1.8-2 3-2s2.2.6 3 2M14 9.5h4M14 13.5h3"/>',
  videocam: '<rect x="2.5" y="6" width="13.5" height="12" rx="2"/><path d="m16 10.5 5-3v9l-5-3Z"/>',
  camera_indoor: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-9.5Z"/><circle cx="12" cy="13.5" r="2.8"/>',
  photo_camera: '<path d="M4 7h3l2-2h6l2 2h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z"/><circle cx="12" cy="13" r="3.5"/>',
  photo: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="m21 15-5-5L5 20"/>',
  schedule: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 2"/>',
  update: '<path d="M21 12a9 9 0 1 1-2.64-6.36L21 8"/><path d="M21 3v5h-5M12 7v5l3 2"/>',
  edit_calendar: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 9h18M14.5 16.5l3.5-3.5 1.8 1.8-3.5 3.5H14.5v-1.8Z"/>',
  pin: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 12h.01M12 12h.01M17 12h.01" stroke-width="2.6"/>',
  description: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
  notifications_active: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0M4 4a10 10 0 0 0-2 5M20 4a10 10 0 0 1 2 5"/>',
  notifications: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
  shield_person: '<path d="M12 2 4 5.5v6c0 5.25 3.4 9.75 8 10.5 4.6-.75 8-5.25 8-10.5v-6L12 2Z"/><circle cx="12" cy="10" r="2.2"/><path d="M8.8 16c.9-1.5 2-2.2 3.2-2.2s2.3.7 3.2 2.2"/>',
  face: '<circle cx="12" cy="12" r="9"/><circle cx="9" cy="10" r="1"/><circle cx="15" cy="10" r="1"/><path d="M9 15c.9 1 2 1.5 3 1.5s2.1-.5 3-1.5"/>',
  how_to_reg: '<circle cx="10" cy="8" r="3.5"/><path d="M4 19c1.2-3 3.4-4.5 6-4.5 1 0 1.9.2 2.8.6M15 16.5l2 2 4-4"/>',
  center_focus_strong: '<path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3"/><circle cx="12" cy="12" r="3"/>',
  verified: '<path d="M12 2.5 14.8 5l3.7-.3.6 3.7 2.9 2.3-1.8 3.3.8 3.6-3.6 1.1-1.9 3.2-3.5-1.4-3.5 1.4-1.9-3.2-3.6-1.1.8-3.6L2 10.7 4.9 8.4l.6-3.7L9.2 5 12 2.5Z"/><path d="m9 12 2 2 4-4"/>',
  check_circle: '<circle cx="12" cy="12" r="9"/><path d="m8.5 12.2 2.3 2.3 4.8-4.8"/>',
  check: '<path d="m5 12.5 4.5 4.5 9.5-9.5"/>',
  warning: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>',
  cancel: '<circle cx="12" cy="12" r="9"/><path d="m15 9-6 6M9 9l6 6"/>',
  error: '<circle cx="12" cy="12" r="9"/><path d="M12 8v4.5M12 16.5h.01"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>',
  groups: '<circle cx="9" cy="8.5" r="3"/><circle cx="16.5" cy="9.5" r="2.4"/><path d="M3 19c1.2-2.8 3.3-4.2 6-4.2s4.8 1.4 6 4.2M15.5 14.8c2 .2 3.7 1.4 4.5 3.7"/>',
  domain: '<rect x="3" y="3" width="10" height="18" rx="1"/><path d="M13 8h8v13h-8M7 7h2M7 11h2M7 15h2M16 12h2M16 16h2"/>',
  download: '<path d="M12 3v12m0 0-4-4m4 4 4-4M4 19h16"/>',
  upload_file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M12 17v-6m0 0-2.5 2.5M12 11l2.5 2.5"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.8-3.8"/>',
  expand_more: '<path d="m6 9 6 6 6-6"/>',
  tune: '<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="9" cy="6" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="10" cy="18" r="2"/>',
  filter_list: '<path d="M3 6h18M6 12h12M10 18h4"/>',
  add: '<path d="M12 5v14M5 12h14"/>',
  close: '<path d="M18 6 6 18M6 6l12 12"/>',
  visibility: '<path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  edit: '<path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z"/>',
  delete: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v6M14 11v6"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8M7 3v5h8"/>',
  sync: '<path d="M21 12a9 9 0 0 0-15.5-6.36L3 8M3 3v5h5M3 12a9 9 0 0 0 15.5 6.36L21 16M21 21v-5h-5"/>',
  language: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  arrow_back: '<path d="M19 12H5m0 0 6-6m-6 6 6 6"/>',
  arrow_forward: '<path d="M5 12h14m0 0-6-6m6 6-6 6"/>',
};

const DEFAULT_PATH = '<circle cx="12" cy="12" r="7.5"/><circle cx="12" cy="12" r="2"/>';

function upgradeIconElement(el) {
  if (!(el instanceof HTMLElement)) return;
  if (el.querySelector("svg[data-icon-shim]")) return;
  const rawName = (el.dataset.iconName || el.textContent || "").trim().toLowerCase();
  if (!rawName) return;
  el.dataset.iconName = rawName;
  const inner = PATHS[rawName] || DEFAULT_PATH;
  el.style.display = "inline-flex";
  el.style.alignItems = "center";
  el.style.justifyContent = "center";
  el.style.width = "1.15em";
  el.style.height = "1.15em";
  el.style.flexShrink = "0";
  el.style.fontFamily = "inherit";
  el.style.overflow = "hidden";
  el.innerHTML = `<svg data-icon-shim="${rawName}" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
}

function scanAll(root = document) {
  root.querySelectorAll(".material-symbols-outlined").forEach(upgradeIconElement);
}

export function installMaterialSvgShim() {
  if (typeof window === "undefined") return;
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => scanAll());
  } else {
    scanAll();
  }
  const obs = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === "childList") {
        m.addedNodes.forEach((n) => {
          if (n instanceof HTMLElement) {
            if (n.classList.contains("material-symbols-outlined")) upgradeIconElement(n);
            scanAll(n);
          }
        });
      }
    }
  });
  obs.observe(document.documentElement, { childList: true, subtree: true });
}
