"use client";
import { useEffect, useState, type FormEvent } from "react";
import type { AdminMember } from "@/lib/contracts/member";
import { Input } from "@/components/ui/input";
import { post } from "@/lib/client/api";
export default function AdminContacts() {
  const [search, setSearch] = useState(""),
    [query, setQuery] = useState(""),
    [page, setPage] = useState(0);
  const [result, setResult] = useState<{
      members: AdminMember[];
      total: number;
    } | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(true),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    void post<{ members: AdminMember[]; total: number }>("/api/admin/members", {
      search: query,
      page,
    })
      .then((data) => {
        if (active) setResult(data);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [query, page, retry]);
  function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setResult(null);
    setPage(0);
    setQuery(search.trim());
    setRetry((v) => v + 1);
  }
  function turn(next: number) {
    setBusy(true);
    setError("");
    setResult(null);
    setPage(next);
  }
  return (
    <section>
      <p className="admin-note">
        Los datos de contacto solo están disponibles en este espacio. La
        autorización para recibir comunicaciones aparece en cada ficha.
      </p>
      <form onSubmit={submit} className="admin-search">
        <label htmlFor="member-search">
          Buscar por nombre, correo o teléfono
        </label>
        <div>
          <Input
            id="member-search"
            value={search}
            maxLength={100}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar una persona"
          />
          <button className="primary-button" disabled={busy}>
            Buscar
          </button>
        </div>
      </form>
      {error && (
        <div role="alert">
          <p className="form-error">{error}</p>
          <button
            className="text-link"
            onClick={() => {
              setBusy(true);
              setError("");
              setRetry((v) => v + 1);
            }}
          >
            Reintentar
          </button>
        </div>
      )}
      {busy ? (
        <p role="status">Consultando contactos…</p>
      ) : (
        result && (
          <>
            <p className="network-count">{result.total} personas registradas</p>
            {!result.members.length ? (
              <p>No hay personas que coincidan con esta búsqueda.</p>
            ) : (
              <div className="admin-contacts">
                {result.members.map((m) => (
                  <article className="admin-contact" key={m.id}>
                    <div className="admin-contact-top">
                      <h2>{m.name}</h2>
                      <span>{m.visible ? "En la red" : "Perfil oculto"}</span>
                    </div>
                    <p className="profile-tags">
                      {m.interests.map((i) => (
                        <span key={i}>{i}</span>
                      ))}
                    </p>
                    <dl>
                      <dt>Correo verificado</dt>
                      <dd>
                        <a href={`mailto:${encodeURIComponent(m.email)}`}>
                          {m.email}
                        </a>
                      </dd>
                      <dt>Teléfono</dt>
                      <dd>{m.phone || "No registrado"}</dd>
                      <dt>Ciudad</dt>
                      <dd>{m.city || "No registrada"}</dd>
                      <dt>Actividad</dt>
                      <dd>{m.role || "No registrada"}</dd>
                      <dt>Comunicaciones de Kolab</dt>
                      <dd>
                        {m.contactConsent
                          ? "Sí, autorizadas"
                          : "Sin autorización para invitaciones"}
                      </dd>
                      <dt>Actualizado</dt>
                      <dd>
                        {new Date(m.updatedAt).toLocaleDateString("es-CO")}
                      </dd>
                    </dl>
                    {m.bio && <p>{m.bio}</p>}
                  </article>
                ))}
              </div>
            )}
            <nav className="admin-pagination" aria-label="Páginas de contactos">
              <button disabled={!page} onClick={() => turn(page - 1)}>
                Anterior
              </button>
              <span>
                Página {page + 1} de {Math.max(1, Math.ceil(result.total / 50))}
              </span>
              <button
                disabled={(page + 1) * 50 >= result.total}
                onClick={() => turn(page + 1)}
              >
                Siguiente
              </button>
            </nav>
          </>
        )
      )}
    </section>
  );
}
