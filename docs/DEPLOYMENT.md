# Activar nuevoKolab en Vercel

## 1. Preparar Supabase

1. Crear un proyecto dedicado, en una región adecuada para los integrantes. Mantener otro proyecto para pruebas; no conectar previews públicos a los datos de producción.
2. Ejecutar una sola vez `supabase/migrations/202609120001_kolab.sql` en el SQL Editor del proyecto. Todo el cambio es transaccional. Para posteriores cambios, añadir otra migración; no editar una ya aplicada.
3. Dejar `kolab_private` fuera de los esquemas expuestos de la Data API. No conceder acceso a sus tablas ni usar `service_role` en Vercel.
4. En Authentication, habilitar correo y MFA TOTP. Deshabilitar accesos anónimos. Configurar el Site URL con el dominio canónico definitivo.
5. Configurar SMTP propio con remitente autorizado y su DNS (SPF/DKIM/DMARC). El correo integrado de prueba de Supabase no debe usarse como servicio público de producción. [Documentación SMTP](https://supabase.com/docs/guides/auth/auth-smtp).
6. En las plantillas **Magic Link** y **Confirm signup**, usar la plantilla `supabase/templates/email-otp.html`, que contiene `{{ .Token }}`. No se necesita callback de enlaces: el usuario introduce el código en el sitio. Usar caducidad de 10 minutos y mantener límites de envío/intentos adecuados. [OTP por correo](https://supabase.com/docs/guides/auth/auth-email-passwordless).
7. Crear un widget Cloudflare Turnstile con los dominios permitidos exactos. Activar CAPTCHA con Turnstile en Supabase Auth y colocar allí la clave **secreta**. La clave del sitio va en Vercel. La API rechaza solicitudes de envío sin CAPTCHA en producción. [Protección CAPTCHA](https://supabase.com/docs/guides/auth/auth-captcha).
8. Activar respaldos y comprobar una restauración en un proyecto separado. Registrar región, retención y responsables operativos. [Respaldos](https://supabase.com/docs/guides/platform/backups).

## 2. Importar GitHub en Vercel

Repositorio: `edgarhelou-del/nuevoKolab`. Framework: **Next.js**. Raíz: `/`. Node.js: **24.x**. `vercel.json` configura `npm ci` y `npm run build`; no configurar un directorio de salida estático.

| Variable | Valor | Ámbito |
|---|---|---|
| `APP_URL` | Origen canónico exacto, por ejemplo `https://tu-proyecto.vercel.app`, sin ruta | Servidor |
| `SUPABASE_URL` | URL HTTPS del proyecto Supabase | Servidor |
| `SUPABASE_PUBLISHABLE_KEY` | Clave `sb_publishable_…` del proyecto | Servidor; no es una clave de administración |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Clave pública del widget Turnstile | Navegador |

Configurar variables por entorno. Una preview funcional necesita su propio `APP_URL`, widget permitido y base de prueba; el control de origen no acepta automáticamente dominios de previews ni `x-forwarded-host`. No pegar secretos en el repositorio o en conversaciones. El build de Vercel bloquea variables ausentes, placeholders, URLs sin HTTPS y claves de servidor equivocadas.

Configurar Firewall/Rate Limiting en Vercel: como punto inicial, proteger `/api/auth/*` con 10 solicitudes por minuto por IP y `/api/network` con 60 por minuto por IP, ajustando según uso legítimo. Mantener las protecciones administradas de Vercel. Los límites de escritura autenticada (30/hora por cuenta) y lectura administrativa (120/10 minutos) ya se aplican en PostgreSQL. Los límites del proveedor para OTP/CAPTCHA son complementarios. [Firewall](https://vercel.com/docs/vercel-firewall/vercel-waf).

## 3. Dar acceso al administrador

1. Entrar a `/admin` usando el correo propio y el código recibido. La primera vez la cuenta todavía no tiene permiso administrativo.
2. En SQL Editor, abrir `supabase/promote-admin.sql`, reemplazar **solo** `REPLACE_WITH_YOUR_VERIFIED_EMAIL` por ese correo y ejecutarlo. El script exige una cuenta existente con correo confirmado. No hay inscripción automática por dominio, metadatos o nombre.
3. Recargar `/admin`. Pulsar «Verificar mi acceso», registrar el QR en una aplicación de autenticación y confirmar el código de seis dígitos.
4. El panel se abrirá tras obtener AAL2. En accesos posteriores pedirá el código del autenticador antes de mostrar contactos.

Para revocar el rol, el dueño del proyecto elimina su fila de `kolab_private.admin_users` desde SQL Editor. La siguiente consulta vuelve a comprobarla. En caso de pérdida del autenticador, verificar identidad por un canal independiente antes de restablecer MFA desde el panel de Supabase; la web no tiene una puerta de acceso alternativa.

## 4. Verificar antes de cambiar el dominio

```bash
npm ci
npm run lint
npm test
npm run build
npm run typecheck
APP_URL=https://tu-proyecto.vercel.app node scripts/verify-deployment.mjs
```

El último comando realiza solo lecturas y solicitudes vacías no autorizadas; no crea personas ni envía correos. Verifica páginas, cabeceras, proyección pública, bloqueo de consultas privadas sin sesión y rechazo de otro origen.

Realizar también una prueba de aceptación con cuentas propias de prueba: OTP real, sesión, crear perfil oculto, publicar nombre/intereses, editar teléfono, buscar desde el administrador, verificar el segundo factor, cerrar sesión y eliminar el perfil. Confirmar que una ventana privada nunca muestra datos de contacto. No usar personas reales como datos de prueba ni hacer pruebas masivas de envío.

Solo después de estas verificaciones, conectar el dominio definitivo en Vercel, ajustar DNS, `APP_URL`, Site URL y dominios Turnstile; desplegar de nuevo. Mantener disponible la versión anterior durante la transición. El sitio previo de Sites no se actualiza automáticamente con esta migración.

## 5. Personas de la versión anterior

En la comprobación del 12 de septiembre de 2026, la base anterior contenía un perfil. Ese registro permanece en Sites y no se ha borrado ni copiado al repositorio. Debe vincularse con su correo confirmado antes del cambio de dominio.

Esta migración conserva el contenido editorial; **no importa automáticamente registros D1 ni convierte identidades ChatGPT en identidades Supabase**. Antes del cambio de dominio, comprobar si existen perfiles reales en D1. Si existen, hacer una exportación privada y verificar cómo vincular cada persona con su nuevo correo confirmado; no inferir correos ni asignar perfiles por nombre. Solicitar de nuevo el consentimiento de visibilidad/contacto cuando corresponda. No cargar bases o exportaciones con personas en GitHub.

## Estado que requiere acceso a tus cuentas

El repositorio incluye código, migración, pruebas y configuración. Crear el proyecto externo, aplicar SQL, SMTP/DNS, CAPTCHA, asignar administrador y desplegar requieren las cuentas de los proveedores. Las pruebas locales no acreditan que esos pasos ya estén hechos.
