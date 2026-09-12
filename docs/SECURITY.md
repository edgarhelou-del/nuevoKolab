# Seguridad y operación

## Controles implementados

- Datos de contacto en esquema privado, físicamente separados de los campos de la red; RLS habilitado sin acceso directo de clientes.
- RPC con alcance mínimo, identidad derivada del JWT verificado por Supabase y comprobaciones administrativas/MFA dentro de la base.
- Sin clave `service_role` o contraseña PostgreSQL en el runtime; sin credenciales en el cliente.
- Validación de datos tanto en Next.js/Zod como en SQL; consultas parametrizadas y transacciones para guardar perfil y contacto juntos.
- Cookies HttpOnly, Secure en producción, SameSite=Lax, sin tokens en localStorage.
- Las operaciones privadas comprueban también `session_id` contra `auth.sessions`: una sesión eliminada al cerrar acceso, vencida o de otra cuenta no permite leer/modificar contactos aunque su JWT conserve validez criptográfica.
- Control estricto de origen en mutaciones y consultas privadas POST; límite de 8 KiB durante lectura del cuerpo, también sin Content-Length.
- Sin caché de sesiones/contactos; búsquedas administrativas en cuerpo POST para no poner teléfonos/correos en URLs y logs.
- CSP con nonce por respuesta, bloqueo de iframes externos del sitio, `nosniff`, HSTS y políticas restrictivas de cámara, micrófono y ubicación. Se permite `style-src 'unsafe-inline'` para los componentes visuales; producción no permite scripts inline sin nonce ni `unsafe-eval`.
- Validación de correo con OTP, CAPTCHA de producción y MFA TOTP para administración.
- Registro administrativo sin datos personales ni texto de búsqueda; depuración de eventos mayores de 90 días en cada consulta.
- Errores públicos genéricos; nunca registrar payloads, contactos, cookies o errores completos del proveedor.
- Publicación opt-in y consentimiento opcional separado para comunicaciones. Eliminación en cascada de perfil/contactos activos.

## Pruebas y límites

Las pruebas PostgreSQL ejecutan la migración real en PGlite con roles `anon` y `authenticated`, y un esquema de autenticación de prueba. Cubren filtrado público, privilegios, apropiación de perfiles, escalada por metadatos, MFA, validación independiente de la interfaz, consultas parametrizadas, borrado y límites de escritura. Las pruebas HTTP cubren origen, tamaño, formato, autenticación/autorización y caché.

Esto no es una certificación ni una garantía absoluta. SMTP, CAPTCHA, firma y renovación de sesiones reales, restauraciones y configuración de los proveedores se validan en el entorno desplegado. El dominio canónico debe configurarse explícitamente. Los nombres e intereses publicados son datos públicamente consultables y pueden copiarse.

## Mantenimiento

### Avisos del asesor de Supabase

La revisión de la base desplegada señala RLS sin políticas en las cinco tablas privadas y funciones `SECURITY DEFINER` ejecutables por los roles API. Es intencional: las tablas niegan acceso directo y las funciones son el único acceso acotado. La función anónima `kolab_network` devuelve exclusivamente identificador público, nombre e intereses de perfiles visibles; las demás exigen identidad, sesión activa y, para contactos administrativos, rol explícito y AAL2. Mantener estos avisos documentados y revisar cada nueva función; no conceder permisos a tablas para silenciarlos. [RLS sin políticas](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy), [funciones anónimas](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable), [funciones autenticadas](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).

### Rutina de operación

- Mantener MFA también en GitHub, Supabase y Vercel; conceder acceso solo a responsables necesarios.
- Revisar actualizaciones Dependabot y avisos de Next.js/Supabase. La actualización de esta migración utiliza Next.js 16.3.5, posterior al [aviso de agosto de 2026](https://nextjs.org/blog/august-2026-security-release).
- Revisar respaldos y probar restauración antes del lanzamiento y después de cambios de infraestructura. Un respaldo no verificado no acredita recuperación.
- No almacenar dumps, tokens o claves en GitHub. Revocar y rotar cualquier secreto expuesto; revisar sesiones y eventos de acceso.
- Para incidentes: restringir `/admin` o deshabilitar temporalmente acceso en proveedor, revocar roles/sesiones comprometidas, preservar eventos sin difundir contactos y aplicar correcciones antes de reabrir.
- Tramitar eliminación completa de cuenta desde Supabase después de verificar identidad; borrar `auth.users` elimina perfiles/contactos por cascada. Respetar la retención de respaldos configurada y registrar la solicitud fuera del repositorio público.
- Definir antes del lanzamiento los datos legales del responsable, jurisdicción, región de tratamiento y política de retención adecuada al proyecto. La página de privacidad describe el comportamiento técnico; no certifica cumplimiento legal.

## Fuentes técnicas

[Sesiones de servidor](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [MFA TOTP](https://supabase.com/docs/guides/auth/auth-mfa/totp), [CSP de Next.js](https://nextjs.org/docs/app/guides/content-security-policy).
