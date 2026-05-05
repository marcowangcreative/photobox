import type { Metadata } from 'next';
import './globals.css';
import ThemeToggle from '../components/ThemeToggle';

export const metadata: Metadata = {
  title: 'Photokase',
  description: 'Wedding sneak peeks delivered as a curated keepsake — a tactile box of hand-picked prints.',
  icons: {
    icon: '/favicon.png',
  },
};

const themeInitScript = `(function(){try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia&&window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme='dark';}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        {children}
        <ThemeToggle />
      </body>
    </html>
  );
}
