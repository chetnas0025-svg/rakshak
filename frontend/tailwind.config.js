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
        // ===========================================
        // PARALLEL DESIGN SYSTEM - COLOR TOKENS
        // ===========================================

        // Semantic Color Aliases (reference tokens)
        'color-bg-primary': 'var(--color-bg-primary)',
        'color-bg-secondary': 'var(--color-bg-secondary)',
        'color-bg-tertiary': 'var(--color-bg-tertiary)',
        'color-bg-elevated': 'var(--color-bg-elevated)',
        'color-bg-overlay': 'var(--color-bg-overlay)',
        'color-bg-inverse': 'var(--color-bg-inverse)',

        'color-fg-primary': 'var(--color-fg-primary)',
        'color-fg-secondary': 'var(--color-fg-secondary)',
        'color-fg-tertiary': 'var(--color-fg-tertiary)',
        'color-fg-inverse': 'var(--color-fg-inverse)',
        'color-fg-disabled': 'var(--color-fg-disabled)',

        'color-border-primary': 'var(--color-border-primary)',
        'color-border-secondary': 'var(--color-border-secondary)',
        'color-border-focus': 'var(--color-border-focus)',
        'color-border-error': 'var(--color-border-error)',

        // Brand System
        'brand-50': '#f0f9ff',
        'brand-100': '#e0f2fe',
        'brand-200': '#bae6fd',
        'brand-300': '#7dd3fc',
        'brand-400': '#38bdf8',
        'brand-500': '#0ea5e9',
        'brand-600': '#0284c7',
        'brand-700': '#0369a1',
        'brand-800': '#075985',
        'brand-900': '#0c4a6e',
        'brand-950': '#082f49',

        // Accent System (for data viz)
        'accent-cyan': '#06b6d4',
        'accent-teal': '#14b8a6',
        'accent-emerald': '#10b981',
        'accent-amber': '#f59e0b',
        'accent-orange': '#f97316',
        'accent-red': '#ef4444',
        'accent-rose': '#f43f5e',
        'accent-purple': '#a855f7',
        'accent-violet': '#8b5cf6',
        'accent-indigo': '#6366f1',
        'accent-blue': '#3b82f6',
        'accent-sky': '#0ea5e9',

        // Risk Semantic Colors (WCAG AA compliant)
        'risk-normal': '#059669',
        'risk-normal-bg': '#ecfdf5',
        'risk-normal-border': '#a7f3d0',
        'risk-normal-muted': 'rgba(5, 150, 105, 0.2)',
        'risk-advisory': '#d97706',
        'risk-advisory-bg': '#fffbeb',
        'risk-advisory-border': '#fde68a',
        'risk-advisory-muted': 'rgba(217, 119, 6, 0.2)',
        'risk-watch': '#ea580c',
        'risk-watch-bg': '#fff7ed',
        'risk-watch-border': '#fed7aa',
        'risk-watch-muted': 'rgba(234, 88, 12, 0.2)',
        'risk-warning': '#dc2626',
        'risk-warning-bg': '#fef2f2',
        'risk-warning-border': '#fecaca',
        'risk-warning-muted': 'rgba(220, 38, 38, 0.2)',

        // Surface Semantic Hierarchy (Data-Dense Dashboard & Tactical HUD)
        'surface-base': 'var(--color-bg, #0f172a)',
        'surface-raised': 'var(--color-bg-elevated, #1c2330)',
        'surface-sunken': 'var(--color-bg-sunken, #090d16)',
        'surface-overlay': 'var(--color-bg-overlay, #1e293b)',

        // Neutral Scale (12-step)
        'neutral-0': '#ffffff',
        'neutral-25': '#fafafa',
        'neutral-50': '#f4f4f5',
        'neutral-100': '#e4e4e7',
        'neutral-200': '#d4d4d8',
        'neutral-300': '#a1a1aa',
        'neutral-400': '#71717a',
        'neutral-500': '#52525b',
        'neutral-600': '#3f3f46',
        'neutral-700': '#27272a',
        'neutral-800': '#18181b',
        'neutral-900': '#09090b',
        'neutral-950': '#030303',

        // Commusoft Modern SaaS Theme Palette (Reference Dribbble Design)
        commusoft: {
          teal: '#064244',
          'teal-light': '#0a5254',
          'teal-hover': '#095254',
          'teal-active': '#0d6063',
          'teal-dark': '#032e30',
          'teal-subtle': '#0e5658',
          orange: '#ea580c',
          amber: '#f59e0b',
          bg: '#f4f6f8',
          surface: '#ffffff',
          card: '#ffffff',
          border: '#e2e8f0',
          mint: '#10b981',
          'mint-subtle': '#d1fae5',
          'mint-dark': '#059669',
        },

        // Tactical/Operational Palette (preserved for fallback)
        tactical: {
          bg: '#0f1419',
          surface: '#161b22',
          card: '#1c232d',
          elevated: '#212934',
          border: '#2d3744',
          highlight: '#374354',
          accent: '#0284c7',
          ochre: '#b45309',
          chalk: '#e6edf3',
          muted: '#64748b',
        },

        // Chart Palette (colorblind-safe, categorical)
        chart: {
          1: '#0077BB', // Blue
          2: '#EE7733', // Orange
          3: '#009988', // Teal
          4: '#CC3311', // Red
          5: '#33BBEE', // Cyan
          6: '#EE3377', // Magenta
          7: '#BBBBBB', // Gray
          8: '#33BB33', // Green
          9: '#7777BB', // Purple
          10: '#BB33BB', // Violet
        },

        // River System Colors
        river: {
          beas: '#2563eb',
          parbati: '#7c3aed',
          tirthan: '#059669',
          sutlej: '#dc2626',
          ravi: '#f59e0b',
          chenab: '#06b6d4',
        },
      },

      // ===========================================
      // PARALLEL DESIGN SYSTEM - SPACING TOKENS
      // ===========================================
      spacing: {
        'space-0': '0',
        'space-1': '0.125rem',   // 2px
        'space-2': '0.25rem',    // 4px
        'space-3': '0.375rem',   // 6px
        'space-4': '0.5rem',     // 8px
        'space-5': '0.625rem',   // 10px
        'space-6': '0.75rem',    // 12px
        'space-8': '1rem',       // 16px
        'space-10': '1.25rem',   // 20px
        'space-12': '1.5rem',    // 24px
        'space-16': '2rem',      // 32px
        'space-20': '2.5rem',    // 40px
        'space-24': '3rem',      // 48px
        'space-32': '4rem',      // 64px
        'space-40': '5rem',      // 80px
        'space-48': '6rem',      // 96px
        'space-64': '8rem',      // 128px
      },

      // ===========================================
      // PARALLEL DESIGN SYSTEM - TYPOGRAPHY TOKENS
      // ===========================================
      fontFamily: {
        sans: ['Outfit', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Space Grotesk', 'Outfit', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'SF Mono', 'Cascadia Code', 'monospace'],
        code: ['Fira Code', 'JetBrains Mono', 'monospace'],
        ui: ['Outfit', 'Inter', 'sans-serif'],
      },
      fontSize: {
        // Fluid type scale (clamp-based)
        'display-xl': ['clamp(2.5rem, 5vw, 4rem)', { lineHeight: '1.1', letterSpacing: '-0.03em', fontWeight: '700' }],
        'display-lg': ['clamp(2rem, 4vw, 3rem)', { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-md': ['clamp(1.5rem, 3vw, 2.25rem)', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '600' }],
        'display-sm': ['clamp(1.25rem, 2.5vw, 1.75rem)', { lineHeight: '1.25', letterSpacing: '-0.01em', fontWeight: '600' }],

        'heading-xl': ['clamp(1.5rem, 2.5vw, 2rem)', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '600' }],
        'heading-lg': ['clamp(1.25rem, 2vw, 1.5rem)', { lineHeight: '1.35', letterSpacing: '-0.01em', fontWeight: '600' }],
        'heading-md': ['clamp(1.125rem, 1.5vw, 1.25rem)', { lineHeight: '1.4', fontWeight: '600' }],
        'heading-sm': ['clamp(1rem, 1.25vw, 1.125rem)', { lineHeight: '1.4', fontWeight: '600' }],
        'heading-xs': ['0.875rem', { lineHeight: '1.4', fontWeight: '600' }],

        'body-lg': ['1.125rem', { lineHeight: '1.6', fontWeight: '400' }],
        'body-md': ['1rem', { lineHeight: '1.6', fontWeight: '400' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
        'body-xs': ['0.8125rem', { lineHeight: '1.5', fontWeight: '400' }],
        'body-2xs': ['0.75rem', { lineHeight: '1.5', fontWeight: '400' }],

        'label-lg': ['1rem', { lineHeight: '1.5', fontWeight: '500' }],
        'label-md': ['0.875rem', { lineHeight: '1.5', fontWeight: '500' }],
        'label-sm': ['0.8125rem', { lineHeight: '1.5', fontWeight: '500' }],
        'label-xs': ['0.75rem', { lineHeight: '1.5', fontWeight: '500' }],

        'code-sm': ['0.8125rem', { lineHeight: '1.6', fontFamily: 'var(--font-mono)' }],
        'code-xs': ['0.75rem', { lineHeight: '1.6', fontFamily: 'var(--font-mono)' }],
      },
      fontWeight: {
        'light': '300',
        'normal': '400',
        'medium': '500',
        'semibold': '600',
        'bold': '700',
        'extrabold': '800',
      },
      letterSpacing: {
        'tightest': '-0.03em',
        'tighter': '-0.02em',
        'tight': '-0.01em',
        'normal': '0',
        'wide': '0.01em',
        'wider': '0.02em',
        'widest': '0.04em',
      },

      // ===========================================
      // PARALLEL DESIGN SYSTEM - BORDER RADIUS
      // ===========================================
      borderRadius: {
        'none': '0',
        'xs': '2px',
        'sm': '4px',
        'md': '6px',
        'lg': '8px',
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
        'full': '9999px',
      },

      // ===========================================
      // PARALLEL DESIGN SYSTEM - SHADOWS
      // ===========================================
      boxShadow: {
        'shadow-xs': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'shadow-sm': '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
        'shadow-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'shadow-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'shadow-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'shadow-2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',

        // Card and HUD panel shadows
        'card': '0 2px 8px -2px rgba(0, 0, 0, 0.4), 0 1px 4px -1px rgba(0, 0, 0, 0.2)',
        'elevated': '0 8px 24px -4px rgba(0, 0, 0, 0.5), 0 4px 12px -2px rgba(0, 0, 0, 0.3)',
        'floating': '0 12px 32px -4px rgba(0, 0, 0, 0.6), 0 4px 16px -2px rgba(0, 0, 0, 0.4)',

        // Elevation shadows (Material-inspired)
        'elevation-1': '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08)',
        'elevation-2': '0 4px 6px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.08)',
        'elevation-3': '0 8px 16px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.08)',
        'elevation-4': '0 16px 32px rgba(0, 0, 0, 0.12), 0 8px 16px rgba(0, 0, 0, 0.08)',
        'elevation-5': '0 24px 48px rgba(0, 0, 0, 0.15), 0 12px 24px rgba(0, 0, 0, 0.1)',

        // Glow shadows
        'glow-sm': '0 0 8px rgba(6, 182, 212, 0.15)',
        'glow-md': '0 0 16px rgba(6, 182, 212, 0.2)',
        'glow-lg': '0 0 32px rgba(6, 182, 212, 0.25)',
        'glow-accent': '0 0 24px rgba(16, 185, 129, 0.2)',
        'glow-warning': '0 0 24px rgba(239, 68, 68, 0.25)',
      },

      // ===========================================
      // PARALLEL DESIGN SYSTEM - ANIMATION
      // ===========================================
      keyframes: {
        'slide-in': {
          '0%': { transform: 'translateY(-4px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-out': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'scale-out': {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.95)', opacity: '0' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(6, 182, 212, 0.4)' },
          '50%': { boxShadow: '0 0 16px 4px rgba(6, 182, 212, 0.2)' },
        },
        'status-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(16, 185, 129, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(16, 185, 129, 0)' },
        },
        'status-pulse-warning': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(239, 68, 68, 0)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'accordion-down': {
          '0%': { height: '0' },
          '100%': { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          '0%': { height: 'var(--radix-accordion-content-height)' },
          '100%': { height: '0' },
        },
      },
      animation: {
        'slide-in': 'slide-in 200ms cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up': 'slide-up 250ms cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slide-down 200ms cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in': 'fade-in 150ms ease-out',
        'fade-out': 'fade-out 150ms ease-in',
        'scale-in': 'scale-in 150ms cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-out': 'scale-out 150ms cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-slow': 'pulse-slow 2.5s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'status-pulse': 'status-pulse 2s ease-in-out infinite',
        'status-pulse-warning': 'status-pulse-warning 1.5s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'spin-slow': 'spin-slow 3s linear infinite',
        'accordion-down': 'accordion-down 200ms cubic-bezier(0.16, 1, 0.3, 1)',
        'accordion-up': 'accordion-up 200ms cubic-bezier(0.16, 1, 0.3, 1)',
        'in': 'slide-in 200ms cubic-bezier(0.16, 1, 0.3, 1), fade-in 150ms ease-out',
        'out': 'slide-out 150ms cubic-bezier(0.16, 1, 0.3, 1), fade-out 150ms ease-in',
      },

      // ===========================================
      // PARALLEL DESIGN SYSTEM - Z-INDEX
      // ===========================================
      zIndex: {
        'layer-0': '0',
        'layer-1': '10',
        'layer-2': '20',
        'layer-3': '30',
        'layer-4': '40',
        'layer-5': '50',
        'dropdown': '100',
        'sticky': '200',
        'overlay': '300',
        'modal': '400',
        'popover': '500',
        'tooltip': '600',
        'toast': '700',
      },

      // ===========================================
      // PARALLEL DESIGN SYSTEM - TRANSITIONS
      // ===========================================
      transitionDuration: {
        '0': '0ms',
        '75': '75ms',
        '100': '100ms',
        '150': '150ms',
        '200': '200ms',
        '250': '250ms',
        '300': '300ms',
        '400': '400ms',
        '500': '500ms',
        '700': '700ms',
        '1000': '1000ms',
      },
      transitionTimingFunction: {
        'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
        'ease-in': 'cubic-bezier(0.4, 0, 1, 1)',
        'sharp': 'cubic-bezier(0.4, 0, 0.6, 1)',
        'spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },

      // ===========================================
      // PARALLEL DESIGN SYSTEM - BREAKPOINTS
      // ===========================================
      screens: {
        'xs': '480px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        '3xl': '1920px',
      },

      // ===========================================
      // PARALLEL DESIGN SYSTEM - CONTAINER
      // ===========================================
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '1.5rem',
          lg: '2rem',
          xl: '2.5rem',
          '2xl': '3rem',
        },
      },
    },
  },
  plugins: [],
}