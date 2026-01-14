export const colors = {
  background: '#0a0a1a',
  accent: '#00ffff',
  danger: '#ff3366',
  success: '#00ff88',
  credits: '#ffcc00',

  text: {
    primary: '#ffffff',
    secondary: 'rgba(255, 255, 255, 0.7)',
    muted: 'rgba(255, 255, 255, 0.5)',
  },
} as const;

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
} as const;

export const typography = {
  fontFamily: {
    base: "'Segoe UI', system-ui, -apple-system, sans-serif",
    mono: "'Fira Code', 'Consolas', monospace",
  },
  fontSize: {
    xs: '12px',
    sm: '14px',
    md: '16px',
    lg: '20px',
    xl: '24px',
    xxl: '32px',
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    bold: 700,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

export const theme = {
  colors,
  spacing,
  typography,
} as const;

export type Theme = typeof theme;
