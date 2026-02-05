import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { Providers } from '@/components/Providers';

import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Structura - Rapid Structural Analysis',
  description:
    'Fast 2D frame and truss analysis in your browser. Sketch, analyze, and get shear/moment/deflection diagrams in seconds.',
  keywords: [
    'structural analysis',
    'beam calculator',
    'frame analysis',
    'truss analysis',
    'moment diagram',
    'shear diagram',
    'civil engineering',
    'structural engineering',
  ],
  authors: [{ name: 'Structura Team' }],
  openGraph: {
    title: 'Structura - Rapid Structural Analysis',
    description: 'Fast 2D frame and truss analysis in your browser.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased bg-background-light dark:bg-background-dark text-slate-900 dark:text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
