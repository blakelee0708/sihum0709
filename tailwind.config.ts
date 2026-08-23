import type { Config } from 'tailwindcss'

/* PRD 21.2 색상 / 21.3 타이포 / 21.4 레이아웃 토큰 */
const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        primary: 'var(--primary)',
        button: 'var(--button)',
        text: 'var(--text)',
        'text-sub': 'var(--text-sub)',
        border: 'var(--border)',
        wood: 'var(--wood)',
        fire: 'var(--fire)',
        earth: 'var(--earth)',
        metal: 'var(--metal)',
        water: 'var(--water)',
        'score-high': 'var(--score-high)',
        'score-mid': 'var(--score-mid)',
        'score-low': 'var(--score-low)',
      },
      borderRadius: {
        card: '24px',
        button: '16px',
        chip: '20px',
        round: '999px',
      },
      spacing: {
        screen: '20px',
        card: '20px',
        'card-gap': '12px',
        section: '28px',
      },
      boxShadow: {
        card: '0 2px 12px rgba(26, 29, 38, 0.06)',
        button: '0 4px 16px rgba(15, 23, 41, 0.16)',
      },
      fontSize: {
        /* PRD 21.3 타이포그래피 */
        headline: ['22px', { lineHeight: '1.4', fontWeight: '700' }],
        'card-title': ['17px', { lineHeight: '1.5', fontWeight: '600' }],
        body: ['15px', { lineHeight: '1.7', fontWeight: '400' }],
        label: ['13px', { lineHeight: '1.4', fontWeight: '500' }],
        score: ['32px', { lineHeight: '1.2', fontWeight: '700' }],
        chat: ['14px', { lineHeight: '1.6' }],
      },
      fontFamily: {
        sans: ['var(--font-pretendard)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
