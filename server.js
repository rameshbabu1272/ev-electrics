import express from "express";
import initSqlJs from "sql.js";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawn } from "node:child_process";

const root = resolve(".");
const dataDir = resolve(root, "data");
mkdirSync(dataDir, { recursive: true });
const dbPath = resolve(dataDir, "volt-motion.db");
const SQL = await initSqlJs();
const rawDb = existsSync(dbPath) ? new SQL.Database(readFileSync(dbPath)) : new SQL.Database();
let inTransaction = false;
const persist = () => { if (!inTransaction) writeFileSync(dbPath, Buffer.from(rawDb.export())); };
const db = {
  exec(sql) {
    const command = sql.trim().toUpperCase();
    rawDb.run(sql);
    if (command === "BEGIN") inTransaction = true;
    if (command === "COMMIT" || command === "ROLLBACK") { inTransaction = false; persist(); }
    else persist();
  },
  prepare(sql) {
    return {
      get(...args) {
        const stmt = rawDb.prepare(sql);
        try { stmt.bind(args); return stmt.step() ? stmt.getAsObject() : undefined; }
        finally { stmt.free(); }
      },
      all(...args) {
        const stmt = rawDb.prepare(sql); const rows = [];
        try { stmt.bind(args); while (stmt.step()) rows.push(stmt.getAsObject()); return rows; }
        finally { stmt.free(); }
      },
      run(...args) {
        rawDb.run(sql,args);
        const idResult = rawDb.exec("SELECT last_insert_rowid() AS id");
        persist();
        return { changes: rawDb.getRowsModified(), lastInsertRowid: idResult[0]?.values[0]?.[0] || 0 };
      }
    };
  }
};
db.exec("PRAGMA foreign_keys = ON;");
if (!db.prepare("PRAGMA table_info(products)").all().some(column => column.name === "category")) {
  db.exec("ALTER TABLE products ADD COLUMN category TEXT NOT NULL DEFAULT 'scooter'");
}
db.exec(`
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, tag TEXT NOT NULL,
  price INTEGER NOT NULL CHECK(price >= 0), image TEXT NOT NULL,
  spec1_label TEXT NOT NULL, spec1_value TEXT NOT NULL,
  spec2_label TEXT NOT NULL, spec2_value TEXT NOT NULL,
  featured INTEGER NOT NULL DEFAULT 0, active INTEGER NOT NULL DEFAULT 1,
  stock INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT, customer_name TEXT NOT NULL, email TEXT NOT NULL,
  phone TEXT NOT NULL, address TEXT NOT NULL, total INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'new', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER NOT NULL, product_id INTEGER NOT NULL,
  product_name TEXT NOT NULL, quantity INTEGER NOT NULL, price INTEGER NOT NULL,
  FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS repairs (
  id INTEGER PRIMARY KEY AUTOINCREMENT, customer_name TEXT NOT NULL, email TEXT NOT NULL,
  phone TEXT NOT NULL, service TEXT NOT NULL, notes TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'requested', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '', active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS enquiries (
  id INTEGER PRIMARY KEY AUTOINCREMENT, customer_name TEXT NOT NULL, email TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '', subject TEXT NOT NULL, message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY, admin_id INTEGER NOT NULL, expires_at INTEGER NOT NULL,
  FOREIGN KEY(admin_id) REFERENCES admins(id) ON DELETE CASCADE
);`);

