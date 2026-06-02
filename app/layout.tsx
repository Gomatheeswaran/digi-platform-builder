import type { Metadata, Viewport } from "next";
import "./globals.css";
import AntdRegistry from "./AntdRegistry";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "App Platform",
  description: "Build and deploy your apps",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">
        <AntdRegistry>
          <Providers>{children}</Providers>
        </AntdRegistry>
      </body>
    </html>
  );
}
