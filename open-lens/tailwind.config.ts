import type { Config } from 'tailwindcss';
import { fontFamily } from 'tailwindcss/defaultTheme';

export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],

	theme: {
		extend: {
			height: {
				112: '28rem',
				120: '30rem',
				128: '32rem',
				'1/2': '50%',
				'1/3': '33.333333%',
				'2/3': '66.666667%',
				'3/4': '75%',
				'4/5': '80%',
				'9/10': '90%'
			},
			screens: {
				xs: '520px',
				'bs-sm': '576px',
				'bs-md': '768px',
				'bs-lg': '992px',
				'bs-xl': '1200px',
				'bs-2xl': '1400px'
			},
			maxWidth: {
				'bs-sm': `${540 / 16}rem`,
				'bs-md': `${720 / 16}rem`,
				'bs-lg': `${960 / 16}rem`,
				'bs-xl': `${1140 / 16}rem`,
				'bs-2xl': `${1320 / 16}rem`
			},
			spacing: {
				17: '4.25rem',
				18: '4.5rem'
			},
			gridTemplateColumns: {
				16: 'repeat(16, minmax(0, 1fr))',
				24: 'repeat(24, minmax(0, 1fr))'
			},
			colors: {
				'light-gray': '#f1f1f1'
			},
			lineHeight: {
				11: '2.75rem',
				12: '3rem',
				14: '3.5rem',
				16: '4rem'
			},
			zIndex: {
				'-1': '-1',
				'100': '100',
				'200': '200',
				'300': '300',
				'400': '400',
				'500': '500',
				'600': '600',
				'700': '700',
				'800': '800',
				'900': '900',
				'1000': '1000',
				'1500': '1500',
				'2000': '2000'
			},
			fontFamily: {
				sans: ['Saans', ...fontFamily.sans],
				serif: ['Domine Variable', ...fontFamily.serif],
				mono: ['JetBrains Mono Variable', ...fontFamily.mono]
			}
		}
	},

	plugins: []
} satisfies Config;
