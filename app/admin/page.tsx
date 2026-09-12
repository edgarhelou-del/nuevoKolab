import { headers } from "next/headers";
import { currentUser, adminStatus } from "@/lib/server/auth";
import SignIn from "../unete/sign-in";
import SignOut from "../unete/sign-out";
import AdminContacts from "./contacts";
import Mfa from "./mfa";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Administración — Kolab",
  robots: { index: false, follow: false },
};
export default async function Admin() {
  const configured =
    !!process.env.SUPABASE_URL && !!process.env.SUPABASE_PUBLISHABLE_KEY;
  const session = configured ? await currentUser() : null;
  const status = session ? await adminStatus(session.db) : null;
  const nonce = (await headers()).get("x-nonce") || "";
  return (
    <main className="admin-page">
      <header className="admin-header">
        <a className="logo" href="/">
          kolab<span>✳</span>
        </a>
        <a className="text-link" href="/">
          Volver al sitio
        </a>
        {session && <SignOut />}
      </header>
      <p className="eyebrow">ESPACIO PRIVADO</p>
      <h1>Personas de la red.</h1>
      {!configured ? (
        <p>
          El acceso se habilitará cuando finalice la configuración del registro.
        </p>
      ) : !session ? (
        <div className="admin-auth">
          <SignIn nonce={nonce} destination="/admin" />
        </div>
      ) : !status?.admin ? (
        <p role="alert">
          Tu cuenta no tiene acceso a la administración de Kolab.
        </p>
      ) : !status.mfa ? (
        <Mfa />
      ) : (
        <AdminContacts />
      )}
    </main>
  );
}
