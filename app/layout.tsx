export const metadata = {
  title: 'Watch2Together',
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
