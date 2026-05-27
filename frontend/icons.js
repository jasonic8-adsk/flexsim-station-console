const ICONS = {
  Product_A: `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <rect x="6" y="12" width="20" height="14" rx="2"/>
    <path d="M10 12V9a2 2 0 012-2h8a2 2 0 012 2v3"/>
    <circle cx="16" cy="19" r="3"/>
    <path d="M13 19h-2M21 19h-2"/>
    <path d="M14 26v2M18 26v2"/>
    <path d="M8 7l2-3h12l2 3"/>
  </svg>`,

  Product_B: `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M10 28l2-12"/>
    <path d="M12 16l1-8h2l-1 8"/>
    <path d="M13 8V4"/>
    <rect x="11" y="2" width="4" height="2" rx="0.5"/>
    <path d="M9 28h4"/>
    <path d="M15 8l4-2"/>
    <path d="M19 6l1 1-5 3"/>
  </svg>`,

  Product_C: `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="16" cy="16" r="12"/>
    <circle cx="16" cy="16" r="8"/>
    <circle cx="16" cy="16" r="3"/>
    <path d="M16 4v2M16 26v2"/>
    <path d="M4 16h2M26 16h2"/>
    <path d="M12 28h8v2h-8z"/>
  </svg>`,

  Product_D: `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <rect x="8" y="6" width="16" height="20" rx="8"/>
    <circle cx="16" cy="16" r="5"/>
    <circle cx="16" cy="16" r="2"/>
    <path d="M14 24h4"/>
    <path d="M12 8h8"/>
    <path d="M16 6V4"/>
  </svg>`,

  Machine_E: `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <rect x="6" y="14" width="20" height="14" rx="1"/>
    <path d="M8 14V8h16v6"/>
    <path d="M16 8V5"/>
    <path d="M13 5h6"/>
    <path d="M12 18h8v6h-8z"/>
    <path d="M16 18v6"/>
    <path d="M6 28h20"/>
    <path d="M10 28v2M22 28v2"/>
  </svg>`,

  Machine_F: `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <rect x="4" y="18" width="12" height="10" rx="1"/>
    <rect x="18" y="12" width="10" height="16" rx="1"/>
    <path d="M16 22h2"/>
    <path d="M8 18v-4h4v4"/>
    <path d="M21 12V8l4-2v6"/>
    <path d="M4 28h24"/>
    <circle cx="23" cy="20" r="2"/>
    <path d="M7 24h6"/>
  </svg>`,

  Machine_H: `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <rect x="4" y="22" width="24" height="6" rx="1"/>
    <rect x="8" y="6" width="6" height="16" rx="1"/>
    <path d="M11 6V3"/>
    <path d="M9 3h4"/>
    <path d="M14 14h6v8h-6"/>
    <circle cx="17" cy="18" r="2"/>
    <path d="M22 16v6"/>
    <path d="M24 14l2 2-2 2"/>
    <path d="M4 28h24"/>
  </svg>`,

  Machine_G: `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M6 10h20v4H6z"/>
    <path d="M8 14v10h16V14"/>
    <path d="M12 14v10"/>
    <path d="M20 14v10"/>
    <path d="M14 18h4"/>
    <path d="M8 24h16v4H8z"/>
    <path d="M10 10V6h12v4"/>
    <path d="M16 6V4"/>
  </svg>`,

  Machine_I: `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <rect x="6" y="8" width="20" height="16" rx="2"/>
    <path d="M10 12h4v4h-4z"/>
    <path d="M18 12h4v4h-4z"/>
    <path d="M12 20h8"/>
    <circle cx="12" cy="14" r="0.5" fill="currentColor"/>
    <circle cx="20" cy="14" r="0.5" fill="currentColor"/>
    <path d="M6 24h20v4H6z"/>
    <path d="M14 8V5h4v3"/>
    <path d="M16 5V3"/>
    <circle cx="16" cy="3" r="1"/>
  </svg>`,

  Machine_J: `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <rect x="8" y="10" width="16" height="12" rx="1"/>
    <path d="M12 14h8"/>
    <path d="M12 18h5"/>
    <path d="M8 22h16v4H8z"/>
    <path d="M4 14h4M24 14h4"/>
    <circle cx="16" cy="6" r="3"/>
    <path d="M14 6h4"/>
    <path d="M16 4v4"/>
    <path d="M10 26v2M22 26v2"/>
  </svg>`,

  Machine_B: `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M14 24h-4v-6h4"/>
    <path d="M14 18l4-6"/>
    <path d="M18 12l4 2-2 4"/>
    <path d="M20 18l-6 6"/>
    <circle cx="18" cy="10" r="2"/>
    <rect x="6" y="24" width="20" height="4" rx="1"/>
    <path d="M22 20v4"/>
    <path d="M24 16h3v8h-3"/>
    <circle cx="20" cy="18" r="1" fill="currentColor"/>
  </svg>`,

  Machine_D: `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <rect x="8" y="18" width="16" height="8" rx="1"/>
    <path d="M10 18v-4h12v4"/>
    <path d="M14 14v-2h4v2"/>
    <path d="M8 26h16v2H8z"/>
    <circle cx="12" cy="22" r="1.5"/>
    <circle cx="20" cy="22" r="1.5"/>
    <path d="M15 22h2"/>
    <path d="M4 22h4M24 22h4"/>
    <path d="M6 20v4M26 20v4"/>
  </svg>`,

  Machine_C: `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <rect x="4" y="6" width="24" height="20" rx="1"/>
    <path d="M4 12h24"/>
    <path d="M4 18h24"/>
    <path d="M4 24h24"/>
    <path d="M14 6v20"/>
    <rect x="6" y="8" width="6" height="3" rx="0.5"/>
    <rect x="16" y="14" width="6" height="3" rx="0.5"/>
    <rect x="6" y="20" width="6" height="3" rx="0.5"/>
    <path d="M4 26h24v2H4z"/>
    <path d="M12 28v2M20 28v2"/>
  </svg>`,

  Machine_A: `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <rect x="4" y="6" width="24" height="20" rx="1"/>
    <path d="M4 12h24"/>
    <path d="M4 18h24"/>
    <path d="M4 24h24"/>
    <rect x="6" y="7" width="8" height="4" rx="0.5"/>
    <rect x="6" y="13" width="10" height="4" rx="0.5"/>
    <rect x="18" y="19" width="8" height="4" rx="0.5"/>
    <path d="M4 26h24v2H4z"/>
    <path d="M12 28v2M20 28v2"/>
    <path d="M28 10l2-2M28 16l2 0M28 22l2 2"/>
  </svg>`
};
