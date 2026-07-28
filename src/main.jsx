import React from "react";
import { createRoot } from "react-dom/client";
import { EvCursor } from "./components/shared.jsx";
import Store from "./features/store/Store.jsx";
import Admin from "./features/admin/Admin.jsx";
import "./styles/index.css";

createRoot(document.getElementById("root")).render(
  <>
    <EvCursor />
    {location.pathname.startsWith("/admin") ? <Admin /> : <Store />}
  </>,
);
