# SIGA Frontend — Propuestas de Mejora de Diseño

> Backlog de mejoras visuales/UX detectadas mientras se construían las 6 etapas.
> Ninguna cambia funcionalidad ni contratos de API — todas son sobre estilo,
> consistencia o experiencia de uso. Pensado como punto de partida para el pase de
> refactor de diseño. Como toda la app pasa por componentes centralizados
> (`BaseButton`, `FormField`, `AppShell`, badges, etc.), la mayoría de estos cambios
> se aplican en un solo archivo y se propagan a toda la app. Fecha: 2026-08-21.

---

## 🔴 Prioridad alta — afectan uso real, no solo estética

### 1. Navegación inferior móvil desbordada (rol Administrador)
El Administrador tiene 7 ítems de navegación (Dashboard, Estancias, Mapa, Registros,
Ranking, Usuarios, Auditoría). En móvil quedan en una barra inferior con scroll
horizontal — funciona, pero no es un patrón estándar y es fácil no darse cuenta de
que hay más ítems fuera de pantalla.
**Sugerencia:** menú tipo *drawer* (hamburguesa) para móvil con Administrador, o
un patrón "Más" que agrupe los ítems secundarios (Ranking/Usuarios/Auditoría) bajo
un mismo acceso. Mantener la barra inferior de 4 ítems para Captador (ya funciona
bien ahí).
**Dónde:** `src/components/layout/AppShell.vue`.

### 2. Sin confirmación visual de éxito en acciones (crear, asignar, guardar)
Hoy, al crear una Estancia/Captación/Usuario o asignar un sector/permiso, la única
señal de éxito es que la pantalla cambia o el ítem aparece en una lista. No hay un
mensaje explícito tipo "Usuario creado correctamente". En conexiones lentas o
cuando la lista tarda en refrescarse, no queda claro si la acción funcionó.
**Sugerencia:** un componente `Toast`/`Snackbar` reutilizable (esquina inferior,
auto-dismiss ~3s) disparado desde un composable simple (`useToast()`), usado tras
cada creación/edición/asignación exitosa en toda la app.
**Dónde:** nuevo `src/components/ui/Toast.vue` + `src/composables/useToast.ts`.

### 3. Expiración de sesión silenciosa
Cuando el token expira (o el backend responde 401), la sesión se cierra y se
redirige a Login sin explicación — el usuario no sabe por qué "lo sacaron".
**Sugerencia:** mostrar un mensaje breve en el Login ("Tu sesión expiró, vuelve a
iniciar sesión") cuando la redirección viene de un 401, usando el mismo evento
`EVENTO_NO_AUTORIZADO` que ya existe en `src/api/client.ts`.

---

## 🟡 Prioridad media — pulido consistente

### 4. Definir si habrá modo oscuro
`tailwind.config.js` está configurado con `darkMode: 'class'` y varios mockups de
Stitch incluyen clases `dark:`, pero hoy nada en la app activa ese modo — es una
decisión pendiente, no una implementación a medias.
**Sugerencia:** decidir explícitamente sí/no. Si es sí, es el momento de hacerlo
antes de que crezcan más pantallas (cambiar tokens de color una sola vez en
`tailwind.config.js` una vez definida la paleta oscura).

### 5. Botones de ícono sin tooltip visible
Los botones de solo-ícono (editar, eliminar, ver captaciones, cerrar diálogo) tienen
`aria-label` para lectores de pantalla, pero nada visible al pasar el mouse en
escritorio — hay que adivinar qué hace el ícono la primera vez.
**Sugerencia:** un pequeño `title` nativo como mínimo (cambio de una línea por
botón), o un componente `Tooltip` si se quiere algo más elegante y consistente con
el resto del sistema visual.

### 6. Validación de formularios solo al enviar
Los formularios (`FormField`) muestran errores recién al hacer submit. Un usuario
puede llenar todo un formulario largo (Registro de Captación, con sus grupos
animales) y enterarse del error hasta el final.
**Sugerencia:** validación al perder el foco (`blur`) por campo, manteniendo el
mismo mensaje de error debajo del campo que ya existe en `FormField.vue` — no
requiere rediseño, solo mover cuándo se dispara.

### 7. Skeletons genéricos en vez de skeletons "con forma"
Los estados de carga son bloques grises uniformes (`animate-pulse`) del mismo alto
que el contenido real, pero sin su estructura interna (no distinguen dónde irá el
título, el badge, los botones). Es un estado de carga correcto pero genérico.
**Sugerencia:** opcional — construir 2-3 skeletons "con forma" (tabla, tarjeta,
formulario) reutilizables para las pantallas de mayor uso (Estancias, Captaciones,
Maestro de Registros), en vez de repetir el mismo bloque gris en cada vista.

### 8. Auditoría de iconografía
Con 6 etapas construidas en momentos distintos, hay algunos íconos reutilizados con
significados distintos entre pantallas (ej. `assignment` se usa tanto para
"Registros/Maestro de Registros" como para "Captaciones" en algún lugar).
**Sugerencia:** pasada única para fijar un ícono por concepto (Estancia, Captación,
cada tipo de bitácora, Usuario, Auditoría) y documentarlo en un solo lugar (podría
ser un comentario en `AppShell.vue` o un pequeño mapa en `src/config/`).

---

## 🟢 Prioridad baja — mejoras de calidad, no urgentes

### 9. Mapa de Operaciones sin agrupación de pines (clustering)
Con pocas Estancias (2-3 en el seed) no se nota, pero con datos reales de
producción, muchos pines cercanos se superponen.
**Sugerencia:** `leaflet.markercluster` (plugin liviano, mismo ecosistema que ya se
usa) cuando el volumen de Estancias lo justifique — no es necesario ahora.

### 10. Sin vista previa de mapa en la captura GPS
`GpsCapture.vue` muestra las coordenadas como texto (`Lat: ... | Long: ...`) tras
capturar. Un mini-mapa estático confirmando visualmente el punto ayudaría a
detectar errores de GPS en campo (ej. una captura con el GPS del celular mal
calibrado).
**Sugerencia:** opcional — un Leaflet embebido pequeño (ya está la dependencia) o
un link "Ver en el mapa" que abra `MapaOperacionesView` centrado en ese punto.

### 11. Eliminar Captación no está expuesto en la UI
El backend sí tiene `DELETE /api/captaciones/{id}` (🔒 Administrador), pero ninguna
pantalla lo usa — solo Estancias tiene el flujo de eliminar con confirmación.
**Sugerencia:** agregar el mismo patrón (`ConfirmDialog`, ya existe) al listado de
Captaciones y/o al Reporte de Captación, para Administrador.

### 12. Paginación real pendiente para cuando crezcan los datos
Estancias, Maestro de Registros y Trazabilidad y Auditoría traen la lista completa
del backend sin paginar — correcto hoy con datos de seed, pero no va a escalar con
datos de producción reales (cientos/miles de registros).
**Sugerencia:** cuando el backend agregue parámetros de paginación (`page`/`pageSize`
o similar — hoy no existen en la API), agregar controles de paginación reutilizables
una sola vez y aplicarlos a las 3 pantallas.

---

## Cómo usar este documento
Cada ítem es independiente — se pueden tomar en cualquier orden. Los de prioridad
alta valen la pena antes de mostrarle el sistema a usuarios reales; los de
prioridad baja son mejoras incrementales para cuando haya tiempo. Al implementar
cualquiera, actualizar este archivo tachando o moviendo el ítem a un changelog.
