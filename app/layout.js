import "./globals.css";

export const viewport = {
  themeColor: "#6A76CC",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata = {
  title: "Absensi Kelas — Presensi Siswa Resmi",
  description: "Sistem Presensi Kelas Digital & Rekapitulasi Kehadiran Bulanan Otomatis",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon.svg",
    apple: "/aset-pwa/ikon-192.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/aset-pwa/ikon-192.svg" />
      </head>
      <body className="antialiased min-h-screen bg-page text-slate-800">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function() {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
