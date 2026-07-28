import React, { useEffect, useState } from "react";
import {
  ArrowRight,
  LayoutDashboard,
  Save,
  MessageSquare,
  Tags,
  Package,
  ShoppingBag,
  ClipboardList,
  LogOut,
  PlusCircle,
  Trash2,
  X,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { api, money } from "../../lib/api.js";
import { Brand, Field } from "../../components/shared.jsx";

const blank = {
  name: "",
  tag: "",
  category: "scooter",
  price: 0,
  image: "",
  spec1_label: "RANGE",
  spec1_value: "",
  spec2_label: "SPEED",
  spec2_value: "",
  stock: 0,
  featured: false,
  active: true,
};
export default function Admin() {
  const [user, setUser] = useState(null),
    [data, setData] = useState(null),
    [tab, setTab] = useState("overview"),
    [edit, setEdit] = useState(null),
    [error, setError] = useState(""),
    [deletingProduct, setDeletingProduct] = useState(null),
    [toast, setToast] = useState(null),
    [confirmation, setConfirmation] = useState(null);
  const notify = (message, type = "success") =>
    setToast({ id: Date.now(), message, type });
  useEffect(() => {
    document.body.style.overflow = edit || confirmation ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [edit, confirmation]);
  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 3600);
    return () => window.clearTimeout(timer);
  }, [toast]);
  const load = () =>
    api("/api/admin/dashboard")
      .then(setData)
      .catch(() => setUser(null));
  useEffect(() => {
    api("/api/admin/session")
      .then(setUser)
      .then(load)
      .catch(() => {});
  }, []);
  if (!user)
    return (
      <AdminLogin
        onLogin={(u) => {
          setUser(u);
          load();
        }}
        error={error}
        setError={setError}
      />
    );
  if (!data) return <div className="admin-loading">Loading dashboard…</div>;
  const status = async (type, id, value) => {
    try {
      await api(`/api/admin/${type}/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: value }),
      });
      await load();
      notify("Status updated.");
    } catch (requestError) {
      notify(requestError.message, "error");
    }
  };
  const addCategory = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const payload = Object.fromEntries(new FormData(form));
    try {
      await api("/api/admin/categories", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      form.reset();
      await load();
      notify("Category created successfully.");
    } catch (requestError) {
      notify(requestError.message, "error");
    }
  };
  const deleteCategory = async (item) => {
    setConfirmation({
      title: "Delete category?",
      message: `This will remove “${item.name}” from the active category list.`,
      confirmLabel: "Delete category",
      onConfirm: async () => {
        try {
          await api(`/api/admin/categories/${item.id}`, { method: "DELETE" });
          await load();
          notify(`${item.name} was deleted.`);
        } catch (requestError) {
          notify(requestError.message, "error");
        }
      },
    });
  };
  const deleteProduct = async (p) => {
    setConfirmation({
      title: "Delete product?",
      message: `Remove “${p.name}” from your inventory and storefront?`,
      confirmLabel: "Delete product",
      onConfirm: async () => {
        setDeletingProduct(p.id);
        try {
          const result = await api(`/api/admin/products/${p.id}`, {
            method: "DELETE",
          });
          await load();
          notify(
            result.archived
              ? `${p.name} was removed. Its order history was preserved.`
              : `${p.name} was deleted successfully.`,
          );
        } catch (requestError) {
          notify(requestError.message, "error");
        } finally {
          setDeletingProduct(null);
        }
      },
    });
  };
  const saveContent = async (e) => {
    e.preventDefault();
    const payload = Object.fromEntries(new FormData(e.currentTarget));
    try {
      await api("/api/admin/content", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      await load();
      notify("Website content saved successfully.");
    } catch (requestError) {
      notify(requestError.message, "error");
    }
  };
  const saveProduct = async (e) => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.currentTarget));
    f.featured = Boolean(f.featured);
    f.active = Boolean(f.active);
    const action = edit.id ? "updated" : "created";
    try {
      await api(
        edit.id ? `/api/admin/products/${edit.id}` : "/api/admin/products",
        { method: edit.id ? "PUT" : "POST", body: JSON.stringify(f) },
      );
      setEdit(null);
      await load();
      notify(`Product ${action} successfully.`);
    } catch (requestError) {
      notify(requestError.message, "error");
    }
  };
  return (
    <div className="admin-shell">
      <aside className="admin-nav">
        <Brand to="/" inverse />
        <small>CONTROL CENTER</small>
        {[
          ["overview", LayoutDashboard],
          ["content", Save],
          ["enquiries", MessageSquare],
          ["categories", Tags],
          ["products", Package],
          ["orders", ShoppingBag],
          ["repairs", ClipboardList],
        ].map(([t, I]) => (
          <button
            className={tab === t ? "active" : ""}
            onClick={() => setTab(t)}
            key={t}
          >
            <I />
            {t}
          </button>
        ))}
        <button
          className="logout"
          onClick={async () => {
            await api("/api/admin/logout", { method: "POST" });
            setUser(null);
          }}
        >
          <LogOut />
          Sign out
        </button>
      </aside>
      <main className="admin-main">
        <div className="admin-top">
          <div>
            <p className="eyebrow">ADMIN DASHBOARD</p>
            <h1>{tab[0].toUpperCase() + tab.slice(1)}</h1>
          </div>
          <span>{user.email}</span>
        </div>
        {tab === "overview" && (
          <>
            <div className="stat-grid">
              <Stat label="Products" value={data.stats.products} />
              <Stat label="Orders" value={data.stats.orders} />
              <Stat label="Repair jobs" value={data.stats.repairs} />
              <Stat label="Open enquiries" value={data.stats.enquiries} />
              <Stat label="Revenue" value={money(data.stats.revenue)} />
            </div>
            <div className="admin-panel">
              <h2>Recent orders</h2>
              <OrderTable rows={data.orders.slice(0, 5)} status={status} />
            </div>
          </>
        )}
        {tab === "content" && (
          <div className="admin-panel content-editor">
            <div className="panel-head">
              <div>
                <h2>Website content</h2>
                <p>
                  Edit the public site, hero banner, service details and contact
                  information.
                </p>
              </div>
            </div>
            <form onSubmit={saveContent}>
              <h3>Hero banner</h3>
              <div className="form-grid">
                {[
                  "hero_eyebrow",
                  "hero_before",
                  "hero_highlight",
                  "hero_after",
                  "hero_description",
                  "hero_image",
                  "hero_status_label",
                  "hero_status",
                  "hero_shop_label",
                  "hero_repair_label",
                ].map((n) => (
                  <ContentField key={n} name={n} value={data.content[n]} />
                ))}
              </div>
              <h3>Catalog headings</h3>
              <div className="form-grid">
                {[
                  "scooter_eyebrow",
                  "scooter_title",
                  "scooter_description",
                  "scooter_inventory_label",
                  "parts_eyebrow",
                  "parts_title",
                  "parts_description",
                  "parts_inventory_label",
                ].map((n) => (
                  <ContentField key={n} name={n} value={data.content[n]} />
                ))}
              </div>
              <h3>Service section</h3>
              <div className="form-grid">
                {[
                  "service_eyebrow",
                  "service_title",
                  "service_description",
                  "service_feature_one_title",
                  "service_feature_one_text",
                  "service_feature_two_title",
                  "service_feature_two_text",
                  "service_image",
                  "tools_image",
                ].map((n) => (
                  <ContentField key={n} name={n} value={data.content[n]} />
                ))}
              </div>
              <h3>Testimonials</h3>
              <div className="form-grid">
                {[
                  "community_eyebrow",
                  "community_title",
                  "quote_one",
                  "quote_one_author",
                  "quote_two",
                  "quote_two_author",
                  "quote_three",
                  "quote_three_author",
                  "community_badge_one",
                  "community_badge_two",
                  "community_badge_three",
                  "community_badge_four",
                ].map((n) => (
                  <ContentField key={n} name={n} value={data.content[n]} />
                ))}
              </div>
              <h3>About section</h3>
              <div className="form-grid">
                {[
                  "about_eyebrow",
                  "about_title",
                  "about_description",
                  "about_years",
                  "about_years_label",
                  "about_brands",
                  "about_brands_label",
                  "about_image",
                  "about_badge",
                  "about_cta",
                ].map((n) => (
                  <ContentField key={n} name={n} value={data.content[n]} />
                ))}
              </div>
              <h3>Contact section</h3>
              <div className="form-grid">
                {[
                  "contact_eyebrow",
                  "contact_title",
                  "contact_description",
                  "contact_call_label",
                  "contact_email_label",
                  "contact_hours_label",
                  "contact_visit_label",
                  "contact_form_title",
                  "contact_form_note",
                  "contact_message_placeholder",
                  "contact_submit_label",
                  "contact_email",
                  "contact_phone",
                  "whatsapp_number",
                  "business_hours",
                  "address",
                ].map((n) => (
                  <ContentField key={n} name={n} value={data.content[n]} />
                ))}
              </div>
              <h3>Footer</h3>
              <div className="form-grid">
                {[
                  "footer_tagline",
                  "footer_products_title",
                  "footer_support_title",
                  "footer_visit_title",
                  "footer_scooters_label",
                  "footer_parts_label",
                  "footer_service_label",
                  "footer_about_label",
                  "footer_contact_label",
                  "footer_whatsapp_label",
                  "footer_admin_label",
                  "footer_copyright",
                ].map((n) => (
                  <ContentField key={n} name={n} value={data.content[n]} />
                ))}
              </div>
              <button className="green save-content">
                <Save />
                Save website changes
              </button>
            </form>
          </div>
        )}
        {tab === "categories" && (
          <div className="admin-panel category-admin">
            <div className="panel-head">
              <div>
                <h2>Product categories</h2>
                <p>
                  Create categories used by both the storefront filters and
                  product editor.
                </p>
              </div>
            </div>
            <form className="category-create" onSubmit={addCategory}>
              <Field name="name" label="Category name" />
              <Field name="slug" label="Slug" />
              <Field name="description" label="Description" />
              <button className="green">
                <PlusCircle />
                Add category
              </button>
            </form>
            <div className="category-list">
              {data.categories.map((item) => (
                <div className="category-row" key={item.id}>
                  <div>
                    <b>{item.name}</b>
                    <small>
                      {item.slug} · {item.description}
                    </small>
                  </div>
                  <span className={item.active ? "live" : "inactive"}>
                    {item.active ? "Live" : "Inactive"}
                  </span>
                  <button
                    type="button"
                    className="delete-product"
                    onClick={() => deleteCategory(item)}
                  >
                    <Trash2 />
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        {tab === "products" && (
          <div className="admin-panel">
            <div className="panel-head">
              <h2>Product inventory</h2>
              <button className="green" onClick={() => setEdit(blank)}>
                <PlusCircle />
                Add product
              </button>
            </div>
            <div className="admin-products">
              {data.products.map((p) => (
                <div className="admin-product" key={p.id}>
                  <img src={p.image} alt={p.name} loading="lazy" />
                  <div>
                    <b>{p.name}</b>
                    <small>
                      {p.tag} · {p.stock} in stock
                    </small>
                  </div>
                  <strong>{money(p.price)}</strong>
                  <div className="product-actions">
                    <button onClick={() => setEdit(p)}>Edit</button>
                    <button
                      type="button"
                      className="delete-product"
                      onClick={() => deleteProduct(p)}
                      disabled={deletingProduct === p.id}
                    >
                      <Trash2 />
                      {deletingProduct === p.id ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {tab === "enquiries" && (
          <div className="admin-panel">
            <div className="panel-head">
              <div>
                <h2>Contact enquiries</h2>
                <p>Messages submitted through the public Contact Us form.</p>
              </div>
            </div>
            {data.enquiries.length === 0 ? (
              <div className="admin-empty">
                <MessageSquare />
                <b>No enquiries yet</b>
                <span>New customer messages will appear here.</span>
              </div>
            ) : (
              <div className="enquiry-list">
                {data.enquiries.map((q) => (
                  <article className="enquiry-item" key={q.id}>
                    <div className="enquiry-head">
                      <div>
                        <b>{q.subject}</b>
                        <small>
                          #{q.id} ·{" "}
                          {new Date(q.created_at + "Z").toLocaleString()}
                        </small>
                      </div>
                      <Status
                        value={q.status}
                        options={["new", "contacted", "resolved", "closed"]}
                        onChange={(v) => status("enquiries", q.id, v)}
                      />
                    </div>
                    <p>{q.message}</p>
                    <div className="enquiry-contact">
                      <b>{q.customer_name}</b>
                      <a href={`mailto:${q.email}`}>{q.email}</a>
                      {q.phone && <a href={`tel:${q.phone}`}>{q.phone}</a>}
                    </div>
                    <button
                      className="delete-product"
                      onClick={() =>
                        setConfirmation({
                          title: "Delete enquiry?",
                          message: `Delete the enquiry from ${q.customer_name}? This cannot be undone.`,
                          confirmLabel: "Delete enquiry",
                          onConfirm: async () => {
                            try {
                              await api(`/api/admin/enquiries/${q.id}`, {
                                method: "DELETE",
                              });
                              await load();
                              notify("Enquiry deleted successfully.");
                            } catch (requestError) {
                              notify(requestError.message, "error");
                            }
                          },
                        })
                      }
                    >
                      <Trash2 />
                      Delete
                    </button>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
        {tab === "orders" && (
          <div className="admin-panel">
            <h2>All orders</h2>
            <OrderTable rows={data.orders} status={status} />
          </div>
        )}
        {tab === "repairs" && (
          <div className="admin-panel">
            <h2>Repair bookings</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Customer</th>
                    <th>Service</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.repairs.map((r) => (
                    <tr key={r.id}>
                      <td>R-{r.id}</td>
                      <td>
                        <b>{r.customer_name}</b>
                        <small>{r.email}</small>
                      </td>
                      <td>{r.service}</td>
                      <td>
                        {new Date(r.created_at + "Z").toLocaleDateString()}
                      </td>
                      <td>
                        <Status
                          value={r.status}
                          options={[
                            "requested",
                            "scheduled",
                            "in progress",
                            "completed",
                            "cancelled",
                          ]}
                          onChange={(v) => status("repairs", r.id, v)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
      {edit && (
        <div className="modal-wrap">
          <div className="shade" onClick={() => setEdit(null)} />
          <form
            className="modal product-form"
            role="dialog"
            aria-modal="true"
            aria-label={edit.id ? "Edit product" : "New product"}
            onSubmit={saveProduct}
          >
            <button
              type="button"
              className="close"
              aria-label="Close"
              onClick={() => setEdit(null)}
            >
              <X />
            </button>
            <p className="eyebrow">INVENTORY</p>
            <h2>{edit.id ? "Edit product" : "New product"}</h2>
            <div className="form-grid">
              {[
                "name",
                "tag",
                "category",
                "price",
                "image",
                "spec1_label",
                "spec1_value",
                "spec2_label",
                "spec2_value",
                "stock",
              ].map((n) =>
                n === "category" ? (
                  <label key={n}>
                    Category
                    <select name="category" defaultValue={edit.category}>
                      {data.categories
                        .filter((x) => x.active)
                        .map((x) => (
                          <option key={x.id} value={x.slug}>
                            {x.name}
                          </option>
                        ))}
                    </select>
                  </label>
                ) : (
                  <Field
                    key={n}
                    name={n}
                    label={n.replaceAll("_", " ")}
                    defaultValue={edit[n]}
                    type={["price", "stock"].includes(n) ? "number" : "text"}
                  />
                ),
              )}
            </div>
            <label className="check">
              <input
                name="featured"
                type="checkbox"
                defaultChecked={edit.featured}
              />{" "}
              Featured product
            </label>
            <label className="check">
              <input
                name="active"
                type="checkbox"
                defaultChecked={edit.active}
              />{" "}
              Visible in store
            </label>
            <button className="green submit">
              <Save />
              Save product
            </button>
          </form>
        </div>
      )}
      {confirmation && (
        <ConfirmDialog
          {...confirmation}
          onCancel={() => setConfirmation(null)}
          onAccept={async () => {
            const action = confirmation.onConfirm;
            setConfirmation(null);
            await action();
          }}
        />
      )}
      {toast && <AdminToast toast={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
function ConfirmDialog({
  title,
  message,
  confirmLabel,
  onCancel,
  onAccept,
}) {
  const [working, setWorking] = useState(false);
  return (
    <div className="confirm-wrap" role="presentation">
      <button
        type="button"
        className="confirm-shade"
        aria-label="Cancel"
        onClick={onCancel}
      />
      <section
        className="confirm-card"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
      >
        <div className="confirm-icon">
          <AlertTriangle />
        </div>
        <p className="eyebrow">PLEASE CONFIRM</p>
        <h2 id="confirm-title">{title}</h2>
        <p id="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button type="button" className="confirm-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="confirm-delete"
            disabled={working}
            onClick={async () => {
              setWorking(true);
              await onAccept();
            }}
          >
            <Trash2 />
            {working ? "Working…" : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
function AdminToast({ toast, onClose }) {
  const Icon = toast.type === "error" ? AlertTriangle : CheckCircle2;
  return (
    <div className={`admin-toast ${toast.type}`} role="status" aria-live="polite">
      <Icon />
      <span>{toast.message}</span>
      <button type="button" aria-label="Dismiss notification" onClick={onClose}>
        <X />
      </button>
    </div>
  );
}
function ContentField({ name, value }) {
  const multiline =
    name.includes("description") ||
    name.includes("quote") ||
    name.includes("tagline");
  return (
    <label>
      {name.replaceAll("_", " ")}
      {multiline ? (
        <textarea required name={name} defaultValue={value} />
      ) : (
        <input required name={name} defaultValue={value} />
      )}
    </label>
  );
}
function Stat({ label, value }) {
  return (
    <div className="stat">
      <small>{label}</small>
      <b>{value}</b>
    </div>
  );
}
function Status({ value, options, onChange }) {
  return (
    <select
      className={`status-select ${value}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((o) => (
        <option key={o}>{o}</option>
      ))}
    </select>
  );
}
function OrderTable({ rows, status }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Order</th>
            <th>Customer</th>
            <th>Total</th>
            <th>Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((o) => (
            <tr key={o.id}>
              <td>#VM-{o.id}</td>
              <td>
                <b>{o.customer_name}</b>
                <small>{o.email}</small>
              </td>
              <td>{money(o.total)}</td>
              <td>{new Date(o.created_at + "Z").toLocaleDateString()}</td>
              <td>
                <Status
                  value={o.status}
                  options={[
                    "new",
                    "paid",
                    "processing",
                    "shipped",
                    "completed",
                    "cancelled",
                  ]}
                  onChange={(v) => status("orders", o.id, v)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function AdminLogin({ onLogin, error, setError }) {
  const submit = async (e) => {
    e.preventDefault();
    try {
      onLogin(
        await api("/api/admin/login", {
          method: "POST",
          body: JSON.stringify(
            Object.fromEntries(new FormData(e.currentTarget)),
          ),
        }),
      );
    } catch (x) {
      setError(x.message);
    }
  };
  return (
    <div className="login-page">
      <form className="login-card" onSubmit={submit}>
        <Brand to="/" />
        <p className="eyebrow">CONTROL CENTER</p>
        <h1>Admin sign in</h1>
        <p>Manage products, orders, inventory and repair bookings.</p>
        {error && <div className="form-error">{error}</div>}
        <Field name="email" label="Email" type="email" />
        <Field name="password" label="Password" type="password" />
        <button className="green submit">
          Sign in <ArrowRight />
        </button>
        <a href="/">← Return to store</a>
      </form>
    </div>
  );
}
