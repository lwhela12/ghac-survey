// frontend/src/styles/theme.ts
export const theme = {
  colors: {
    primary: '#0055A5', // GHAC Blue
    secondary: '#B2BB1C', // GHAC Green
    accent: {
      coral: '#FF6B6B',
      purple: '#845EC2',
      teal: '#4ECDC4',
      yellow: '#FFE66D',
      pink: '#FF6F91'
    },
    background: '#FFF8F1', // Warm cream background from GHAC site
    surface: '#FFFFFF',
    surfaceAlt: '#FFF5EB', // Slightly darker warm tone
    text: {
      primary: '#1A1A2E',
      secondary: '#4A5568',
      light: '#718096',
      inverse: '#FFFFFF'
    },
    border: '#E2E8F0',
    borderLight: '#F0F4F8',
    error: '#E53E3E',
    success: '#48BB78',
    warning: '#ED8936',
    chatBubble: {
      bot: '#FFFFFF', // Clean white for bot messages
      botText: '#1A1A2E',
      user: 'linear-gradient(135deg, #0055A5 0%, #003d7a 100%)',
      userText: '#FFFFFF'
    },
    gradients: {
      primary: 'linear-gradient(135deg, #0055A5 0%, #003d7a 100%)',
      secondary: 'linear-gradient(135deg, #B2BB1C 0%, #8fa117 100%)',
      artistic: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      sunset: 'linear-gradient(135deg, #FF6B6B 0%, #FFE66D 100%)',
      ocean: 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)'
    }
  },
  fonts: {
    primary: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    display: "'Poppins', 'Inter', sans-serif"
  },
  fontSizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem'
  },
  fontWeights: {
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
    '4xl': '5rem'
  },
  borderRadius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '1rem',
    xl: '1.5rem',
    '2xl': '2rem',
    full: '9999px'
  },
  breakpoints: {
    mobile: '480px',
    tablet: '768px',
    desktop: '1024px',
    wide: '1280px'
  },
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    normal: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '500ms cubic-bezier(0.4, 0, 0.2, 1)'
  },
  shadows: {
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
    artistic: '0 14px 28px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.22)'
  },
  animations: {
    bounce: 'bounce 1s infinite',
    pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    float: 'float 3s ease-in-out infinite'
  }
};