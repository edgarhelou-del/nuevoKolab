"use client";
import { useState, useEffect, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { ArrowUpRight, Check, Loader2 } from "lucide-react";
import type { OwnProfile } from "@/lib/contracts/member";
type Profile = OwnProfile;
export default function ProfileForm({
  defaultName,
  email,
}: {
  defaultName: string;
  email: string;
}) {
  const [p, setP] = useState<Profile>({
    name: defaultName,
    city: "",
    role: "",
    bio: "",
    interests: [],
    visible: false,
    email,
    phone: "",
    contactConsent: false,
  });
  const [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [exists, setExists] = useState(false),
    [consent, setConsent] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState(false),
    [loadFailed, setLoadFailed] = useState(false);
  const load = () =>
    fetch("/api/profile")
      .then(async (r) => {
        const d = (await r.json()) as { profile: Profile; error?: string };
        if (!r.ok) throw Error(d.error);
        return d;
      })
      .then((d) => {
        if (d.profile) {
          setP(d.profile);
          setExists(true);
          setConsent(true);
        }
      })
      .catch((e) => {
        setError(
          e instanceof Error ? e.message : "No se pudo cargar el perfil.",
        );
        setLoadFailed(true);
      })
      .finally(() => setLoading(false));
  useEffect(() => {
    void load();
  }, []);
  const update = (key: string, v: unknown) => {
    setP((p) => ({ ...p, [key]: v }));
    setSuccess(false);
  };
  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: p.name,
          city: p.city,
          role: p.role,
          bio: p.bio,
          interests: p.interests,
          visible: p.visible,
          phone: p.phone,
          contactConsent: p.contactConsent,
          consent,
        }),
      });
      const d = (await r.json()) as { profile: Profile; error?: string };
      if (!r.ok) throw Error(d.error);
      setP(d.profile);
      setExists(true);
      setSuccess(true);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No pudimos guardar el perfil.",
      );
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    setBusy(true);
    try {
      const r = await fetch("/api/profile", { method: "DELETE" });
      if (!r.ok) {
        const d = (await r.json()) as { profile: Profile; error?: string };
        throw Error(d.error);
      }
      window.location.assign("/#comunidad");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No pudimos retirar el perfil.",
      );
      setBusy(false);
    }
  };
  if (loading)
    return (
      <div className="form-loading" role="status">
        <Loader2 className="animate-spin" /> Cargando tu espacio…
      </div>
    );
  if (loadFailed)
    return (
      <div className="form-loading">
        <p role="alert">{error}</p>
        <button
          className="primary-button"
          onClick={() => {
            setLoading(true);
            setLoadFailed(false);
            void load();
          }}
        >
          Volver a intentar
        </button>
      </div>
    );
  return (
    <form onSubmit={save} className="profile-form">
      <h2>{exists ? "Tu perfil, tu voz." : "Un nuevo punto de encuentro."}</h2>
      <p className="form-lead">
        En la red solo se verán tu nombre y tus intereses. Los demás datos son
        privados.
      </p>
      <label htmlFor="name">
        Tu nombre <span>*</span>
      </label>
      <Input
        id="name"
        autoComplete="name"
        value={p.name}
        onChange={(e) => update("name", e.target.value)}
        required
        minLength={2}
        maxLength={70}
        placeholder="¿Cómo te llamas?"
      />
      <div className="private-fields">
        <p className="eyebrow">DATOS PRIVADOS · SOLO TÚ Y KOLAB</p>
        <label htmlFor="contact-email">Correo verificado</label>
        <Input id="contact-email" type="email" value={p.email} readOnly />
        <label htmlFor="phone">Teléfono (opcional)</label>
        <Input
          id="phone"
          type="tel"
          autoComplete="tel"
          value={p.phone}
          onChange={(e) => update("phone", e.target.value)}
          maxLength={32}
        />
        <div className="form-two">
          <div>
            <label htmlFor="city">Ciudad</label>
            <Input
              id="city"
              autoComplete="address-level2"
              value={p.city}
              onChange={(e) => update("city", e.target.value)}
              maxLength={80}
              placeholder="Desde dónde conectas"
            />
          </div>
          <div>
            <label htmlFor="role">Lo que haces (opcional)</label>
            <Input
              id="role"
              value={p.role}
              onChange={(e) => update("role", e.target.value)}
              maxLength={100}
              placeholder="Tu oficio, rol o pasión"
            />
          </div>
        </div>
      </div>
      <fieldset>
        <legend>
          ¿Qué te mueve? <span>*</span>
        </legend>
        <p className="small-note">Elige una o varias afinidades.</p>
        <div className="interest-grid">
          {(["Cultura", "Arte", "Tecnología", "Naturaleza"] as const).map(
            (i) => (
              <label
                key={i}
                className={
                  p.interests.includes(i) ? "interest checked" : "interest"
                }
              >
                <Checkbox
                  checked={p.interests.includes(i)}
                  onCheckedChange={(checked) =>
                    update(
                      "interests",
                      checked
                        ? [...p.interests, i]
                        : p.interests.filter((x) => x !== i),
                    )
                  }
                />
                {i}
              </label>
            ),
          )}
        </div>
      </fieldset>
      <label htmlFor="bio">Una pregunta o idea para Kolab (privada)</label>
      <Textarea
        id="bio"
        value={p.bio}
        onChange={(e) => update("bio", e.target.value)}
        maxLength={500}
        rows={3}
        placeholder="¿Qué te gustaría explorar con otras personas?"
      />
      <span className="character-count">{p.bio.length}/500</span>
      <label className="visibility-row" htmlFor="visible">
        <span>
          Aparecer en la red
          <small>
            Publica únicamente tu nombre y tus intereses. Tu correo y teléfono
            permanecen privados.
          </small>
        </span>
        <Switch
          id="visible"
          checked={p.visible}
          onCheckedChange={(v) => update("visible", v)}
        />
      </label>
      <div className="consent-row">
        <Checkbox
          id="contact-consent"
          checked={p.contactConsent}
          onCheckedChange={(v) => update("contactConsent", v === true)}
        />
        <label htmlFor="contact-consent">
          Quiero que Kolab pueda contactarme sobre encuentros y actividades de
          la comunidad (opcional).
        </label>
      </div>
      <div className="consent-row">
        <Checkbox
          id="consent"
          checked={consent}
          onCheckedChange={(v) => setConsent(v === true)}
          required
        />
        <label htmlFor="consent">
          Autorizo a Kolab a guardar estos datos para gestionar mi perfil, según
          la{" "}
          <a href="/privacidad" target="_blank">
            información de privacidad
          </a>
          .
        </label>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {success ? (
        <div className="form-success" role="status">
          <Check size={20} />
          <div>
            <strong>
              {p.visible
                ? "Ya eres parte de la red."
                : "Tu perfil está guardado en privado."}
            </strong>
            <a href="/#comunidad">
              {p.visible ? "Explorar mis conexiones" : "Explorar la comunidad"}{" "}
              <ArrowUpRight size={16} />
            </a>
          </div>
        </div>
      ) : (
        <button
          className="primary-button submit-button"
          type="submit"
          disabled={busy || !consent || !p.interests.length}
        >
          {busy ? "Guardando…" : exists ? "Guardar cambios" : "Crear mi perfil"}{" "}
          <ArrowUpRight size={18} />
        </button>
      )}
      {exists && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button type="button" className="delete-profile" disabled={busy}>
              Retirar y eliminar mi perfil
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>¿Retirar tu perfil de Kolab?</AlertDialogTitle>
            <AlertDialogDescription>
              Tu perfil y los datos que compartiste se eliminarán de la
              comunidad. Esta acción conserva tu acceso por correo. Para
              eliminar también la cuenta, consulta la información de privacidad.
            </AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogCancel>Conservar mi perfil</AlertDialogCancel>
              <AlertDialogAction onClick={remove}>
                Eliminar mi perfil
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </form>
  );
}
