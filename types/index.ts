import { ObjectId } from "mongodb";

// ─────────────────────────────────────────────
// Auth & Users
// ─────────────────────────────────────────────

export interface PlatformUser {
  _id: ObjectId;
  name: string;
  email: string; // @gmail.com only
  password: string;
  role: "super_admin" | "tenant_admin";
  isEmailVerified: boolean;
  plan: "free" | "starter" | "pro";
  createdAt: Date;
  updatedAt: Date;
}

export interface OTPRecord {
  _id: ObjectId;
  email: string;
  otpHash: string;
  type: "register" | "login";
  attempts: number;
  expiresAt: Date;
  createdAt: Date;
}

// ─────────────────────────────────────────────
// Apps
// ─────────────────────────────────────────────

export type AppTemplate =
  | "ecommerce"
  | "notepad"
  | "calculator"
  | "directory"
  | "form_collector"
  | "blank";

export type AppStatus = "draft" | "live" | "paused";

export interface TenantApp {
  _id: ObjectId;
  userId: ObjectId;
  name: string;
  slug: string;
  description: string;
  template: AppTemplate;
  config: AppConfig;
  status: AppStatus;
  // Hosting
  customDomain: string | null;
  domainVerified: boolean;
  sslStatus: "none" | "pending" | "active" | "failed";
  // Billing
  plan: "free" | "hosted";
  razorpayOrderId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─────────────────────────────────────────────
// App Config — the JSON schema that drives the builder & renderer
// ─────────────────────────────────────────────

export interface AppConfig {
  theme: AppTheme;
  seo: AppSEO;
  navigation: NavigationConfig;
  pages: PageConfig[];
  dataModels: DataModelConfig[];
  integrations: IntegrationsConfig;
  // Template-specific settings (flat, template fills this in)
  settings: Record<string, unknown>;
}

export interface AppTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  borderRadius: "none" | "small" | "medium" | "large" | "full";
  logoUrl: string;
  faviconUrl: string;
  headerStyle: "fixed" | "sticky" | "static";
  darkMode: boolean;
}

export interface AppSEO {
  title: string;
  description: string;
  keywords: string;
  ogImage: string;
}

export interface NavigationConfig {
  items: NavItem[];
  showAuthButtons: boolean;
  cartEnabled: boolean;
}

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon?: string;
}

export interface PageConfig {
  id: string;
  name: string;
  slug: string;
  isHome: boolean;
  components: ComponentConfig[];
}

export interface ComponentConfig {
  id: string;
  type: ComponentType;
  props: Record<string, unknown>;
  dataSource?: string;
  order: number;
}

export type ComponentType =
  | "hero"
  | "product_grid"
  | "product_card"
  | "cart"
  | "checkout"
  | "text_block"
  | "image_banner"
  | "form"
  | "table"
  | "notepad"
  | "calculator"
  | "calendar"
  | "gallery"
  | "contact_form"
  | "footer"
  | "divider";

export interface DataModelConfig {
  id: string;
  name: string;
  slug: string;
  fields: FieldConfig[];
  allowCreate: boolean;
  allowEdit: boolean;
  allowDelete: boolean;
}

export interface FieldConfig {
  id: string;
  name: string;
  slug: string;
  type: FieldType;
  required: boolean;
  defaultValue?: unknown;
  options?: string[]; // for select/radio
  formula?: string; // for calculated fields
  validation?: FieldValidation;
}

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "currency"
  | "date"
  | "time"
  | "datetime"
  | "boolean"
  | "select"
  | "multiselect"
  | "radio"
  | "image"
  | "file"
  | "email"
  | "phone"
  | "url"
  | "formula"
  | "relation";

export interface FieldValidation {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

export interface IntegrationsConfig {
  razorpay?: {
    enabled: boolean;
    keyId: string;
    keySecret: string;
  };
  whatsapp?: {
    enabled: boolean;
    phone: string;
  };
  googleAnalytics?: {
    enabled: boolean;
    measurementId: string;
  };
  customHtml?: {
    head: string;
    body: string;
  };
}

// ─────────────────────────────────────────────
// Domain
// ─────────────────────────────────────────────

export interface DomainRecord {
  _id: ObjectId;
  appId: ObjectId;
  userId: ObjectId;
  domain: string;
  verified: boolean;
  sslStatus: "none" | "pending" | "active" | "failed";
  nginxConfigPath?: string;
  verificationToken: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─────────────────────────────────────────────
// Tenant App Data (per-app MongoDB collections)
// ─────────────────────────────────────────────

export interface AppRecord {
  _id: ObjectId;
  appId: string;
  modelSlug: string;
  data: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// ─────────────────────────────────────────────
// Template Definitions
// ─────────────────────────────────────────────

export interface TemplateDef {
  id: AppTemplate;
  name: string;
  description: string;
  icon: string;
  color: string;
  features: string[];
  defaultConfig: AppConfig;
}

// ─────────────────────────────────────────────
// API Response helpers
// ─────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export type SafeUser = Omit<PlatformUser, "password">;
