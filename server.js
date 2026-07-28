import "dotenv/config";
import express from "express";
import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { resolve } from "node:path";
import { spawn } from "node:child_process";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is required. Copy .env.example to .env and add your MySQL connection string.",
  );
}

const globalForPrisma = globalThis;
const prisma = globalForPrisma.__saiPrisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.__saiPrisma = prisma;

const seedImages = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAjlcc2WoG7JOifgYljmi2P2tWLAuKhl_DFVLOPEsE8nqLWt-j1zuegLfJSkAt2cdkq9T15jx4nrGIFfqFfhXZ0PLRPpxdpVUYv74oMcJRz-UJxQRBqkdUBfYNOtNq_pv8_kzfsbobHbxRPjDeQYswUYLCxh9s_5whTStUhc0XoywODJnyc7inTKEX9vD01GrQqIBkPIY-Yt1_8wRMlqr1HqEROsxhKVVhTXDTUiFAM765b0DgOIAj9",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCKz-WUNdgthNLEfI8MvmawnCTif8C6TKjLR9_V7FfAXnP4eWwOmeNn5gxBMdXSOMqF4UE-HaCDxO4KPma8VHr3l4Mj5ojCx11q_BDGaLrFggmPeqP3lFk0Zzlc_9X7HnSrn3oCTaBYs4ddL9AxWySPP30FczJ-JpG9sbZp1L7J1ksUpPXOX0IwnFAiw9x-qRoDWwEMxm4rgM5SNOXEqZUQ1kpqs_bGkwkQVp4ktAFyuJDv8cEqIG2O",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBV-AovZOcqn-Ey1B0bixMafGfTe7NJwU6_87oHtgIoVcqO2gHC9QPVBD4UWo9yxvIyquY0BKM_oQ9HDJrAAUTf56KrXa3E-mTktui6aO1VDy_5N1rQDmkhTqp3MZWfh0j2ylaj-IAfq_XfMluhATYAXhEDZhH0XUg8Z9e8_SAbCnhBeURULP1gJ_XIKMpOAulmWykr9PhfJyzVVgEISEDdkBnq2SbgyN3hR4nV7DLFtN2lb3kpSFxZ",
];

