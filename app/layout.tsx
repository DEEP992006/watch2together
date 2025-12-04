import './globals.css'

export const metadata = {
  title: 'TaraDeepVibes',
  description: 'Synced video player with chat',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
