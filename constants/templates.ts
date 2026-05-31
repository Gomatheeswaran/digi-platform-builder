import type { AppConfig, TemplateDef } from "@/types";

const defaultTheme: AppConfig["theme"] = {
  primaryColor: "#1677ff",
  secondaryColor: "#52c41a",
  backgroundColor: "#ffffff",
  textColor: "#1a1a1a",
  fontFamily: "Inter, sans-serif",
  borderRadius: "medium",
  logoUrl: "",
  faviconUrl: "",
  headerStyle: "sticky",
  darkMode: false,
};

const defaultSEO: AppConfig["seo"] = {
  title: "My App",
  description: "Built with App Platform",
  keywords: "",
  ogImage: "",
};

const defaultNav: AppConfig["navigation"] = {
  items: [],
  showAuthButtons: true,
  cartEnabled: false,
};

export const TEMPLATES: TemplateDef[] = [
  // ─── E-Commerce ────────────────────────────────────────────────
  {
    id: "ecommerce",
    name: "E-Commerce Store",
    description:
      "Full online store with products, categories, cart, Razorpay checkout, invoices, and admin panel. Like ironsparrowcrackers.com.",
    icon: "🛍️",
    color: "#f50057",
    features: [
      "Product catalog with categories & brands",
      "Shopping cart & Razorpay checkout",
      "Role-based pricing (retail / wholesale)",
      "Invoice & PDF generation",
      "Order management",
      "Customer registration & login",
    ],
    defaultConfig: {
      theme: { ...defaultTheme, primaryColor: "#d4380d" },
      seo: { ...defaultSEO, title: "My Store", description: "Shop online" },
      navigation: {
        items: [
          { id: "home", label: "Home", href: "/" },
          { id: "products", label: "Products", href: "/products" },
          { id: "cart", label: "Cart", href: "/cart" },
        ],
        showAuthButtons: true,
        cartEnabled: true,
      },
      pages: [
        {
          id: "home",
          name: "Home",
          slug: "",
          isHome: true,
          components: [
            { id: "hero1", type: "hero", props: { heading: "Welcome to My Store", subtext: "Discover our amazing products", ctaText: "Shop Now", ctaHref: "/products" }, order: 0 },
            { id: "grid1", type: "product_grid", props: { title: "Featured Products", limit: 8 }, dataSource: "products", order: 1 },
          ],
        },
        {
          id: "products",
          name: "Products",
          slug: "products",
          isHome: false,
          components: [
            { id: "pgrid1", type: "product_grid", props: { title: "All Products", showFilters: true }, dataSource: "products", order: 0 },
          ],
        },
        {
          id: "cart",
          name: "Cart",
          slug: "cart",
          isHome: false,
          components: [
            { id: "cart1", type: "cart", props: {}, order: 0 },
          ],
        },
      ],
      dataModels: [
        {
          id: "products",
          name: "Products",
          slug: "products",
          fields: [
            { id: "name", name: "Name", slug: "name", type: "text", required: true },
            { id: "price", name: "Price", slug: "price", type: "currency", required: true },
            { id: "originalPrice", name: "Original Price", slug: "originalPrice", type: "currency", required: false },
            { id: "category", name: "Category", slug: "category", type: "relation", required: false },
            { id: "brand", name: "Brand", slug: "brand", type: "text", required: false },
            { id: "description", name: "Description", slug: "description", type: "textarea", required: false },
            { id: "images", name: "Images", slug: "images", type: "image", required: false },
            { id: "isActive", name: "Active", slug: "isActive", type: "boolean", required: false, defaultValue: true },
          ],
          allowCreate: true, allowEdit: true, allowDelete: true,
        },
        {
          id: "categories",
          name: "Categories",
          slug: "categories",
          fields: [
            { id: "name", name: "Name", slug: "name", type: "text", required: true },
            { id: "order", name: "Order", slug: "order", type: "number", required: false, defaultValue: 0 },
          ],
          allowCreate: true, allowEdit: true, allowDelete: true,
        },
        {
          id: "orders",
          name: "Orders",
          slug: "orders",
          fields: [
            { id: "items", name: "Items", slug: "items", type: "text", required: true },
            { id: "amount", name: "Amount", slug: "amount", type: "currency", required: true },
            { id: "status", name: "Status", slug: "status", type: "select", required: true, options: ["pending", "paid", "shipped", "delivered", "cancelled"] },
            { id: "customerName", name: "Customer Name", slug: "customerName", type: "text", required: false },
            { id: "customerEmail", name: "Customer Email", slug: "customerEmail", type: "email", required: false },
          ],
          allowCreate: false, allowEdit: true, allowDelete: false,
        },
      ],
      integrations: {
        razorpay: { enabled: true, keyId: "", keySecret: "" },
      },
      settings: {
        currency: "INR",
        currencySymbol: "₹",
        roles: [
          { name: "RETAIL", discountPercent: 0 },
          { name: "WHOLESALE", discountPercent: 10 },
        ],
        invoicePrefix: "INV#",
      },
    },
  },

  // ─── Notepad / Journal ─────────────────────────────────────────
  {
    id: "notepad",
    name: "Smart Notepad",
    description:
      "Date-aware notepad with categories, tags, and search. Save notes by day, month, or year.",
    icon: "📓",
    color: "#1677ff",
    features: [
      "Date-based note organisation",
      "Categories & tags",
      "Rich text editor",
      "Search & filter",
      "Export to PDF",
    ],
    defaultConfig: {
      theme: { ...defaultTheme, primaryColor: "#1677ff" },
      seo: { ...defaultSEO, title: "My Notepad" },
      navigation: {
        items: [
          { id: "home", label: "Notes", href: "/" },
          { id: "calendar", label: "Calendar", href: "/calendar" },
        ],
        showAuthButtons: true,
        cartEnabled: false,
      },
      pages: [
        {
          id: "home",
          name: "Notes",
          slug: "",
          isHome: true,
          components: [
            { id: "notepad1", type: "notepad", props: { title: "My Notes", showCalendar: true, showCategories: true }, dataSource: "notes", order: 0 },
          ],
        },
        {
          id: "calendar",
          name: "Calendar",
          slug: "calendar",
          isHome: false,
          components: [
            { id: "cal1", type: "calendar", props: { dataSource: "notes" }, order: 0 },
          ],
        },
      ],
      dataModels: [
        {
          id: "notes",
          name: "Notes",
          slug: "notes",
          fields: [
            { id: "title", name: "Title", slug: "title", type: "text", required: true },
            { id: "content", name: "Content", slug: "content", type: "textarea", required: false },
            { id: "category", name: "Category", slug: "category", type: "select", required: false, options: ["Personal", "Work", "Ideas", "Tasks"] },
            { id: "tags", name: "Tags", slug: "tags", type: "multiselect", required: false, options: [] },
            { id: "date", name: "Date", slug: "date", type: "date", required: true },
            { id: "pinned", name: "Pinned", slug: "pinned", type: "boolean", required: false, defaultValue: false },
          ],
          allowCreate: true, allowEdit: true, allowDelete: true,
        },
      ],
      integrations: {},
      settings: {
        defaultView: "list",
        showDateGrouping: true,
      },
    },
  },

  // ─── Calculator ────────────────────────────────────────────────
  {
    id: "calculator",
    name: "Custom Calculator",
    description:
      "Build calculators with custom input fields and formula-driven outputs. Great for estimates, quotations, and conversions.",
    icon: "🧮",
    color: "#722ed1",
    features: [
      "Custom input fields",
      "Formula-based calculations",
      "Save & export results",
      "Date-based history",
      "Multi-step calculations",
    ],
    defaultConfig: {
      theme: { ...defaultTheme, primaryColor: "#722ed1" },
      seo: { ...defaultSEO, title: "My Calculator" },
      navigation: {
        items: [
          { id: "home", label: "Calculator", href: "/" },
          { id: "history", label: "History", href: "/history" },
        ],
        showAuthButtons: true,
        cartEnabled: false,
      },
      pages: [
        {
          id: "home",
          name: "Calculator",
          slug: "",
          isHome: true,
          components: [
            {
              id: "calc1",
              type: "calculator",
              props: {
                title: "My Calculator",
                description: "Enter values and get instant results",
              },
              dataSource: "calculations",
              order: 0,
            },
          ],
        },
        {
          id: "history",
          name: "History",
          slug: "history",
          isHome: false,
          components: [
            { id: "table1", type: "table", props: { title: "Calculation History" }, dataSource: "calculations", order: 0 },
          ],
        },
      ],
      dataModels: [
        {
          id: "calculations",
          name: "Calculations",
          slug: "calculations",
          fields: [
            { id: "label", name: "Label", slug: "label", type: "text", required: false },
            { id: "input1", name: "Value A", slug: "input1", type: "number", required: true },
            { id: "input2", name: "Value B", slug: "input2", type: "number", required: true },
            { id: "result", name: "Result", slug: "result", type: "formula", required: false, formula: "input1 * input2" },
            { id: "date", name: "Date", slug: "date", type: "date", required: true },
          ],
          allowCreate: true, allowEdit: true, allowDelete: true,
        },
      ],
      integrations: {},
      settings: {
        saveHistory: true,
        decimalPlaces: 2,
      },
    },
  },

  // ─── Directory / Catalog ───────────────────────────────────────
  {
    id: "directory",
    name: "Business Directory",
    description:
      "A searchable directory or catalog of listings, businesses, products, or services.",
    icon: "📋",
    color: "#13c2c2",
    features: [
      "Searchable listings",
      "Category filtering",
      "Contact details",
      "Location / map support",
      "Listing submissions",
    ],
    defaultConfig: {
      theme: { ...defaultTheme, primaryColor: "#13c2c2" },
      seo: { ...defaultSEO, title: "My Directory" },
      navigation: {
        items: [
          { id: "home", label: "Directory", href: "/" },
          { id: "submit", label: "Submit Listing", href: "/submit" },
        ],
        showAuthButtons: true,
        cartEnabled: false,
      },
      pages: [
        {
          id: "home",
          name: "Directory",
          slug: "",
          isHome: true,
          components: [
            { id: "hero1", type: "hero", props: { heading: "Find What You Need", subtext: "Browse our directory" }, order: 0 },
            { id: "dir1", type: "product_grid", props: { title: "All Listings", showFilters: true, cardType: "directory" }, dataSource: "listings", order: 1 },
          ],
        },
      ],
      dataModels: [
        {
          id: "listings",
          name: "Listings",
          slug: "listings",
          fields: [
            { id: "name", name: "Name", slug: "name", type: "text", required: true },
            { id: "category", name: "Category", slug: "category", type: "select", required: true, options: ["Business", "Service", "Product", "Other"] },
            { id: "description", name: "Description", slug: "description", type: "textarea", required: false },
            { id: "phone", name: "Phone", slug: "phone", type: "phone", required: false },
            { id: "email", name: "Email", slug: "email", type: "email", required: false },
            { id: "website", name: "Website", slug: "website", type: "url", required: false },
            { id: "address", name: "Address", slug: "address", type: "textarea", required: false },
            { id: "image", name: "Image", slug: "image", type: "image", required: false },
          ],
          allowCreate: true, allowEdit: true, allowDelete: true,
        },
      ],
      integrations: {},
      settings: {},
    },
  },

  // ─── Form Collector ────────────────────────────────────────────
  {
    id: "form_collector",
    name: "Form & Data Collector",
    description:
      "Collect responses via custom forms. View, search, and export submissions. Great for surveys, registrations, feedback.",
    icon: "📝",
    color: "#fa8c16",
    features: [
      "Drag-and-drop form builder",
      "Custom field types",
      "Email notifications on submit",
      "Response dashboard",
      "CSV / Excel export",
    ],
    defaultConfig: {
      theme: { ...defaultTheme, primaryColor: "#fa8c16" },
      seo: { ...defaultSEO, title: "My Form" },
      navigation: {
        items: [{ id: "home", label: "Submit", href: "/" }],
        showAuthButtons: false,
        cartEnabled: false,
      },
      pages: [
        {
          id: "home",
          name: "Form",
          slug: "",
          isHome: true,
          components: [
            { id: "form1", type: "form", props: { title: "Submit Your Response", submitLabel: "Submit", successMessage: "Thank you! Your response has been recorded." }, dataSource: "responses", order: 0 },
          ],
        },
      ],
      dataModels: [
        {
          id: "responses",
          name: "Responses",
          slug: "responses",
          fields: [
            { id: "name", name: "Full Name", slug: "name", type: "text", required: true },
            { id: "email", name: "Email", slug: "email", type: "email", required: true },
            { id: "phone", name: "Phone", slug: "phone", type: "phone", required: false },
            { id: "message", name: "Message", slug: "message", type: "textarea", required: false },
            { id: "submittedAt", name: "Submitted At", slug: "submittedAt", type: "datetime", required: true },
          ],
          allowCreate: true, allowEdit: false, allowDelete: false,
        },
      ],
      integrations: {},
      settings: {
        emailNotification: true,
        notifyEmail: "",
      },
    },
  },

  // ─── Blank ─────────────────────────────────────────────────────
  {
    id: "blank",
    name: "Blank App",
    description:
      "Start from scratch. Add any pages, components, and data models you need.",
    icon: "⬜",
    color: "#8c8c8c",
    features: [
      "Full page builder",
      "All component types available",
      "Custom data models",
      "Any integration",
    ],
    defaultConfig: {
      theme: defaultTheme,
      seo: defaultSEO,
      navigation: { items: [], showAuthButtons: true, cartEnabled: false },
      pages: [
        {
          id: "home",
          name: "Home",
          slug: "",
          isHome: true,
          components: [],
        },
      ],
      dataModels: [],
      integrations: {},
      settings: {},
    },
  },
];

export const TEMPLATE_MAP = Object.fromEntries(TEMPLATES.map((t) => [t.id, t]));
