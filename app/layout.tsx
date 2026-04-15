import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Prints',
  description: 'Wedding photo galleries that feel like opening a box of prints.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
