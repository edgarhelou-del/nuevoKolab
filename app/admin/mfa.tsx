"use client";
import { useState, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { post } from "@/lib/client/api";
export default function Mfa() {
  const [factor, setFactor] = useState<{
    factorId: string;
    qr?: string;
    secret?: string;
  } | null>(null);
  const [code, setCode] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function start() {
    setBusy(true);
    setError("");
    try {
      setFactor(await post("/api/auth/mfa", { action: "start" }));
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No pudimos activar la verificación.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function verify(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await post("/api/auth/mfa", {
        action: "verify",
        factorId: factor?.factorId,
        code,
      });
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Revisa el código.");
      setBusy(false);
    }
  }
  return (
    <section className="admin-auth profile-form">
      <h2>Una segunda llave.</h2>
      <p>
        Para consultar contactos, confirma tu acceso con una aplicación de
        autenticación.
      </p>
      {!factor ? (
        <button className="primary-button" disabled={busy} onClick={start}>
          {busy ? "Preparando…" : "Verificar mi acceso"}
        </button>
      ) : (
        <form onSubmit={verify}>
          {factor.qr && (
            <>
              <p>
                Escanea este código con tu aplicación de autenticación y guarda
                la cuenta de Kolab.
              </p>
              {/* QR is returned by the authenticated provider, never injected as HTML. */}
              <img
                className="mfa-qr"
                src={
                  factor.qr.startsWith("data:")
                    ? factor.qr
                    : `data:image/svg+xml;charset=utf-8,${encodeURIComponent(factor.qr)}`
                }
                width={220}
                height={220}
                alt="Código QR para configurar tu autenticador"
              />
              <details>
                <summary>Introducir clave manualmente</summary>
                <code className="mfa-secret">{factor.secret}</code>
              </details>
            </>
          )}
          <label htmlFor="mfa-code">Código de tu autenticador</label>
          <Input
            id="mfa-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            required
          />
          <button className="primary-button" disabled={busy}>
            {busy ? "Verificando…" : "Abrir contactos"}
          </button>
        </form>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
