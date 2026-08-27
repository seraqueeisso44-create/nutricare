import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ToastProvider } from "@/components/ui/toast"
import { ThemeProvider } from "@/components/layout/ThemeProvider"
import { RegisterSW } from "@/components/RegisterSW"
import { CookieBanner } from "@/components/CookieBanner"
import { AuthProvider } from "@/contexts/AuthContext"
import { RecoveryHandler } from "@/components/RecoveryHandler"

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] })

const SITE_URL = "https://nutricare-jet.vercel.app"

export const viewport: Viewport = {
  themeColor: "#0F3D2E",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
}

export const metadata: Metadata = {
  title: {
    default: "NutriCare — Nutrição & Bem-estar",
    template: "%s | NutriCare",
  },
  description: "Calculadora TACO, prescrição dietética e prontuário de pacientes. Gestão nutricional completa para profissionais e consultórios.",
  keywords: ["nutrição", "calculadora TACO", "prescrição dietética", "prontuário paciente", "dietas", "macronutrientes", "calorias", "IMC", "TMB"],
  authors: [{ name: "NutriCare" }],
  creator: "NutriCare",
  metadataBase: new URL(SITE_URL),
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: SITE_URL,
    siteName: "NutriCare",
    title: "NutriCare — Nutrição & Bem-estar",
    description: "Calculadora TACO, prescrição dietética e prontuário de pacientes. Gestão nutricional completa.",
    images: [
      {
        url: "/og",
        width: 1200,
        height: 630,
        alt: "NutriCare — Gestão Nutricional",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NutriCare — Nutrição & Bem-estar",
    description: "Calculadora TACO, prescrição dietética e prontuário de pacientes.",
    images: ["/og"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "NutriCare",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="canonical" href={SITE_URL} />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>
            <RecoveryHandler />
            <RegisterSW />
            <ToastProvider>
              {children}
              <CookieBanner />
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
