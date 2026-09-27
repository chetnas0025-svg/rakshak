# Tailwind CSS Token & @apply Integrity Rules

## 1. Explicit Key Definition
When applying utility classes via `@apply` in `src/index.css`:
- Never use `@apply` on a class unless that class is guaranteed to exist either in Tailwind defaults or explicitly configured under `theme.extend` in `tailwind.config.js`.
- Custom background classes such as `bg-surface-sunken`, `bg-surface-raised`, and `bg-surface-overlay` must have matching keys under `theme.extend.colors`.

## 2. Theme Variable Fallbacks
- Always define corresponding CSS variables in both `:root` (dark default) and `.light` (light theme):
  - `--color-bg-sunken`
  - `--color-bg-overlay`
  - `--shadow-floating`
- High-contrast mode overrides (`Alt + C`) must preserve minimum 4.5:1 contrast ratios for normal text and 3:1 for graphical UI elements (WCAG 2.1 AA/AAA compliance).

## 3. Pre-Commit Verification
- Always execute `npm run build` (`tsc && vite build`) to confirm PostCSS compilation and TypeScript types before committing or completing tasks.
