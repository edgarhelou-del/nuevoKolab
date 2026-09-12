"use client";
import { useState, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { post } from "@/lib/client/api";
export default function SignIn({
  destination = "/unete",
}: {
  destination?: "/unete" | "/admin";
}) {
  const [email, setEmail] = useState(""),
    [token, setToken] = useState(""),
    [sent, setSent] = useState(false);
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (sent) {
        await post("/api/auth/verify", { email, token });
        window.location.assign(destination);
      } else {
        await post("/api/auth/otp", { email });
        setSent(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos iniciar sesión.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="profile-form signin-panel" onSubmit={submit}>
      <span className="large-star" aria-hidden="true">
        ✳
      </span>
      <h2>{sent ? "Revisa tu correo." : "Empieza una conexión."}</h2>
      <p>
        {sent
          ? "Ingresa el código que enviamos a tu correo. Puede tardar un momento."
          : "Accede con un código de un solo uso. Tu correo será privado y no aparecerá en la red."}
      </p>
      <label htmlFor="login-email">Correo electrónico</label>
      <Input
        id="login-email"
        type="email"
        autoComplete="email"
        required
        maxLength={254}
        value={email}
        disabled={sent || busy}
        onChange={(e) => setEmail(e.target.value)}
      />
      {sent && (
        <>
          <label htmlFor="login-code">Código de acceso</label>
          <Input
            id="login-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6,8}"
            required
            minLength={6}
            maxLength={8}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            autoFocus
          />
        </>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button
        className="primary-button"
        disabled={busy}
      >
        {busy ? "Un momento…" : sent ? "Entrar a Kolab" : "Recibir código"}
      </button>
      {sent && (
        <button
          className="text-link"
          type="button"
          disabled={busy}
          onClick={() => {
            setSent(false);
            setToken("");
            setError("");
          }}
        >
          Cambiar correo o solicitar otro código
        </button>
      )}
      <p className="small-note">
        Al continuar creamos tu acceso para gestionar el perfil. Publicar en la
        red es opcional.
      </p>
      <a className="text-link" href="/privacidad">
        Cómo cuidamos tus datos
      </a>
    </form>
  );
}
