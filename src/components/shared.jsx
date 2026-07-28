import React, { useEffect, useRef } from "react";
import { ArrowRight, Bike, Zap, X } from "lucide-react";
import { money } from "../lib/api.js";

export function EvCursor() {
  const ref = useRef(null);
  useEffect(() => {
    const move = (e) => {
      if (ref.current)
        ref.current.style.transform = `translate3d(${e.clientX + 12}px,${e.clientY + 10}px,0)`;
    };
    const down = () => ref.current?.classList.add("pressed"),
      up = () => ref.current?.classList.remove("pressed");
    addEventListener("pointermove", move);
    addEventListener("pointerdown", down);
    addEventListener("pointerup", up);
    return () => {
      removeEventListener("pointermove", move);
      removeEventListener("pointerdown", down);
      removeEventListener("pointerup", up);
    };
  }, []);
  return (
    <div
      className="ev-cursor"
      ref={ref}
      aria-hidden="true"
      style={{ pointerEvents: "none" }}
    >
      <Bike />
      <Zap />
    </div>
  );
}
export function Brand({ to = "#top", inverse = false }) {
  return (
    <a
      className={`brand-mark ${inverse ? "inverse" : ""}`}
      href={to}
      aria-label="SAI Multi Brand Electric Vehicle Service Center"
    >
      <span className="brand-sai">SAI</span>
      <span className="brand-copy">
        <b>MULTI-BRAND ELECTRIC VEHICLE</b>
        <small>SERVICE CENTER</small>
      </span>
    </a>
  );
}
const tilt = (e) => {
  if (matchMedia("(pointer:fine)").matches) {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty(
      "--rx",
      `${((e.clientY - r.top) / r.height - 0.5) * -10}deg`,
    );
    e.currentTarget.style.setProperty(
      "--ry",
      `${((e.clientX - r.left) / r.width - 0.5) * 12}deg`,
    );
  }
};
const untilt = (e) => {
  e.currentTarget.style.setProperty("--rx", "0deg");
  e.currentTarget.style.setProperty("--ry", "0deg");
};
export function Product({ p, add }) {
  return (
    <article
      onPointerMove={tilt}
      onPointerLeave={untilt}
      className={"product tilt-card " + (p.featured ? "dark" : "")}
    >
      {p.featured && <span className="popular">MOST POPULAR</span>}
      <img src={p.image} alt={p.name} loading="lazy" />
      <div className="product-title">
        <div>
          <h3>{p.name}</h3>
          <small>{p.tag}</small>
        </div>
        <strong>{money(p.price)}</strong>
      </div>
      <div className="specs">
        {p.specs.map(([a, b]) => (
          <div key={a}>
            <small>{a}</small>
            <b>{b}</b>
          </div>
        ))}
      </div>
      <button
        disabled={!p.stock}
        className={p.featured ? "green" : "black"}
        onClick={() => add(p)}
      >
        {p.stock ? (p.featured ? "Pre-order now" : "Add to cart") : "Sold out"}
      </button>
    </article>
  );
}
export function Field({
  name,
  label,
  type = "text",
  defaultValue,
  required = true,
}) {
  return (
    <label>
      {label}
      <input
        required={required}
        name={name}
        type={type}
        defaultValue={defaultValue}
      />
    </label>
  );
}
export function FormModal({
  title,
  eyebrow,
  onClose,
  onSubmit,
  children,
  submitLabel = "Submit",
  submitting = false,
}) {
  return (
    <div className="modal-wrap" role="presentation">
      <div className="shade" onClick={submitting ? undefined : onClose} />
      <form
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onSubmit={onSubmit}
      >
        <button
          type="button"
          className="close"
          aria-label="Close"
          onClick={onClose}
          disabled={submitting}
        >
          <X />
        </button>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        {children}
        <button
          className="green submit"
          disabled={submitting}
          aria-busy={submitting}
        >
          {submitting ? "Please wait…" : submitLabel}
        </button>
      </form>
    </div>
  );
}
