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

El 12 de septiembre de 2026 se incorporó el contenido de las 24 rutas de https://www.kolabestudio.com, en español e inglés: portada, Quiénes somos, Servicios, sus tres páginas de detalle, Herramientas, Laboratorio, tres artículos completos y Contacto. Se conservan los textos publicados por Kolab, incluidas sus atribuciones y referencias; esta migración no constituye una nueva verificación de las afirmaciones editoriales.

`content/original-site.json` contiene el contenido HTML saneado, sin scripts, estilos ni eventos del sitio de origen. `content/migration-manifest.json` registra las rutas y las fuentes de las imágenes. Se cotejaron 581 bloques de contenido y todos los enlaces internos y archivos de imagen. Las imágenes originales se sirven desde el proyecto, optimizadas en WebP. La portada mantiene la red tridimensional y el diseño de la nueva versión.

El formulario de contacto conserva el funcionamiento del sitio original: prepara un correo dirigido a edgar@kolabestudio.com. La persona revisa y envía ese borrador desde su aplicación de correo; el sitio no afirma haber enviado mensajes por sí mismo.

La fotografía `public/images/kolab-collaboration.png` fue generada para este sitio como imagen conceptual; no documenta un evento o cliente real. Las imágenes de `public/images/original/` provienen del sitio anterior de Kolab; sus URL de origen constan en el manifiesto. El resto de la experiencia visual es geometría y visualización de datos original. Moebio fue una referencia conceptual de exploración de redes; no se copió su código ni sus activos.

Contacto público: edgar@kolabestudio.com.
