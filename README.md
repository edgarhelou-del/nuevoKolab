# nuevoKolab

Nueva experiencia de Kolab Estudio: cultura organizacional e inteligencia colectiva.

## Producto

- Mapa tridimensional de afinidades, con giro por arrastre, filtros, zoom y pausa.
- Perfiles reales conectados con los intereses que cada persona elige. Las partículas ambientales son un mapa conceptual; no representan miembros ficticios.
- Registro y acceso con ChatGPT, formulario de perfil, visibilidad voluntaria y eliminación de los datos del perfil.
- Base D1 persistente. Los identificadores de acceso y correos no se exponen en el mapa.
- Sitio corporativo: estudio, conferencias, laboratorios, acompañamiento cultural, método, fundadores y contacto.
- Diseño adaptable a móvil, reducción de movimiento y listado accesible como alternativa al mapa.

## Desarrollo

Requiere Node.js 22.13 o posterior y la versión de pnpm declarada en package.json.

```sh
pnpm install
pnpm dev
pnpm build
```

El proyecto utiliza React, TypeScript, Vinext y un Worker de Cloudflare. Mantener el complemento `sites()` en la configuración de Vite.

## Autenticación y despliegue

Esta entrega funciona en Sites y usa su autenticación con ChatGPT. El dispatcher proporciona cabeceras de identidad verificadas, y las API comprueban la identidad y el origen en el servidor. El Worker no debe exponerse directamente a tráfico que pueda falsificar esas cabeceras. GitHub almacena el código; no sustituye el servicio de autenticación, el alojamiento ni la base de datos.

El manifiesto `.openai/hosting.json` conserva la identidad del sitio y declara el enlace lógico D1 `DB`. Las migraciones Drizzle de `drizzle/` son aplicadas por la plataforma durante la publicación. No se incluye información personal de miembros ni secretos en el repositorio.

Si se despliega fuera de Sites, debe integrarse un proveedor de identidad real y adaptar el acceso a la base de datos antes de habilitar el registro. No usar cabeceras arbitrarias del cliente como identidad.

## Datos

`GET /api/network` devuelve solo campos públicos de hasta los 500 perfiles visibles más recientes y el total. El límite se indica en la interfaz. `GET /api/profile`, `POST /api/profile` y `DELETE /api/profile` operan únicamente sobre el perfil de la persona autenticada. Las conexiones muestran afinidades, no relaciones verificadas.

No hay perfiles precargados ni testimonios, clientes o cifras de impacto inventados.

## Contenido y activos

El contenido corporativo se elaboró a partir del contexto de Kolab proporcionado por su fundador. El sitio original no fue recuperable en esta sesión; no se afirma que esta sea una migración textual de él.

La fotografía `public/images/kolab-collaboration.png` fue generada para este sitio como imagen conceptual; no documenta un evento o cliente real. El resto de la experiencia visual es geometría y visualización de datos original. Moebio fue una referencia conceptual de exploración de redes; no se copió su código ni sus activos.

Contacto público: edgar@kolabestudio.com.
