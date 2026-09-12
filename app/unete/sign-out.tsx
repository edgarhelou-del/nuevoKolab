"use client";
import { useState } from "react";
import { post } from "@/lib/client/api";
export default function SignOut() {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <>
      <button
        className="text-link"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await post("/api/auth/signout", {});
            window.location.assign("/unete");
          } catch {
            setError("No pudimos cerrar sesión. Reintenta.");
            setBusy(false);
          }
        }}
      >
        Cerrar sesión
      </button>
      {error && <span role="alert">{error}</span>}
    </>
  );
}