const defaultContent = {
  hero_eyebrow: "ELECTRIC MOBILITY, REFINED",
  hero_before: "Ride the",
  hero_highlight: "Future",
  hero_after: "of Urban Mobility.",
  hero_description:
    "Your trusted destination in India for electric scooter sales, genuine spare parts, diagnostics and expert repairs.",
  hero_image: seedImages[1],
  hero_status_label: "LIVE TRACKING",
  hero_status: "READY FOR PICKUP",
  hero_shop_label: "Shop scooters",
  hero_repair_label: "Book a repair",
  scooter_eyebrow: "ELECTRIC SCOOTERS IN INDIA",
  scooter_title: "Find Your Everyday Ride",
  scooter_description:
    "Reliable electric scooters selected for Indian roads and daily commutes.",
  scooter_inventory_label: "scooter units available",
  parts_eyebrow: "GENUINE SPARE PARTS",
  parts_title: "Parts That Keep You Moving",
  parts_description:
    "Batteries, tyres, brakes and essential components for electric scooters.",
  parts_inventory_label: "parts available",
  service_eyebrow: "WORKSHOP MASTERY",
  service_title: "Precision Maintenance for the Long Haul.",
  service_description:
    "Our India-based electric scooter workshop supports multiple brands with diagnostics, battery service, tyres, brakes and genuine replacement parts.",
  service_feature_one_title: "48hr Repair Turnaround",
  service_feature_one_text: "We prioritize getting you back on the road fast.",
  service_feature_two_title: "Battery Re-Cell Service",
  service_feature_two_text: "Extend the life of your scooter sustainably.",
  service_image: seedImages[1],
  tools_image: seedImages[0],
  community_eyebrow: "THE SAI COMMUNITY",
  community_title: "Trusted by Electric Scooter Riders",
  quote_one: "My commute is faster, quieter, and honestly a lot more fun.",
  quote_one_author: "MAYA R.",
  quote_two: "The service team had me rolling again in under two days.",
  quote_two_author: "DANIEL K.",
  quote_three: "Premium build quality you can feel from the first ride.",
  quote_three_author: "CHRIS T.",
  community_badge_one: "GENUINE PARTS",
  community_badge_two: "MULTI-BRAND SERVICE",
  community_badge_three: "INDIA-READY",
  community_badge_four: "EV EXPERTS",
  about_eyebrow: "ABOUT SAI EV",
  about_title: "Your Independent Electric Mobility Partner.",
  about_description:
    "We help riders across India choose, maintain and repair electric scooters from multiple brands—with honest advice, trained technicians and dependable spare parts.",
  about_years: "8+",
  about_years_label: "Years of EV expertise",
  about_brands: "15+",
  about_brands_label: "Brands supported",
  about_image: seedImages[2],
  about_badge: "Multi-brand EV specialists",
  about_cta: "Talk to our team",
  contact_eyebrow: "CONTACT US",
  contact_title: "Let’s Keep You Moving.",
  contact_description:
    "Ask about a scooter, check spare-part availability or tell our workshop what needs attention. Our team will get back to you promptly.",
  contact_call_label: "Call us",
  contact_email_label: "Email us",
  contact_hours_label: "Business hours",
  contact_visit_label: "Visit us",
  contact_form_title: "Send an enquiry",
  contact_form_note: "Required fields are marked with an asterisk.",
  contact_message_placeholder: "How can we help?",
  contact_submit_label: "Send enquiry",
  business_hours: "Mon–Sat, 9:00 AM–7:00 PM",
  whatsapp_number: "+91 98765 43210",
  footer_tagline:
    "Multi-brand electric vehicle care, engineered for real life.",
  footer_products_title: "PRODUCTS",
  footer_support_title: "SUPPORT",
  footer_visit_title: "VISIT",
  footer_scooters_label: "Electric Scooters",
  footer_parts_label: "Spare Parts",
  footer_service_label: "Service & Repair",
  footer_about_label: "About Us",
  footer_contact_label: "Contact Us",
  footer_whatsapp_label: "WhatsApp",
  footer_admin_label: "Admin portal",
  footer_copyright:
    "© 2026 SAI Multi Brand Electric Vehicle Service Center. All rights reserved.",
  contact_email: "hello@saiev.in",
  contact_phone: "+91 98765 43210",
  address: "India",
};

