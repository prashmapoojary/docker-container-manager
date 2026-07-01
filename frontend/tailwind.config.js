/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "#0a0f1c",
                card: "#121a2a",
                border: "#1e2a44",
                accent: "#22d3ee",
                "accent-hover": "#06b6d4",
                muted: "#334155",
                success: "#4ade80",
                danger: "#f87171",
                warning: "#fbbf24",
                text: {
                    primary: "#f8fafc",
                    secondary: "#94a3b8",
                }
            },
        },
    },
    plugins: [],
}