const seedImages = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAjlcc2WoG7JOifgYljmi2P2tWLAuKhl_DFVLOPEsE8nqLWt-j1zuegLfJSkAt2cdkq9T15jx4nrGIFfqFfhXZ0PLRPpxdpVUYv74oMcJRz-UJxQRBqkdUBfYNOtNq_pv8_kzfsbobHbxRPjDeQYswUYLCxh9s_5whTStUhc0XoywODJnyc7inTKEX9vD01GrQqIBkPIY-Yt1_8wRMlqr1HqEROsxhKVVhTXDTUiFAM765b0DgOIAj9",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCKz-WUNdgthNLEfI8MvmawnCTif8C6TKjLR9_V7FfAXnP4eWwOmeNn5gxBMdXSOMqF4UE-HaCDxO4KPma8VHr3l4Mj5ojCx11q_BDGaLrFggmPeqP3lFk0Zzlc_9X7HnSrn3oCTaBYs4ddL9AxWySPP30FczJ-JpG9sbZp1L7J1ksUpPXOX0IwnFAiw9x-qRoDWwEMxm4rgM5SNOXEqZUQ1kpqs_bGkwkQVp4ktAFyuJDv8cEqIG2O",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBV-AovZOcqn-Ey1B0bixMafGfTe7NJwU6_87oHtgIoVcqO2gHC9QPVBD4UWo9yxvIyquY0BKM_oQ9HDJrAAUTf56KrXa3E-mTktui6aO1VDy_5N1rQDmkhTqp3MZWfh0j2ylaj-IAfq_XfMluhATYAXhEDZhH0XUg8Z9e8_SAbCnhBeURULP1gJ_XIKMpOAulmWykr9PhfJyzVVgEISEDdkBnq2SbgyN3hR4nV7DLFtN2lb3kpSFxZ"
];
if (db.prepare("SELECT COUNT(*) count FROM products").get().count === 0) {
  const add = db.prepare("INSERT INTO products(name,tag,price,image,spec1_label,spec1_value,spec2_label,spec2_value,featured,stock) VALUES(?,?,?,?,?,?,?,?,?,?)");
  add.run("SAI ELECTICS X1","CITY COMMUTER",74999,seedImages[0],"RANGE","45km","SPEED","30km/h",0,18);
  add.run("Pro Elite v2","PERFORMANCE",109999,seedImages[1],"RANGE","80km","SPEED","45km/h",1,9);
  add.run("SAI ELECTICS Lite","ULTRA-PORTABLE",45999,seedImages[2],"RANGE","25km","WEIGHT","12kg",0,25);
}
db.prepare("UPDATE products SET price=74999 WHERE name='Volt Motion X1' AND price<5000").run();
db.prepare("UPDATE products SET price=109999 WHERE name='Pro Elite v2' AND price<5000").run();
db.prepare("UPDATE products SET price=45999 WHERE name='Volt Lite' AND price<5000").run();
db.prepare("UPDATE products SET name='SAI ELECTICS X1' WHERE name='Volt Motion X1'").run();
db.prepare("UPDATE products SET name='SAI ELECTICS Lite' WHERE name='Volt Lite'").run();
if (db.prepare("SELECT COUNT(*) count FROM products WHERE category='spare'").get().count === 0) {
  const addSpare = db.prepare("INSERT INTO products(name,tag,price,image,spec1_label,spec1_value,spec2_label,spec2_value,featured,stock,category) VALUES(?,?,?,?,?,?,?,?,?,?,?)");
  addSpare.run("48V Smart Battery","LONG-RANGE POWER",18999,seedImages[0],"VOLTAGE","48V","WARRANTY","12 months",0,14,"spare");
  addSpare.run("All-Terrain Tyre Set","HIGH-GRIP",3499,seedImages[2],"SIZE","10 inch","INCLUDES","2 tyres",0,32,"spare");
  addSpare.run("Performance Brake Kit","SAFETY UPGRADE",2499,seedImages[1],"TYPE","Disc brake","INCLUDES","Full kit",0,24,"spare");
}
if (db.prepare("SELECT COUNT(*) count FROM categories").get().count === 0) {
  const addCategory=db.prepare("INSERT INTO categories(slug,name,description) VALUES(?,?,?)");
  addCategory.run("scooter","Electric Scooters","Electric scooters for daily mobility");
  addCategory.run("spare","Spare Parts","Batteries, tyres, brakes and replacement parts");
}
const defaultContent = {
  hero_eyebrow:"ELECTRIC MOBILITY, REFINED", hero_before:"Ride the", hero_highlight:"Future", hero_after:"of Urban Mobility.",
  hero_description:"Your trusted destination in India for electric scooter sales, genuine spare parts, diagnostics and expert repairs.",
  hero_image:seedImages[1], hero_status_label:"LIVE TRACKING", hero_status:"READY FOR PICKUP", hero_shop_label:"Shop scooters", hero_repair_label:"Book a repair",
  scooter_eyebrow:"ELECTRIC SCOOTERS IN INDIA", scooter_title:"Find Your Everyday Ride", scooter_description:"Reliable electric scooters selected for Indian roads and daily commutes.", scooter_inventory_label:"scooter units available",
  parts_eyebrow:"GENUINE SPARE PARTS", parts_title:"Parts That Keep You Moving", parts_description:"Batteries, tyres, brakes and essential components for electric scooters.", parts_inventory_label:"parts available",
  service_eyebrow:"WORKSHOP MASTERY", service_title:"Precision Maintenance for the Long Haul.", service_description:"Our India-based electric scooter workshop supports multiple brands with diagnostics, battery service, tyres, brakes and genuine replacement parts.",
  service_feature_one_title:"48hr Repair Turnaround", service_feature_one_text:"We prioritize getting you back on the road fast.",
  service_feature_two_title:"Battery Re-Cell Service", service_feature_two_text:"Extend the life of your scooter sustainably.",
  service_image:seedImages[1], tools_image:seedImages[0],
  community_eyebrow:"THE SAI COMMUNITY", community_title:"Trusted by Electric Scooter Riders",
  quote_one:"My commute is faster, quieter, and honestly a lot more fun.", quote_one_author:"MAYA R.",
  quote_two:"The service team had me rolling again in under two days.", quote_two_author:"DANIEL K.",
  quote_three:"Premium build quality you can feel from the first ride.", quote_three_author:"CHRIS T.", community_badge_one:"GENUINE PARTS", community_badge_two:"MULTI-BRAND SERVICE", community_badge_three:"INDIA-READY", community_badge_four:"EV EXPERTS",
  about_eyebrow:"ABOUT SAI EV", about_title:"Your Independent Electric Mobility Partner.", about_description:"We help riders across India choose, maintain and repair electric scooters from multiple brands—with honest advice, trained technicians and dependable spare parts.", about_years:"8+", about_years_label:"Years of EV expertise", about_brands:"15+", about_brands_label:"Brands supported", about_image:seedImages[2], about_badge:"Multi-brand EV specialists", about_cta:"Talk to our team",
  contact_eyebrow:"CONTACT US", contact_title:"Let’s Keep You Moving.", contact_description:"Ask about a scooter, check spare-part availability or tell our workshop what needs attention. Our team will get back to you promptly.", contact_call_label:"Call us", contact_email_label:"Email us", contact_hours_label:"Business hours", contact_visit_label:"Visit us", contact_form_title:"Send an enquiry", contact_form_note:"Required fields are marked with an asterisk.", contact_message_placeholder:"How can we help?", contact_submit_label:"Send enquiry", business_hours:"Mon–Sat, 9:00 AM–7:00 PM", whatsapp_number:"+91 98765 43210",
  footer_tagline:"Multi-brand electric vehicle care, engineered for real life.", footer_products_title:"PRODUCTS", footer_support_title:"SUPPORT", footer_visit_title:"VISIT", footer_scooters_label:"Electric Scooters", footer_parts_label:"Spare Parts", footer_service_label:"Service & Repair", footer_about_label:"About Us", footer_contact_label:"Contact Us", footer_whatsapp_label:"WhatsApp", footer_admin_label:"Admin portal", footer_copyright:"© 2026 SAI Multi Brand Electric Vehicle Service Center. All rights reserved.",
  contact_email:"hello@saiev.in", contact_phone:"+91 98765 43210", address:"India"
};
if (!db.prepare("SELECT value FROM site_settings WHERE key='content'").get()) db.prepare("INSERT INTO site_settings(key,value) VALUES('content',?)").run(JSON.stringify(defaultContent));
const getContent = () => { try { return {...defaultContent,...JSON.parse(db.prepare("SELECT value FROM site_settings WHERE key='content'").get()?.value || "{}")}; } catch { return defaultContent; } };
const hashPassword = (password, salt = randomBytes(16).toString("hex")) =>
  `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
const verifyPassword = (password, stored) => {
  const [salt, hash] = stored.split(":");
  return timingSafeEqual(Buffer.from(hash, "hex"), scryptSync(password, salt, 64));
};
if (db.prepare("SELECT COUNT(*) count FROM admins").get().count === 0) {
  db.prepare("INSERT INTO admins(email,password_hash) VALUES(?,?)").run(
    process.env.ADMIN_EMAIL || "admin@voltmotion.com",
    hashPassword(process.env.ADMIN_PASSWORD || "VoltMotion#2026")
  );
}

const app = express();
app.use(express.json({ limit: "1mb" }));
const cookies = req => Object.fromEntries((req.headers.cookie || "").split(";").filter(Boolean).map(v => v.trim().split(/=(.*)/s).slice(0,2)));
const requireAdmin = (req,res,next) => {
  const row = db.prepare("SELECT admins.id, admins.email FROM sessions JOIN admins ON admins.id=sessions.admin_id WHERE token=? AND expires_at>?").get(cookies(req).vm_session || "", Date.now());
  if (!row) return res.status(401).json({ error: "Admin login required" });
  req.admin = row; next();
};
const cleanProduct = p => ({...p, featured:Boolean(p.featured), active:Boolean(p.active), specs:[[p.spec1_label,p.spec1_value],[p.spec2_label,p.spec2_value]]});

app.get("/api/categories", (_req,res) => res.json(db.prepare("SELECT * FROM categories WHERE active=1 ORDER BY name").all()));
app.get("/api/site-content", (_req,res) => res.json(getContent()));
app.get("/api/products", (_req,res) => res.json(db.prepare("SELECT * FROM products WHERE active=1 ORDER BY featured DESC,id").all().map(cleanProduct)));
app.post("/api/orders", (req,res) => {
  const {customer_name,email,phone,address,items} = req.body;
  if (![customer_name,email,phone,address].every(v => typeof v === "string" && v.trim()) || !Array.isArray(items) || !items.length) return res.status(400).json({error:"Complete all checkout fields"});
  const ids = items.map(i => Number(i.product_id));
  const products = ids.map(id => db.prepare("SELECT * FROM products WHERE id=? AND active=1").get(id));
  if (products.some((p,i) => !p || p.stock < Number(items[i].quantity || 1))) return res.status(400).json({error:"An item is unavailable"});
  const total = products.reduce((sum,p,i) => sum + p.price * Number(items[i].quantity || 1),0);
  db.exec("BEGIN");
  try {
    const order = db.prepare("INSERT INTO orders(customer_name,email,phone,address,total) VALUES(?,?,?,?,?)").run(customer_name.trim(),email.trim(),phone.trim(),address.trim(),total);
    products.forEach((p,i) => {
      const quantity = Number(items[i].quantity || 1);
      db.prepare("INSERT INTO order_items(order_id,product_id,product_name,quantity,price) VALUES(?,?,?,?,?)").run(order.lastInsertRowid,p.id,p.name,quantity,p.price);
      db.prepare("UPDATE products SET stock=stock-? WHERE id=?").run(quantity,p.id);
    });
    db.exec("COMMIT"); res.status(201).json({id:Number(order.lastInsertRowid),total});
  } catch(e) { db.exec("ROLLBACK"); res.status(500).json({error:"Could not place order"}); }
});
app.post("/api/enquiries", (req,res) => {
  const {customer_name,email,phone="",subject,message} = req.body;
  if (![customer_name,email,subject,message].every(v => typeof v === "string" && v.trim())) return res.status(400).json({error:"Complete all required contact fields"});
  const result = db.prepare("INSERT INTO enquiries(customer_name,email,phone,subject,message) VALUES(?,?,?,?,?)").run(customer_name.trim(),email.trim(),String(phone).trim(),subject.trim(),message.trim());
  res.status(201).json({id:Number(result.lastInsertRowid)});
});
app.post("/api/repairs", (req,res) => {
  const {customer_name,email,phone,service,notes=""} = req.body;
  if (![customer_name,email,phone,service].every(v => typeof v === "string" && v.trim())) return res.status(400).json({error:"Complete all required fields"});
  const result = db.prepare("INSERT INTO repairs(customer_name,email,phone,service,notes) VALUES(?,?,?,?,?)").run(customer_name.trim(),email.trim(),phone.trim(),service.trim(),String(notes).trim());
  res.status(201).json({id:Number(result.lastInsertRowid)});
});
app.post("/api/admin/login", (req,res) => {
  const admin = db.prepare("SELECT * FROM admins WHERE email=?").get(String(req.body.email || "").toLowerCase());
  if (!admin || !verifyPassword(String(req.body.password || ""),admin.password_hash)) return res.status(401).json({error:"Invalid credentials"});
  const token = randomBytes(32).toString("hex");
  db.prepare("INSERT INTO sessions(token,admin_id,expires_at) VALUES(?,?,?)").run(token,admin.id,Date.now()+86400000);
  res.setHeader("Set-Cookie",`vm_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=86400`);
  res.json({email:admin.email});
});
app.post("/api/admin/logout", requireAdmin, (req,res) => { db.prepare("DELETE FROM sessions WHERE token=?").run(cookies(req).vm_session); res.setHeader("Set-Cookie","vm_session=; HttpOnly; Path=/; Max-Age=0"); res.json({ok:true}); });
app.get("/api/admin/session", requireAdmin, (req,res) => res.json(req.admin));
app.get("/api/admin/dashboard", requireAdmin, (_req,res) => res.json({
  stats:{products:db.prepare("SELECT COUNT(*) n FROM products").get().n,orders:db.prepare("SELECT COUNT(*) n FROM orders").get().n,repairs:db.prepare("SELECT COUNT(*) n FROM repairs").get().n,enquiries:db.prepare("SELECT COUNT(*) n FROM enquiries WHERE status!='closed'").get().n,revenue:db.prepare("SELECT COALESCE(SUM(total),0) n FROM orders WHERE status!='cancelled'").get().n},
  products:db.prepare("SELECT * FROM products ORDER BY id DESC").all().map(cleanProduct),
  orders:db.prepare("SELECT * FROM orders ORDER BY id DESC").all(),
  repairs:db.prepare("SELECT * FROM repairs ORDER BY id DESC").all(),
  enquiries:db.prepare("SELECT * FROM enquiries ORDER BY id DESC").all(),
  content:getContent(),
  categories:db.prepare("SELECT * FROM categories ORDER BY active DESC,name").all()
}));
app.post("/api/admin/categories", requireAdmin, (req,res) => { const name=String(req.body.name||"").trim(); const slug=String(req.body.slug||name.toLowerCase().replace(/[^a-z0-9]+/g,"-")).replace(/^-|-$/g,""); if(!name||!slug)return res.status(400).json({error:"Name is required"}); try{const result=db.prepare("INSERT INTO categories(slug,name,description) VALUES(?,?,?)").run(slug,name,String(req.body.description||""));res.status(201).json({id:Number(result.lastInsertRowid),slug,name});}catch{return res.status(400).json({error:"Category already exists"});} });
app.put("/api/admin/categories/:id", requireAdmin, (req,res) => { db.prepare("UPDATE categories SET name=?,description=?,active=? WHERE id=?").run(String(req.body.name||""),String(req.body.description||""),req.body.active===false?0:1,req.params.id);res.json({ok:true}); });
app.delete("/api/admin/categories/:id", requireAdmin, (req,res) => { const category=db.prepare("SELECT * FROM categories WHERE id=?").get(req.params.id); if(!category)return res.status(404).json({error:"Category not found"}); const used=db.prepare("SELECT COUNT(*) count FROM products WHERE category=? AND active=1").get(category.slug).count; if(used)return res.status(400).json({error:"Move or delete products in this category first"}); db.prepare("UPDATE categories SET active=0 WHERE id=?").run(req.params.id);res.json({ok:true}); });
app.put("/api/admin/content", requireAdmin, (req,res) => { const content={...defaultContent,...req.body}; db.prepare("INSERT INTO site_settings(key,value,updated_at) VALUES('content',?,CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=CURRENT_TIMESTAMP").run(JSON.stringify(content)); res.json(content); });
app.post("/api/admin/products", requireAdmin, (req,res) => {
  const p=req.body; const result=db.prepare("INSERT INTO products(name,tag,price,image,spec1_label,spec1_value,spec2_label,spec2_value,featured,active,stock,category) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)").run(p.name,p.tag,Number(p.price),p.image,p.spec1_label,p.spec1_value,p.spec2_label,p.spec2_value,p.featured?1:0,p.active===false?0:1,Number(p.stock),p.category||"scooter");
  res.status(201).json({id:Number(result.lastInsertRowid)});
});
app.put("/api/admin/products/:id", requireAdmin, (req,res) => {
  const p=req.body; db.prepare("UPDATE products SET name=?,tag=?,price=?,image=?,spec1_label=?,spec1_value=?,spec2_label=?,spec2_value=?,featured=?,active=?,stock=?,category=? WHERE id=?").run(p.name,p.tag,Number(p.price),p.image,p.spec1_label,p.spec1_value,p.spec2_label,p.spec2_value,p.featured?1:0,p.active?1:0,Number(p.stock),p.category||"scooter",req.params.id); res.json({ok:true});
});
app.delete("/api/admin/products/:id", requireAdmin, (req,res) => { db.prepare("UPDATE products SET active=0 WHERE id=?").run(req.params.id); res.json({ok:true}); });
app.patch("/api/admin/orders/:id", requireAdmin, (req,res) => { db.prepare("UPDATE orders SET status=? WHERE id=?").run(req.body.status,req.params.id); res.json({ok:true}); });
app.patch("/api/admin/repairs/:id", requireAdmin, (req,res) => { db.prepare("UPDATE repairs SET status=? WHERE id=?").run(req.body.status,req.params.id); res.json({ok:true}); });
app.patch("/api/admin/enquiries/:id", requireAdmin, (req,res) => { db.prepare("UPDATE enquiries SET status=? WHERE id=?").run(req.body.status,req.params.id); res.json({ok:true}); });
app.delete("/api/admin/enquiries/:id", requireAdmin, (req,res) => { db.prepare("DELETE FROM enquiries WHERE id=?").run(req.params.id); res.json({ok:true}); });

const dev = process.argv.includes("--dev");
if (dev) {
  const vite = spawn(process.platform === "win32" ? "npm.cmd" : "npm",["run","client"],{stdio:"inherit",shell:false});
  process.on("exit",()=>vite.kill());
} else {
  app.use(express.static(resolve(root,"dist")));
  app.get("/{*splat}",(_req,res)=>res.sendFile(resolve(root,"dist","index.html")));
}
app.listen(3000,()=>console.log(dev ? "API: http://localhost:3000 | Site: http://localhost:5173" : "SAI EV Service Center: http://localhost:3000"));
