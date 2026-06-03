"use client";
import { Button, Badge } from "antd";
import { ShoppingCartOutlined, MenuOutlined } from "@ant-design/icons";
import type { AppConfig } from "@/types";
import Link from "next/link";
import { useState } from "react";

interface Props {
  config: AppConfig;
  appName: string;
  pathname: string;
  basePath?: string;
}

export default function AppHeader({ config, appName, pathname, basePath = "" }: Props) {
  const { theme, navigation } = config;
  const [mobileOpen, setMobileOpen] = useState(false);

  const headerStyle: React.CSSProperties = {
    backgroundColor: theme.backgroundColor,
    borderBottom: `1px solid ${theme.primaryColor}22`,
    position: theme.headerStyle === "sticky" ? "sticky" : theme.headerStyle === "fixed" ? "fixed" : "static",
    top: 0,
    zIndex: 100,
    width: "100%",
  };

  return (
    <header style={headerStyle}>
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo / Name */}
        <Link href={basePath || "/"} className="flex items-center gap-2 no-underline">
          {theme.logoUrl ? (
            <img src={theme.logoUrl} alt={appName} className="h-8 w-auto" />
          ) : (
            <span
              className="font-bold text-xl"
              style={{ color: theme.primaryColor }}
            >
              {appName}
            </span>
          )}
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navigation.items.map((item) => (
            <Link
              key={item.id}
              href={basePath + item.href}
              className="text-sm font-medium no-underline hover:opacity-75 transition-opacity"
              style={{ color: pathname === item.href ? theme.primaryColor : theme.textColor }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {navigation.cartEnabled && (
            <Link href={basePath + "/cart"}>
              <Badge count={0} showZero={false}>
                <Button type="text" icon={<ShoppingCartOutlined />} />
              </Badge>
            </Link>
          )}
          {navigation.showAuthButtons && (
            <div className="hidden md:flex items-center gap-2">
              <Link href="/login">
                <Button type="text" size="small" style={{ color: theme.textColor }}>Login</Button>
              </Link>
              <Link href="/register">
                <Button type="primary" size="small">Sign Up</Button>
              </Link>
            </div>
          )}
          <Button
            type="text"
            icon={<MenuOutlined />}
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          />
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="md:hidden px-4 pb-4 border-t"
          style={{ borderColor: `${theme.primaryColor}22`, backgroundColor: theme.backgroundColor }}
        >
          {navigation.items.map((item) => (
            <Link
              key={item.id}
              href={basePath + item.href}
              className="block py-2 text-sm font-medium no-underline"
              style={{ color: theme.textColor }}
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