const hashPassword = (password, salt = randomBytes(16).toString("hex")) =>
  `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
const verifyPassword = (password, stored) => {
  const [salt, hash] = stored.split(":");
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return actual.length === expected.length && timingSafeEqual(expected, actual);
};
const cookies = (req) =>
  Object.fromEntries(
    (req.headers.cookie || "")
      .split(";")
      .filter(Boolean)
      .map((v) => v.trim().split(/=(.*)/s).slice(0, 2)),
  );
const cleanProduct = (p) => ({
  ...p,
  specs: [
    [p.spec1_label, p.spec1_value],
    [p.spec2_label, p.spec2_value],
  ],
});
const getContent = async () => {
  const setting = await prisma.siteSetting.findUnique({
    where: { key: "content" },
  });
  return { ...defaultContent, ...(setting?.value || {}) };
};
const requireAdmin = async (req, res, next) => {
  try {
    const session = await prisma.session.findFirst({
      where: {
        token: cookies(req).vm_session || "",
        expires_at: { gt: new Date() },
      },
      include: { admin: { select: { id: true, email: true } } },
    });
    if (!session)
      return res.status(401).json({ error: "Admin login required" });
    req.admin = session.admin;
    next();
  } catch (error) {
    next(error);
  }
};

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ ok: true, database: "mysql" });
});
app.get("/api/categories", async (_req, res) =>
  res.json(
    await prisma.category.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    }),
  ),
);
app.get("/api/site-content", async (_req, res) => res.json(await getContent()));
app.get("/api/products", async (_req, res) =>
  res.json(
    (
      await prisma.product.findMany({
        where: { active: true },
        orderBy: [{ featured: "desc" }, { id: "asc" }],
      })
    ).map(cleanProduct),
  ),
);

app.post("/api/orders", async (req, res) => {
  const { customer_name, email, phone, address, items } = req.body;
  if (
    ![customer_name, email, phone, address].every(
      (v) => typeof v === "string" && v.trim(),
    ) ||
    !Array.isArray(items) ||
    !items.length
  )
    return res.status(400).json({ error: "Complete all checkout fields" });
  const normalized = items.map((i) => ({
    product_id: Number(i.product_id),
    quantity: Math.max(1, Number(i.quantity || 1)),
  }));
  const products = await prisma.product.findMany({
    where: { id: { in: normalized.map((i) => i.product_id) }, active: true },
  });
  const byId = new Map(products.map((p) => [p.id, p]));
  if (
    normalized.some(
      (i) =>
        !byId.get(i.product_id) || byId.get(i.product_id).stock < i.quantity,
    )
  )
    return res.status(400).json({ error: "An item is unavailable" });
  const total = normalized.reduce(
    (sum, i) => sum + byId.get(i.product_id).price * i.quantity,
    0,
  );
  const order = await prisma
    .$transaction(async (tx) => {
      for (const item of normalized) {
        const changed = await tx.product.updateMany({
          where: {
            id: item.product_id,
            active: true,
            stock: { gte: item.quantity },
          },
          data: { stock: { decrement: item.quantity } },
        });
        if (changed.count !== 1) throw new Error("OUT_OF_STOCK");
      }
      return tx.order.create({
        data: {
          customer_name: customer_name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          address: address.trim(),
          total,
          items: {
            create: normalized.map((i) => ({
              product_id: i.product_id,
              product_name: byId.get(i.product_id).name,
              quantity: i.quantity,
              price: byId.get(i.product_id).price,
            })),
          },
        },
      });
    })
    .catch((error) => {
      if (error.message === "OUT_OF_STOCK") return null;
      throw error;
    });
  if (!order)
    return res.status(409).json({ error: "An item just went out of stock" });
  res.status(201).json({ id: order.id, total: order.total });
});
app.post("/api/enquiries", async (req, res) => {
  const { customer_name, email, phone = "", subject, message } = req.body;
  if (
    ![customer_name, email, subject, message].every(
      (v) => typeof v === "string" && v.trim(),
    )
  )
    return res
      .status(400)
      .json({ error: "Complete all required contact fields" });
  const row = await prisma.enquiry.create({
    data: {
      customer_name: customer_name.trim(),
      email: email.trim(),
      phone: String(phone).trim(),
      subject: subject.trim(),
      message: message.trim(),
    },
  });
  res.status(201).json({ id: row.id });
});
app.post("/api/repairs", async (req, res) => {
  const { customer_name, email, phone, service, notes = "" } = req.body;
  if (
    ![customer_name, email, phone, service].every(
      (v) => typeof v === "string" && v.trim(),
    )
  )
    return res.status(400).json({ error: "Complete all required fields" });
  const normalized = {
    customer_name: customer_name.trim(),
    email: email.trim(),
    phone: phone.trim(),
    service: service.trim(),
    notes: String(notes).trim(),
  };
  const recentRequest = await prisma.repair.findFirst({
    where: {
      customer_name: normalized.customer_name,
      email: normalized.email,
      phone: normalized.phone,
      service: normalized.service,
      created_at: { gte: new Date(Date.now() - 60_000) },
    },
    orderBy: { id: "desc" },
  });
  if (recentRequest)
    return res.json({ id: recentRequest.id, duplicate: true });

  const row = await prisma.repair.create({
    data: {
      ...normalized,
    },
  });
  res.status(201).json({ id: row.id });
});

app.post("/api/admin/login", async (req, res) => {
  const admin = await prisma.admin.findUnique({
    where: { email: String(req.body.email || "").toLowerCase() },
  });
  if (
    !admin ||
    !verifyPassword(String(req.body.password || ""), admin.password_hash)
  )
    return res.status(401).json({ error: "Invalid credentials" });
  const token = randomBytes(32).toString("hex");
  await prisma.session.create({
    data: {
      token,
      admin_id: admin.id,
      expires_at: new Date(Date.now() + 86400000),
    },
  });
  res.setHeader(
    "Set-Cookie",
    `vm_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=86400${process.env.NODE_ENV === "production" ? "; Secure" : ""}`,
  );
  res.json({ email: admin.email });
});
app.post("/api/admin/logout", requireAdmin, async (req, res) => {
  await prisma.session.deleteMany({
    where: { token: cookies(req).vm_session },
  });
  res.setHeader(
    "Set-Cookie",
    "vm_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0",
  );
  res.json({ ok: true });
});
app.get("/api/admin/session", requireAdmin, (req, res) => res.json(req.admin));
app.get("/api/admin/dashboard", requireAdmin, async (_req, res) => {
  const [
    productCount,
    orderCount,
    repairCount,
    enquiryCount,
    revenue,
    products,
    orders,
    repairs,
    enquiries,
    categories,
    content,
  ] = await Promise.all([
    prisma.product.count({ where: { active: true } }),
    prisma.order.count(),
    prisma.repair.count(),
    prisma.enquiry.count({ where: { status: { not: "closed" } } }),
    prisma.order.aggregate({
      where: { status: { not: "cancelled" } },
      _sum: { total: true },
    }),
    prisma.product.findMany({
      where: { active: true },
      orderBy: { id: "desc" },
    }),
    prisma.order.findMany({ orderBy: { id: "desc" } }),
    prisma.repair.findMany({ orderBy: { id: "desc" } }),
    prisma.enquiry.findMany({ orderBy: { id: "desc" } }),
    prisma.category.findMany({
      orderBy: [{ active: "desc" }, { name: "asc" }],
    }),
    getContent(),
  ]);
  res.json({
    stats: {
      products: productCount,
      orders: orderCount,
      repairs: repairCount,
      enquiries: enquiryCount,
      revenue: revenue._sum.total || 0,
    },
    products: products.map(cleanProduct),
    orders,
    repairs,
    enquiries,
    categories,
    content,
  });
});
app.post("/api/admin/categories", requireAdmin, async (req, res) => {
  const name = String(req.body.name || "").trim();
  const slug = String(
    req.body.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  ).replace(/^-|-$/g, "");
  if (!name || !slug)
    return res.status(400).json({ error: "Name is required" });
  try {
    const row = await prisma.category.create({
      data: { slug, name, description: String(req.body.description || "") },
    });
    res.status(201).json(row);
  } catch (error) {
    if (error.code === "P2002")
      return res.status(400).json({ error: "Category already exists" });
    throw error;
  }
});
app.put("/api/admin/categories/:id", requireAdmin, async (req, res) => {
  await prisma.category.update({
    where: { id: Number(req.params.id) },
    data: {
      name: String(req.body.name || ""),
      description: String(req.body.description || ""),
      active: req.body.active !== false,
    },
  });
  res.json({ ok: true });
});
app.delete("/api/admin/categories/:id", requireAdmin, async (req, res) => {
  const category = await prisma.category.findUnique({
    where: { id: Number(req.params.id) },
  });
  if (!category) return res.status(404).json({ error: "Category not found" });
  if (
    await prisma.product.count({
      where: { category: category.slug, active: true },
    })
  )
    return res
      .status(400)
      .json({ error: "Move or delete products in this category first" });
  await prisma.category.delete({ where: { id: category.id } });
  res.json({ ok: true });
});
app.put("/api/admin/content", requireAdmin, async (req, res) => {
  const content = { ...defaultContent, ...req.body };
  await prisma.siteSetting.upsert({
    where: { key: "content" },
    create: { key: "content", value: content },
    update: { value: content },
  });
  res.json(content);
});
app.post("/api/admin/products", requireAdmin, async (req, res) => {
  const p = req.body;
  const row = await prisma.product.create({
    data: {
      name: p.name,
      tag: p.tag,
      price: Number(p.price),
      image: p.image,
      spec1_label: p.spec1_label,
      spec1_value: p.spec1_value,
      spec2_label: p.spec2_label,
      spec2_value: p.spec2_value,
      featured: Boolean(p.featured),
      active: p.active !== false,
      stock: Number(p.stock),
      category: p.category || "scooter",
    },
  });
  res.status(201).json({ id: row.id });
});
app.put("/api/admin/products/:id", requireAdmin, async (req, res) => {
  const p = req.body;
  await prisma.product.update({
    where: { id: Number(req.params.id) },
    data: {
      name: p.name,
      tag: p.tag,
      price: Number(p.price),
      image: p.image,
      spec1_label: p.spec1_label,
      spec1_value: p.spec1_value,
      spec2_label: p.spec2_label,
      spec2_value: p.spec2_value,
      featured: Boolean(p.featured),
      active: Boolean(p.active),
      stock: Number(p.stock),
      category: p.category || "scooter",
    },
  });
  res.json({ ok: true });
});
app.delete("/api/admin/products/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return res.status(404).json({ error: "Product not found" });

  const linkedOrders = await prisma.orderItem.count({
    where: { product_id: id },
  });

  if (linkedOrders > 0) {
    await prisma.product.update({
      where: { id },
      data: { active: false },
    });
    return res.json({ ok: true, archived: true });
  }

  await prisma.product.delete({ where: { id } });
  res.json({ ok: true, archived: false });
});
app.patch("/api/admin/orders/:id", requireAdmin, async (req, res) => {
  await prisma.order.update({
    where: { id: Number(req.params.id) },
    data: { status: String(req.body.status) },
  });
  res.json({ ok: true });
});
app.patch("/api/admin/repairs/:id", requireAdmin, async (req, res) => {
  await prisma.repair.update({
    where: { id: Number(req.params.id) },
    data: { status: String(req.body.status) },
  });
  res.json({ ok: true });
});
app.patch("/api/admin/enquiries/:id", requireAdmin, async (req, res) => {
  await prisma.enquiry.update({
    where: { id: Number(req.params.id) },
    data: { status: String(req.body.status) },
  });
  res.json({ ok: true });
});
app.delete("/api/admin/enquiries/:id", requireAdmin, async (req, res) => {
  await prisma.enquiry.delete({ where: { id: Number(req.params.id) } });
  res.json({ ok: true });
});

const root = resolve(".");
const dev = process.argv.includes("--dev");
if (dev) {
  const vite = spawn(
    process.platform === "win32" ? "npm.cmd" : "npm",
    ["run", "client"],
    { stdio: "inherit", shell: false },
  );
  process.on("exit", () => vite.kill());
} else {
  app.use(express.static(resolve(root, "dist")));
  app.get("/{*splat}", (_req, res) =>
    res.sendFile(resolve(root, "dist", "index.html")),
  );
}
app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: "Server error. Please try again." });
});
if (!process.env.VERCEL)
  app.listen(Number(process.env.PORT || 3000), () =>
    console.log(
      dev
        ? "API: http://localhost:3000 | Site: http://localhost:5173"
        : "SAI EV Service Center: http://localhost:3000",
    ),
  );
export { prisma, defaultContent, hashPassword };
export default app;
