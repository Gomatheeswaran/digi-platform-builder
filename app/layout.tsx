"use client";
import "./globals.css";
import { ConfigProvider, App } from "antd";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="min-h-full">
        <ConfigProvider
          theme={{
            token: {
              colorPrimary: "#1677ff",
              borderRadius: 8,
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, sans-serif',
            },
          }}
        >
          <App>{children}</App>
        </ConfigProvider>
      </body>
    </html>
  );
}
