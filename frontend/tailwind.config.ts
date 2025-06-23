import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {      typography: (theme: any) => ({
        purple: {
          css: {
            '--tw-prose-body': theme('colors.gray[300]'),
            '--tw-prose-headings': theme('colors.purple[400]'),
            '--tw-prose-links': theme('colors.purple[400]'),
            '--tw-prose-bold': theme('colors.white'),
            '--tw-prose-bullets': theme('colors.purple[400]'),
            '--tw-prose-code': theme('colors.purple[300]'),
          },
        },
        blue: {
          css: {
            '--tw-prose-body': theme('colors.gray[300]'),
            '--tw-prose-headings': theme('colors.blue[400]'),
            '--tw-prose-links': theme('colors.blue[400]'),
            '--tw-prose-bold': theme('colors.white'),
            '--tw-prose-bullets': theme('colors.blue[400]'),
            '--tw-prose-code': theme('colors.blue[300]'),
          },
        },
        green: {
          css: {
            '--tw-prose-body': theme('colors.gray[300]'),
            '--tw-prose-headings': theme('colors.green[400]'),
            '--tw-prose-links': theme('colors.green[400]'),
            '--tw-prose-bold': theme('colors.white'),
            '--tw-prose-bullets': theme('colors.green[400]'),
            '--tw-prose-code': theme('colors.green[300]'),
          },
        },
        red: {
          css: {
            '--tw-prose-body': theme('colors.gray[300]'),
            '--tw-prose-headings': theme('colors.red[400]'),
            '--tw-prose-links': theme('colors.red[400]'),
            '--tw-prose-bold': theme('colors.white'),
            '--tw-prose-bullets': theme('colors.red[400]'),
            '--tw-prose-code': theme('colors.red[300]'),
          },
        },
        yellow: {
          css: {
            '--tw-prose-body': theme('colors.gray[300]'),
            '--tw-prose-headings': theme('colors.yellow[400]'),
            '--tw-prose-links': theme('colors.yellow[400]'),
            '--tw-prose-bold': theme('colors.white'),
            '--tw-prose-bullets': theme('colors.yellow[400]'),
            '--tw-prose-code': theme('colors.yellow[300]'),
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}

export default config
