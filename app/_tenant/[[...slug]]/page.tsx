import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import type { TenantApp, AppConfig } from "@/types";
import TenantAppShell from "@/components/renderer/TenantAppShell";

// This route is served for ALL custom domains via Next.js middleware rewrite
// Middleware rewrites custom domain requests to /_tenant/[...slug]?__host=domain

interface Props {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<Record<string, string>>;
}

async function getAppByDomain(host: string): Promise<TenantApp | null> {
  const db = await getDb();
  const normalizedHost = host.toLowerCase().replace(/^www\./, "").split(":")[0];

  return db.collection<TenantApp>("apps").findOne({
    customDomain: normalizedHost,
    status: "live",
    domainVerified: true,
  });
}

export default async function TenantPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const host = sp.__host || "";

  const headersList = await headers();
  const hostHeader = headersList.get("host") || host;

  const app = await getAppByDomain(hostHeader || host);

  if (!app) {
    notFound();
  }

  const pathname = "/" + (slug?.join("/") || "");

  return (
    <TenantAppShell
      app={{
        id: app._id.toString(),
        name: app.name,
        template: app.template,
        config: app.config,
      }}
      pathname={pathname}
    />
  );
}

export async function generateMetadata({ searchParams }: Props) {
  const sp = await searchParams;
  const host = sp.__host || "";

  if (!host) return {};

  const app = await getAppByDomain(host);
  if (!app) return {};

  const seo = app.config?.seo;
  return {
    title: seo?.title || app.name,
    description: seo?.description || "",
    keywords: seo?.keywords || "",
    openGraph: {
      title: seo?.title || app.name,
      description: seo?.description || "",
      images: seo?.ogImage ? [seo.ogImage] : [],
    },
  };
}
