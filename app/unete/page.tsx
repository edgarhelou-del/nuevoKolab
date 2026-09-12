import { currentUser } from "@/lib/server/auth";
import ProfileForm from "./profile-form";
import SignIn from "./sign-in";
import SignOut from "./sign-out";
import { ArrowLeft } from "lucide-react";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Tu lugar en la red — Kolab",
  robots: { index: false, follow: false },
};
export default async function Join() {
  const configured =
    !!process.env.SUPABASE_URL && !!process.env.SUPABASE_PUBLISHABLE_KEY;
  const session = configured ? await currentUser() : null;
  return (
    <main className="join-page">
      <a href="/" className="logo">
        kolab<span>✳</span>
      </a>
      <a className="back-link" href="/#red">
        <ArrowLeft size={16} /> Volver a la red
      </a>
      <div className="join-grid">
        <div className="join-intro">
          <p className="eyebrow">NO FALTABA UNA IDEA. FALTABAS TÚ.</p>
          <h1>
            Tu diferencia.
            <br />
            Nuestra
            <br />
            <em>posibilidad.</em>
          </h1>
          <p>
            La inteligencia colectiva empieza cuando una nueva voz entra en la
            conversación.
          </p>
          <div className="join-steps">
            <p>
              <span>01</span> Cuenta qué te mueve.
            </p>
            <p>
              <span>02</span> Encuentra afinidades inesperadas.
            </p>
            <p>
              <span>03</span> Haz parte de lo que viene.
            </p>
          </div>
        </div>
        <div className="join-form-wrap">
          {!configured ? (
            <div className="signin-panel">
              <h2>Estamos preparando la red.</h2>
              <p>
                El registro estará disponible pronto. Ya puedes explorar el
                estudio y sus ideas.
              </p>
              <a className="primary-button" href="/">
                Explorar Kolab
              </a>
            </div>
          ) : session ? (
            <>
              <div className="session-bar">
                <span>Tu espacio en Kolab</span>
                <SignOut />
              </div>
              <ProfileForm defaultName="" email={session.user.email || ""} />
            </>
          ) : (
            <SignIn />
          )}
        </div>
      </div>
    </main>
  );
}
