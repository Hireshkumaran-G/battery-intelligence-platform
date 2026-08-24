/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        theme: {
          root: "var(--bg-root)",
          sidebar: "var(--bg-sidebar)",
          sidebarHeader: "var(--bg-sidebar-header)",
          topbar: "var(--bg-topbar)",
          workspace: "var(--bg-workspace)",
          panel: "var(--bg-panel)",
          panelSub: "var(--bg-panel-sub)",
          controlStrip: "var(--bg-control-strip)",
          border: "var(--border-main)",
          borderSub: "var(--border-sub)",
          borderHover: "var(--border-hover)",
          textPrimary: "var(--text-primary)",
          textSecondary: "var(--text-secondary)",
          textMuted: "var(--text-muted)",
          textSubtle: "var(--text-subtle)",
        },
        bip: {
          voltage: "var(--accent-voltage)",
          current: "var(--accent-current)",
          thermal: "var(--accent-thermal)",
          ripple: "var(--accent-ripple)",
          model: "var(--accent-model)",
          healthy: "var(--accent-healthy)",
          censored: "var(--accent-censored)",
        }
      },
      fontFamily: {
        sans: ['Inter', 'Geist', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Roboto Mono', 'ui-monospace', 'monospace'],
      }
    },
  },
  plugins: [],
}
