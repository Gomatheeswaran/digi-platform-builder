import type { AppConfig } from "@/types";

interface Props {
  config: AppConfig;
  appName: string;
  basePath?: string;
}

export default function AppFooter({ config, appName, basePath = "" }: Props) {
  const { theme, navigation } = config;

  return (
    <footer
      style={{
        backgroundColor: theme.darkMode ? "#1a1a1a" : "#f8fafc",
        borderTop: `1px solid ${theme.primaryColor}22`,
        color: theme.darkMode ? "#aaa" : "#64748b",
      }}
      className="mt-12 py-8"
    >
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="font-semibold" style={{ color: theme.primaryColor }}>{appName}</div>
          <nav className="flex flex-wrap gap-4">
            {navigation.items.map((item) => (
              <a
                key={item.id}
                href={basePath + item.href}
                className="text-sm hover:opacity-75 transition-opacity no-underline"
                style={{ color: theme.darkMode ? "#aaa" : "#64748b" }}
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="text-xs opacity-60">© {new Date().getFullYear()} {appName}</div>
        </div>
      </div>
    </footer>
  );
}
