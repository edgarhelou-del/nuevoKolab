import { ArrowLeft } from "lucide-react";
export const metadata = { title: "Privacidad de la comunidad — Kolab" };
export default function Privacy() {
  return (
    <main className="privacy-page">
      <a href="/" className="logo">
        kolab<span>✳</span>
      </a>
      <article>
        <a className="back-link" href="/unete">
          <ArrowLeft size={16} /> Volver a mi perfil
        </a>
        <p className="eyebrow">LA CONFIANZA EMPIEZA AQUÍ</p>
        <h1>
          Tus datos.
          <br />
          <em>Tus decisiones.</em>
        </h1>
        <p>
          Información del registro de la comunidad Kolab. Última actualización:
          12 de septiembre de 2026.
        </p>
        <h2>Qué guardamos y para qué</h2>
        <p>
          Guardamos tu nombre e intereses para conectar afinidades, tu correo
          verificado para acceder y gestionar tu cuenta, y los datos opcionales
          que decidas completar: teléfono, ciudad, actividad e idea. También
          guardamos tu elección de visibilidad, autorización de contacto y fecha
          de consentimiento.
        </p>
        <h2>Qué es público</h2>
        <p>
          Si activas «Aparecer en la red», cualquier visitante puede consultar
          únicamente tu nombre e intereses. El mapa utiliza además un
          identificador aleatorio para representar cada nodo. Las conexiones
          representan afinidades, no relaciones personales verificadas. Tu
          correo, teléfono, ciudad, actividad e idea no se publican.
        </p>
        <h2>Tus contactos son privados</h2>
        <p>
          Puedes consultar tus propios datos. La administración autorizada de
          Kolab puede consultar los datos de los integrantes desde un panel
          privado con verificación en dos pasos. Solo enviaremos invitaciones o
          comunicaciones de la comunidad si marcas esa autorización opcional. No
          necesitas aceptarla para crear tu perfil.
        </p>
        <h2>Acceso y proveedores</h2>
        <p>
          El sitio utiliza Vercel para el alojamiento y Supabase para la
          autenticación y la base de datos PostgreSQL externa. Accedes mediante
          un código temporal enviado a tu correo; Kolab no te pide una
          contraseña. Usamos cookies de sesión necesarias y una verificación de
          seguridad de Cloudflare Turnstile para proteger el acceso. Los datos
          se procesan en las regiones configuradas para esos proveedores.
        </p>
        <h2>Editar, ocultar o retirar</h2>
        <p>
          Desde tu perfil puedes corregir tus datos, retirar la autorización de
          contacto, ocultarte o eliminar el perfil y sus datos de contacto de la
          base activa. La eliminación del perfil conserva tu cuenta de acceso
          para que puedas volver a registrarte. Para solicitar también la
          eliminación de esa cuenta, escribe al contacto indicado abajo. Ocultar
          o eliminar no retira las copias que terceros hayan hecho de tu nombre
          e intereses mientras eran públicos.
        </p>
        <h2>Conservación</h2>
        <p>
          Conservamos tu perfil mientras forme parte de la comunidad. Los
          registros de consultas administrativas no incluyen contactos ni
          búsquedas y se depuran a los 90 días durante las siguientes consultas.
          Las copias de respaldo siguen el plazo configurado con el proveedor;
          una eliminación en la base activa no borra inmediatamente sus copias
          de respaldo.
        </p>
        <h2>Contacto y solicitudes</h2>
        <p>
          Para consultar, corregir o solicitar la eliminación de tus datos,
          contacta a Kolab en{" "}
          <a href="mailto:edgar@kolabestudio.com">edgar@kolabestudio.com</a>.
          Indica el correo con el que te registraste; verificaremos tu identidad
          antes de tramitar la solicitud.
        </p>
      </article>
    </main>
  );
}
