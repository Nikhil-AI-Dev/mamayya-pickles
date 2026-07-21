import type { Metadata } from "next";
import { Bricolage_Grotesque, Manrope, Noto_Sans_Telugu } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/lib/cart";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileNav from "@/components/MobileNav";
import CartDrawer from "@/components/CartDrawer";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

const notoTelugu = Noto_Sans_Telugu({
  variable: "--font-noto-telugu",
  subsets: ["telugu"],
  weight: ["400"],
});

export const viewport = {
  themeColor: "#241713",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://mamayyapickles.com"),
  manifest: "/site.webmanifest",
  title: {
    default: "Mamayya Pickles - Taste of Rayalaseema",
    template: "%s | Mamayya Pickles",
  },
  description:
    "Handmade non-veg pickles - chicken, mutton, fish and prawn - packed with bold spices and delivered across India. Freshly prepared, online payment only.",
  openGraph: {
    type: "website",
    siteName: "Mamayya Pickles",
    locale: "en_IN",
    url: "https://mamayyapickles.com",
    title: "Mamayya Pickles - Taste of Rayalaseema",
    description:
      "Handmade chicken, mutton, fish and prawn pickles, prepared fresh per order and delivered across India.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mamayya Pickles - Taste of Rayalaseema",
    description:
      "Handmade non-veg pickles, prepared fresh per order and delivered across India.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${manrope.variable} ${notoTelugu.variable} h-full antialiased`}
    >
      <head>
        {/* Warm the connection to the order API before checkout/track need it. */}
        <link rel="preconnect" href="https://mamayya-api.onrender.com" />
      </head>
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Mamayya Pickles",
              url: "https://mamayyapickles.com",
              logo: "https://mamayyapickles.com/logo-512.png",
              email: "contact@mamayyapickles.com",
              sameAs: ["https://www.instagram.com/mamayyapickle/"],
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Mamayya Pickles",
              alternateName: "Mamayya Pickles - Taste of Rayalaseema",
              url: "https://mamayyapickles.com",
            }),
          }}
        />
        <CartProvider>
          <Header />
          <main className="flex-1 pb-16 md:pb-0">{children}</main>
          <Footer />
          <MobileNav />
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
