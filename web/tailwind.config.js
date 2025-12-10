/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                github: {
                    dark: '#0d1117',
                    darker: '#010409',
                    card: '#161b22',
                    border: '#30363d',
                    text: '#c9d1d9',
                    secondary: '#8b949e',
                    accent: '#58a6ff',
                    success: '#238636',
                    green: '#39d353',
                }
            },
            backdropBlur: {
                xs: '2px',
            },
            boxShadow: {
                'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
                'glass-inset': 'inset 0 0 0 1px rgba(255, 255, 255, 0.05)',
            },
            borderRadius: {
                '2xl': '1rem',
                '3xl': '1.5rem',
            }
        },
    },
    plugins: [],
}
