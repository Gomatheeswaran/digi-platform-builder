"use client";
import { Typography, Button } from "antd";
import type { AppConfig, AppTemplate, ComponentConfig } from "@/types";
import AppHeader from "../AppHeader";
import AppFooter from "../AppFooter";

const { Title, Paragraph } = Typography;

interface Props {
  app: { id: string; name: string; template: AppTemplate; config: AppConfig };
  pathname: string;
  config: AppConfig;
  basePath?: string;
}

function renderComponent(comp: ComponentConfig, config: AppConfig, appId: string) {
  switch (comp.type) {
    case "hero":
      return (
        <section
          key={comp.id}
          className="py-20 px-6 text-center"
          style={{ background: `linear-gradient(135deg, ${config.theme.primaryColor}22 0%, ${config.theme.secondaryColor}11 100%)` }}
        >
          <Title level={1} style={{ color: config.theme.textColor }}>
            {comp.props.heading as string || "Welcome"}
          </Title>
          <Paragraph style={{ color: config.theme.textColor, opacity: 0.7, fontSize: 18 }}>
            {comp.props.subtext as string || ""}
          </Paragraph>
          {!!(comp.props.ctaText as string) && (
            <Button
              type="primary"
              size="large"
              href={comp.props.ctaHref as string || "#"}
              className="mt-4"
            >
              {comp.props.ctaText as string}
            </Button>
          )}
        </section>
      );

    case "text_block":
      return (
        <section key={comp.id} className="py-12 px-6 max-w-4xl mx-auto">
          <Paragraph style={{ fontSize: 16, lineHeight: 1.8 }}>
            {comp.props.content as string || ""}
          </Paragraph>
        </section>
      );

    case "image_banner":
      return (
        <section key={comp.id} className="w-full">
          {comp.props.imageUrl ? (
            <img src={comp.props.imageUrl as string} alt="Banner" className="w-full object-cover max-h-96" />
          ) : (
            <div className="w-full h-48 bg-slate-100 flex items-center justify-center text-slate-400">
              No image set
            </div>
          )}
        </section>
      );

    case "contact_form":
      return (
        <section key={comp.id} className="py-12 px-6 max-w-lg mx-auto">
          <Title level={3}>Contact Us</Title>
          <DynamicForm appId={appId} modelSlug="responses" fields={[
            { id: "name", name: "Name", slug: "name", type: "text", required: true },
            { id: "email", name: "Email", slug: "email", type: "email", required: true },
            { id: "message", name: "Message", slug: "message", type: "textarea", required: false },
          ]} submitLabel="Send Message" successMessage="Thank you! We'll be in touch soon." />
        </section>
      );

    case "divider":
      return <hr key={comp.id} className="border-slate-200 my-4 mx-6" />;

    default:
      return (
        <div key={comp.id} className="py-4 px-6 text-center text-slate-400 text-sm">
          [{comp.type} component]
        </div>
      );
  }
}

// Simple inline form component for tenant apps
function DynamicForm({
  appId,
  modelSlug,
  fields,
  submitLabel,
  successMessage,
}: {
  appId: string;
  modelSlug: string;
  fields: Array<{ id: string; name: string; slug: string; type: string; required: boolean }>;
  submitLabel: string;
  successMessage: string;
}) {
  // This is a client-side form — kept simple here
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const data = Object.fromEntries(fd.entries());
        await fetch(`/api/apps/${appId}/data?model=${modelSlug}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...data, submittedAt: new Date().toISOString() }),
        });
        alert(successMessage);
        (e.currentTarget as HTMLFormElement).reset();
      }}
      className="space-y-4"
    >
      {fields.map((f) => (
        <div key={f.id}>
          <label className="block text-sm font-medium mb-1">
            {f.name}{f.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {f.type === "textarea" ? (
            <textarea
              name={f.slug}
              required={f.required}
              className="w-full border border-slate-200 rounded-lg p-2 text-sm"
              rows={4}
            />
          ) : (
            <input
              type={f.type === "email" ? "email" : "text"}
              name={f.slug}
              required={f.required}
              className="w-full border border-slate-200 rounded-lg p-2 text-sm"
            />
          )}
        </div>
      ))}
      <Button type="primary" htmlType="submit" block size="large">{submitLabel}</Button>
    </form>
  );
}

export default function GenericRenderer({ app, pathname, config, basePath = "" }: Props) {
  const currentPage = config.pages.find((p) =>
    pathname === "/" ? p.isHome : `/${p.slug}` === pathname
  ) || config.pages.find((p) => p.isHome) || config.pages[0];

  if (!currentPage) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Title level={3}>Page not found</Title>
      </div>
    );
  }

  return (
    <div>
      <AppHeader config={config} appName={app.name} pathname={pathname} basePath={basePath} />
      <main>
        {currentPage.components
          .sort((a, b) => a.order - b.order)
          .map((comp) => renderComponent(comp, config, app.id))}
      </main>
      <AppFooter config={config} appName={app.name} basePath={basePath} />
    </div>
  );
}
