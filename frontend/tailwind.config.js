/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            color: '#e5e7eb', // text-gray-200
            h1: {
              color: '#f9fafb', // text-gray-50
            },
            h2: {
              color: '#f9fafb', // text-gray-50
            },
            h3: {
              color: '#f3f4f6', // text-gray-100
            },
            h4: {
              color: '#f3f4f6', // text-gray-100
            },
            strong: {
              color: '#f9fafb', // text-gray-50
            },
            code: {
              color: '#fbbf24', // text-amber-400
              backgroundColor: '#374151', // bg-gray-700
              padding: '0.125rem 0.25rem',
              borderRadius: '0.25rem',
            },
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
            pre: {
              backgroundColor: '#1f2937', // bg-gray-800
              color: '#e5e7eb', // text-gray-200
            },
            blockquote: {
              color: '#d1d5db', // text-gray-300
              borderLeftColor: '#6366f1', // border-indigo-500
            },
            ul: {
              color: '#e5e7eb', // text-gray-200
            },
            ol: {
              color: '#e5e7eb', // text-gray-200
            },
            li: {
              color: '#e5e7eb', // text-gray-200
            },
            'li::marker': {
              color: '#9ca3af', // text-gray-400
            },
            a: {
              color: '#60a5fa', // text-blue-400
              '&:hover': {
                color: '#93c5fd', // text-blue-300
              },
            },
            table: {
              color: '#e5e7eb', // text-gray-200
            },
            th: {
              color: '#f9fafb', // text-gray-50
              backgroundColor: '#374151', // bg-gray-700
            },
            td: {
              borderColor: '#4b5563', // border-gray-600
            },
            thead: {
              borderBottomColor: '#4b5563', // border-gray-600
            },
            tbody: {
              borderColor: '#4b5563', // border-gray-600
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
