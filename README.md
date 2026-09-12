# nuevoKolab

Sitio de Kolab preparado para **Vercel + Supabase**, con Next.js, React y PostgreSQL externo. Conserva el diseño de la red 3D y las 24 rutas de contenido original en español e inglés.

- Red pública: únicamente nombre e intereses; UUID aleatorio interno para cada nodo.
- Registro por código enviado al correo. Cookies de sesión HttpOnly; sin contraseñas ni tokens en localStorage.
- Contactos privados: correo verificado, teléfono opcional, ciudad, actividad e idea.
- Panel `/admin`: búsqueda y paginación, autorización explícita y MFA obligatorio.
- Publicación y autorización de comunicaciones independientes; desactivadas inicialmente.
- Base privada con RLS en modo denegar por defecto y funciones SQL con permisos mínimos.

## Desarrollo

Requiere Node.js 24 y npm.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Configura los valores propios de Supabase en `.env.local`. Sin ellos, el contenido editorial funciona y el registro indica que está en preparación. En Vercel, el build falla si faltan las variables requeridas.

```bash
npm run lint
npm test
npm run build
npm run typecheck
```

`npm test` ejecuta pruebas de los límites HTTP y de los permisos reales de PostgreSQL mediante PGlite. El entorno de prueba simula el esquema de identidad de Supabase; no sustituye la prueba de correo, CAPTCHA y MFA en el proyecto desplegado.

## Despliegue

Sigue [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). Incluye la migración SQL, plantilla de correo, variables Vercel, alta del administrador, verificaciones y cambio de dominio. **El código preparado no crea automáticamente cuentas o servicios externos.**

- [Arquitectura](docs/ARCHITECTURE.md)
- [Seguridad y operación](docs/SECURITY.md)
- [Migración PostgreSQL](supabase/migrations/202609120001_kolab.sql)
- [Asignación explícita de administrador](supabase/promote-admin.sql)

La versión anterior de Sites permanece independiente. `.openai/hosting.json` conserva su referencia histórica; el runtime actual no la importa y el despliegue de esta versión usa Vercel. El historial Git conserva la implementación anterior basada en D1.
