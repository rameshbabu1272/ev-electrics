import React, { useEffect, useState } from "react";
import {
  ShoppingBag,
  Globe2,
  Menu,
  X,
  ArrowRight,
  Wrench,
  RefreshCcw,
  Check,
  MapPin,
  Phone,
  Mail,
  Package,
  Building2,
  MessageSquare,
  Clock3,
  Send,
  ExternalLink,
  Search,
  SlidersHorizontal,
  Trash2,
  Zap,
} from "lucide-react";
import { api, money } from "../../lib/api.js";
import { defaultContent } from "../../data/siteContent.js";
import { Brand, Field, FormModal, Product } from "../../components/shared.jsx";

export default function Store() {
  const [products, setProducts] = useState([]),
    [cart, setCart] = useState([]),
    [open, setOpen] = useState(false),
    [cartOpen, setCartOpen] = useState(false),
    [book, setBook] = useState(false),
    [checkout, setCheckout] = useState(false),
    [notice, setNotice] = useState(""),
    [active, setActive] = useState(() => location.hash.slice(1) || "shop"),
    [content, setContent] = useState(defaultContent),
    [categories, setCategories] = useState([]),
    [category, setCategory] = useState("all"),
    [query, setQuery] = useState(""),
    [maxPrice, setMaxPrice] = useState(150000),
    [inStock, setInStock] = useState(false),
    [sort, setSort] = useState("featured");
  const c = content;
  useEffect(() => {
    document.body.style.overflow = cartOpen || book || checkout ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [cartOpen, book, checkout]);
  useEffect(() => {
    api("/api/products")
      .then(setProducts)
      .catch((e) => setNotice(e.message));
    api("/api/site-content")
      .then(setContent)
      .catch(() => {});
    api("/api/categories")
      .then(setCategories)
      .catch(() => {});
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-30% 0px -55%", threshold: [0, 0.2, 0.5] },
    );
    ["shop", "spares", "services", "about", "contact", "community"].forEach(
      (id) => {
        const el = document.getElementById(id);
        if (el) observer.observe(el);
      },
    );
    const revealObserver = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            revealObserver.unobserve(entry.target);
          }
        }),
      { threshold: 0.12 },
    );
    document
      .querySelectorAll(
        ".section-head,.product,.service-copy,.service-imgs,.about-copy,.about-image,.contact-card,.contact-form,.quotes blockquote,.press",
      )
      .forEach((el) => {
        el.classList.add("reveal-3d");
        revealObserver.observe(el);
      });
    return () => {
      observer.disconnect();
      revealObserver.disconnect();
    };
  }, []);
  const visibleProducts = products
    .filter(
      (p) =>
        (category === "all" || p.category === category) &&
        p.price <= maxPrice &&
        (!inStock || p.stock > 0) &&
        p.name.toLowerCase().includes(query.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "low"
        ? a.price - b.price
        : sort === "high"
          ? b.price - a.price
          : sort === "name"
            ? a.name.localeCompare(b.name)
            : b.featured - a.featured,
    );
  const add = (p) => {
    setCart([...cart, p]);
    setCartOpen(true);
  };
  const submitContact = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    try {
      const r = await api("/api/enquiries", {
        method: "POST",
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      form.reset();
      setNotice(`Thanks! Your enquiry #${r.id} has been received.`);
    } catch (x) {
      setNotice(x.message);
    }
  };
  const submitRepair = async (e) => {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const r = await api("/api/repairs", {
        method: "POST",
        body: JSON.stringify(body),
      });
      setBook(false);
      setNotice(`Repair request #${r.id} received.`);
    } catch (x) {
      setNotice(x.message);
    }
  };
  const submitOrder = async (e) => {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.currentTarget));
    body.items = cart.map((p) => ({ product_id: p.id, quantity: 1 }));
    try {
      const r = await api("/api/orders", {
        method: "POST",
        body: JSON.stringify(body),
      });
      setCheckout(false);
      setCartOpen(false);
      setCart([]);
      setNotice(`Order #${r.id} confirmed. Total ${money(r.total)}.`);
      api("/api/products").then(setProducts);
    } catch (x) {
      setNotice(x.message);
    }
  };
  return (
    <>
      <header>
        <Brand />
        <nav className={open ? "open" : ""}>
          <a
            className={active === "shop" ? "active" : ""}
            onClick={() => {
              setActive("shop");
              setOpen(false);
            }}
            href="#shop"
          >
            <ShoppingBag size={19} />
            <span>Scooters</span>
          </a>
          <a
            className={active === "spares" ? "active" : ""}
            onClick={() => {
              setActive("spares");
              setOpen(false);
            }}
            href="#spares"
          >
            <Package size={19} />
            <span>Parts</span>
          </a>
          <a
            className={active === "services" ? "active" : ""}
            onClick={() => {
              setActive("services");
              setOpen(false);
            }}
            href="#services"
          >
            <Wrench size={19} />
            <span>Repairs</span>
          </a>
          <a
            className={active === "about" ? "active" : ""}
            onClick={() => {
              setActive("about");
              setOpen(false);
            }}
            href="#about"
          >
            <Building2 size={19} />
            <span>About</span>
          </a>
          <a
            className={active === "contact" ? "active" : ""}
            onClick={() => {
              setActive("contact");
              setOpen(false);
            }}
            href="#contact"
          >
            <MessageSquare size={19} />
            <span>Contact</span>
          </a>
        </nav>
        <div className="head-actions">
          <Globe2 size={19} />
          <button className="cart" onClick={() => setCartOpen(true)}>
            <ShoppingBag size={17} /> Cart{" "}
            {cart.length > 0 && <b>{cart.length}</b>}
          </button>
          <button
            className="menu"
            aria-label="Toggle navigation menu"
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      <nav className="mobile-nav">
        <a
          className={active === "shop" ? "active" : ""}
          onClick={() => {
            setActive("shop");
            setOpen(false);
          }}
          href="#shop"
        >
          <ShoppingBag />
          <span>Scooters</span>
        </a>
        <a
          className={active === "spares" ? "active" : ""}
          onClick={() => {
            setActive("spares");
            setOpen(false);
          }}
          href="#spares"
        >
          <Package />
          <span>Parts</span>
        </a>
        <a
          className={active === "services" ? "active" : ""}
          onClick={() => {
            setActive("services");
            setOpen(false);
          }}
          href="#services"
        >
          <Wrench />
          <span>Repairs</span>
        </a>
        <a
          className={active === "about" ? "active" : ""}
          onClick={() => {
            setActive("about");
            setOpen(false);
          }}
          href="#about"
        >
          <Building2 />
          <span>About</span>
        </a>
        <a
          className={active === "contact" ? "active" : ""}
          onClick={() => {
            setActive("contact");
            setOpen(false);
          }}
          href="#contact"
        >
          <MessageSquare />
          <span>Contact</span>
        </a>
      </nav>
      {notice && (
        <div className="toast" onClick={() => setNotice("")}>
          {notice}
          <X size={16} />
        </div>
      )}
      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">{c.hero_eyebrow}</p>
            <h1>
              {c.hero_before} <em>{c.hero_highlight}</em>
              <br />
              {c.hero_after}
            </h1>
            <p>{c.hero_description}</p>
            <div className="actions">
              <a className="green" href="#shop">
                {c.hero_shop_label} <ArrowRight size={18} />
              </a>
              <button className="outline" onClick={() => setBook(true)}>
                {c.hero_repair_label}
              </button>
            </div>
          </div>
          <div
            className="hero-img"
            style={{ backgroundImage: `url(${c.hero_image})` }}
          >
            <div className="status">
              <small>{c.hero_status_label}</small>
              <b>
                <i /> {c.hero_status}
              </b>
            </div>
          </div>
        </section>
        <section id="shop" className="section">
          <div className="section-head">
            <div>
              <p className="eyebrow">{c.scooter_eyebrow}</p>
              <h2>{c.scooter_title}</h2>
              <p>{c.scooter_description}</p>
            </div>
            <span className="inventory-count">
              {visibleProducts
                .filter((p) => p.category !== "spare")
                .reduce((s, p) => s + p.stock, 0)}{" "}
              {c.scooter_inventory_label}
            </span>
          </div>
          <div className="filter-panel">
            <div className="filter-search">
              <Search />
              <input
                aria-label="Search products"
                placeholder="Search scooters and parts"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="category-chips">
              <button
                className={category === "all" ? "active" : ""}
                onClick={() => setCategory("all")}
              >
                All
              </button>
              {categories.map((item) => (
                <button
                  key={item.id}
                  className={category === item.slug ? "active" : ""}
                  onClick={() => setCategory(item.slug)}
                >
                  {item.name}
                </button>
              ))}
            </div>
            <div className="filter-controls">
              <label>
                <SlidersHorizontal />
                Maximum price <b>{money(maxPrice)}</b>
                <input
                  type="range"
                  min="2000"
                  max="150000"
                  step="1000"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                />
              </label>
              <label className="stock-filter">
                <input
                  type="checkbox"
                  checked={inStock}
                  onChange={(e) => setInStock(e.target.checked)}
                />{" "}
                In stock only
              </label>
              <select
                aria-label="Sort products"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="featured">Featured</option>
                <option value="low">Price: low to high</option>
                <option value="high">Price: high to low</option>
                <option value="name">Name A-Z</option>
              </select>
              <button
                type="button"
                className="reset-filters"
                onClick={() => {
                  setCategory("all");
                  setQuery("");
                  setMaxPrice(150000);
                  setInStock(false);
                  setSort("featured");
                }}
              >
                Reset filters
              </button>
            </div>
          </div>
          <div className="products">
            {visibleProducts
              .filter((p) => p.category !== "spare")
              .map((p) => (
                <Product key={p.id} p={p} add={add} />
              ))}
          </div>
          {visibleProducts.filter((p) => p.category !== "spare").length === 0 &&
            category !== "spare" && (
              <div className="catalog-empty">
                <Search />
                <b>No scooters match these filters</b>
                <span>Try a higher price or reset the filters.</span>
              </div>
            )}
        </section>
        <section id="spares" className="section spares-section">
          <div className="section-head">
            <div>
              <p className="eyebrow">{c.parts_eyebrow}</p>
              <h2>{c.parts_title}</h2>
              <p>{c.parts_description}</p>
            </div>
            <span className="inventory-count">
              {visibleProducts
                .filter((p) => p.category === "spare")
                .reduce((s, p) => s + p.stock, 0)}{" "}
              {c.parts_inventory_label}
            </span>
          </div>
          <div className="products">
            {visibleProducts
              .filter((p) => p.category === "spare")
              .map((p) => (
                <Product key={p.id} p={p} add={add} />
              ))}
          </div>
          {visibleProducts.filter((p) => p.category === "spare").length === 0 &&
            category !== "scooter" && (
              <div className="catalog-empty">
                <Search />
                <b>No spare parts match these filters</b>
                <span>Try another search or reset the filters.</span>
              </div>
            )}
        </section>
        <section id="services" className="service">
          <div className="service-copy">
            <p className="eyebrow">{c.service_eyebrow}</p>
            <h2>{c.service_title}</h2>
            <p>{c.service_description}</p>
            <div className="benefit">
              <span>
                <Wrench />
              </span>
              <div>
                <b>{c.service_feature_one_title}</b>
                <small>{c.service_feature_one_text}</small>
              </div>
            </div>
            <div className="benefit">
              <span>
                <RefreshCcw />
              </span>
              <div>
                <b>{c.service_feature_two_title}</b>
                <small>{c.service_feature_two_text}</small>
              </div>
            </div>
            <button className="black" onClick={() => setBook(true)}>
              Schedule service
            </button>
          </div>
          <div className="service-imgs">
            <img
              src={c.service_image}
              alt="Technician repairing electric scooter"
              loading="lazy"
            />
            <img
              src={c.tools_image}
              alt="Organized workshop tools"
              loading="lazy"
            />
          </div>
        </section>
        <section id="about" className="about-section">
          <div className="about-image">
            <img
              src={c.about_image}
              alt="SAI electric vehicle service center"
              loading="lazy"
            />
            <div className="about-badge">
              <Zap />
              <span>{c.about_badge}</span>
            </div>
          </div>
          <div className="about-copy">
            <p className="eyebrow">{c.about_eyebrow}</p>
            <h2>{c.about_title}</h2>
            <p>{c.about_description}</p>
            <div className="about-stats">
              <div>
                <strong>{c.about_years}</strong>
                <span>{c.about_years_label}</span>
              </div>
              <div>
                <strong>{c.about_brands}</strong>
                <span>{c.about_brands_label}</span>
              </div>
            </div>
            <a className="black about-cta" href="#contact">
              {c.about_cta} <ArrowRight />
            </a>
          </div>
        </section>
        <section id="contact" className="contact-section">
          <div className="contact-card">
            <p className="eyebrow">{c.contact_eyebrow}</p>
            <h2>{c.contact_title}</h2>
            <p>{c.contact_description}</p>
            <div className="contact-lines">
              <a href={`tel:${c.contact_phone}`}>
                <Phone />
                <span>
                  <small>{c.contact_call_label}</small>
                  {c.contact_phone}
                </span>
              </a>
              <a href={`mailto:${c.contact_email}`}>
                <Mail />
                <span>
                  <small>{c.contact_email_label}</small>
                  {c.contact_email}
                </span>
              </a>
              <div>
                <Clock3 />
                <span>
                  <small>{c.contact_hours_label}</small>
                  {c.business_hours}
                </span>
              </div>
              <div>
                <MapPin />
                <span>
                  <small>{c.contact_visit_label}</small>
                  {c.address}
                </span>
              </div>
            </div>
          </div>
          <form className="contact-form" onSubmit={submitContact}>
            <h3>{c.contact_form_title}</h3>
            <p>{c.contact_form_note}</p>
            <div className="form-grid">
              <Field name="customer_name" label="Name *" />
              <Field name="email" label="Email *" type="email" />
              <Field name="phone" label="Phone" required={false} />
              <Field name="subject" label="Subject *" />
            </div>
            <label>
              Message *
              <textarea
                required
                name="message"
                placeholder={c.contact_message_placeholder}
              />
            </label>
            <button className="green">
              <Send />
              {c.contact_submit_label}
            </button>
          </form>
        </section>
        <section id="community" className="community">
          <p className="eyebrow">{c.community_eyebrow}</p>
          <h2>{c.community_title}</h2>
          <div className="quotes">
            <blockquote>
              “{c.quote_one}”<footer>— {c.quote_one_author}</footer>
            </blockquote>
            <blockquote>
              “{c.quote_two}”<footer>— {c.quote_two_author}</footer>
            </blockquote>
            <blockquote>
              “{c.quote_three}”<footer>— {c.quote_three_author}</footer>
            </blockquote>
          </div>
          <div className="press">
            <span>{c.community_badge_one}</span>
            <span>{c.community_badge_two}</span>
            <span>{c.community_badge_three}</span>
            <span>{c.community_badge_four}</span>
          </div>
        </section>
      </main>
      <footer className="footer">
        <div>
          <Brand inverse />
          <p>{c.footer_tagline}</p>
          <small className="copyright">{c.footer_copyright}</small>
        </div>
        <div>
          <b>{c.footer_products_title}</b>
          <a href="#shop">{c.footer_scooters_label}</a>
          <a href="#spares">{c.footer_parts_label}</a>
          <a href="#services">{c.footer_service_label}</a>
        </div>
        <div>
          <b>{c.footer_support_title}</b>
          <a href="#about">{c.footer_about_label}</a>
          <a href="#contact">{c.footer_contact_label}</a>
          <a href={`mailto:${c.contact_email}`}>
            <Mail />
            {c.contact_email}
          </a>
          <a
            href={`https://wa.me/${c.whatsapp_number.replace(/\D/g, "")}`}
            target="_blank"
            rel="noreferrer"
          >
            <ExternalLink />
            {c.footer_whatsapp_label}
          </a>
        </div>
        <div>
          <b>{c.footer_visit_title}</b>
          <a href={`tel:${c.contact_phone}`}>
            <Phone />
            {c.contact_phone}
          </a>
          <span>
            <Clock3 />
            {c.business_hours}
          </span>
          <span>
            <MapPin />
            {c.address}
          </span>
          <a href="/admin">{c.footer_admin_label}</a>
        </div>
      </footer>
      {cartOpen && (
        <div className="drawer">
          <div className="shade" onClick={() => setCartOpen(false)} />
          <aside>
            <button
              type="button"
              className="close"
              aria-label="Close"
              onClick={() => setCartOpen(false)}
            >
              <X />
            </button>
            <p className="eyebrow">YOUR CART</p>
            <h2>Ready to ride</h2>
            {cart.length === 0 ? (
              <p className="empty">
                Your cart is empty. Find your perfect city ride.
              </p>
            ) : (
              cart.map((p, i) => (
                <div className="cart-item" key={i}>
                  <img src={p.image} alt={p.name} loading="lazy" />
                  <div>
                    <b>{p.name}</b>
                    <small>{money(p.price)}</small>
                  </div>
                  <button
                    type="button"
                    className="remove"
                    aria-label="Remove item from cart"
                    onClick={() => setCart(cart.filter((_, n) => n !== i))}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
            {cart.length > 0 && (
              <>
                <div className="total">
                  <span>Total</span>
                  <b>{money(cart.reduce((s, p) => s + p.price, 0))}</b>
                </div>
                <button
                  className="green checkout"
                  onClick={() => setCheckout(true)}
                >
                  <Check /> Checkout
                </button>
              </>
            )}
          </aside>
        </div>
      )}
      {book && (
        <FormModal
          title="Book a repair"
          eyebrow="SAI ELECTICS WORKSHOP"
          onClose={() => setBook(false)}
          onSubmit={submitRepair}
        >
          <p>We’ll confirm your time within one business hour.</p>
          <Field name="customer_name" label="Name" />
          <Field name="email" label="Email" type="email" />
          <Field name="phone" label="Phone" />
          <label>
            Service
            <select name="service">
              <option>General diagnostic</option>
              <option>Battery service</option>
              <option>Tire replacement</option>
              <option>Brake service</option>
            </select>
          </label>
          <label>
            Notes
            <textarea name="notes" placeholder="Tell us what happened" />
          </label>
        </FormModal>
      )}
      {checkout && (
        <FormModal
          title="Complete your order"
          eyebrow="SECURE CHECKOUT"
          onClose={() => setCheckout(false)}
          onSubmit={submitOrder}
        >
          <p>Your order will be saved and tracked by our fulfillment team.</p>
          <Field name="customer_name" label="Name" />
          <Field name="email" label="Email" type="email" />
          <Field name="phone" label="Phone" />
          <label>
            Delivery address
            <textarea required name="address" />
          </label>
        </FormModal>
      )}
    </>
  );
}
