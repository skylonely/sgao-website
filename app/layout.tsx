import type { Metadata, Viewport } from "next";
import { Noto_Sans_SC } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const notoSans = Noto_Sans_SC({
  variable: "--font-noto-sans-sc",
  subsets: ["latin"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ||
    requestHeaders.get("host") ||
    "localhost:3000";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ||
    (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  const title = "拾光导航｜从这里，起飞。";
  const description =
    "精选影视、动漫、阅读、工具与开发资源，干净、快速、无广告弹窗。";

  return {
    metadataBase: new URL(origin),
    title,
    description,
    keywords: ["网址导航", "影视", "动漫", "工具", "拾光导航"],
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
    openGraph: {
      type: "website",
      title,
      description,
      url: origin,
      siteName: "拾光导航",
      locale: "zh_CN",
      images: [
        {
          url: `${origin}/og.png`,
          width: 1792,
          height: 1024,
          alt: "拾光导航｜从这里，起飞。",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${origin}/og.png`],
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f2ed" },
    { media: "(prefers-color-scheme: dark)", color: "#111319" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={notoSans.variable}>{children}</body>
    </html>
  );
}
