import { notFound, redirect } from "next/navigation";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import type { TenantApp } from "@/types";
import TenantAppShell from "@/components/renderer/TenantAppShell";
import PreviewBanner from "@/components/preview/PreviewBanner";

interface Props {
  params: Promise<{ id: string; slug?: string[] }>;
}

export default async function PreviewPage({ params }: Props) {
  const { id, slug } = await params;

  // Must be logged in
  const user = await getSessionUser();
  if (!user) redirect(`/login?redirect=/preview/${id}`);

  if (!ObjectId.isValid(id)) notFound();

  const db = await getDb();
  const app = await db.collection<TenantApp>("apps").findOne({
    _id: new ObjectId(id),
    userId: user._id, // only the owner can preview
  });

  if (!app) notFound();

  const pathname = "/" + (slug?.join("/") || "");

  return (
    <div className="relative">
      <PreviewBanner appId={id} appName={app.name} />
      {/* Offset the app content below the fixed banner */}
      <div style={{ paddingTop: 44 }}>
        <TenantAppShell
          app={{
            id: app._id.toString(),
            name: app.name,
            template: app.template,
            config: app.config,
          }}
          pathname={pathname}
        />
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  if (!ObjectId.isValid(id)) return {};

  const db = await getDb();
  const app = await db.collection<TenantApp>("apps").findOne({ _id: new ObjectId(id) });
  if (!app) return {};

  return { title: `Preview — ${app.name}` };
}
