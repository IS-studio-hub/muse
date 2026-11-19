import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { PasswordGate } from "./app/components/PasswordGate";
import "./styles/theme.css";

// Root is lazy-loaded so the site code is only fetched after unlocking.
const Root = lazy(() =>
  import("./app/pages/Root").then((m) => ({ default: m.Root })),
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter
      basename={import.meta.env.BASE_URL.replace(/\/$/, '') || undefined}
    >
      <PasswordGate>
        <Suspense fallback={null}>
          <Root />
        </Suspense>
      </PasswordGate>
    </BrowserRouter>
  </StrictMode>,
);
