# SIGA — Bugs de Backend Encontrados desde el Frontend

> Documento para reportar al equipo/repo de backend (`SIGA-BACKEND`). Cada bug fue
> reproducido de forma aislada con `curl` directo contra la API — sin el frontend
> de por medio — para confirmar que el problema es del backend, no de cómo el
> frontend arma la petición. Fecha de detección: 2026-08-21.

---

## 🔴 P0 — Crítico (bloquea funcionalidad completa de una pantalla)

### 1. `POST /api/usuarios/{id}/sectores` y `POST /api/usuarios/{id}/permisos` devuelven 500

**Endpoints afectados:**
- `POST /api/usuarios/{id}/sectores` (Asignar Sector)
- `POST /api/usuarios/{id}/permisos` (Asignar Permiso)

**Síntoma:** Ambos devuelven `500 Internal Server Error` de forma consistente, para
cualquier usuario (probado con un usuario del seed y con uno recién creado).

**Reproducción aislada (sin frontend):**
```bash
TOKEN=$(curl -s -X POST http://localhost:5095/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@siga.com","password":"Admin123!"}' \
  | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

curl -i -X POST "http://localhost:5095/api/usuarios/{ID_DE_UN_USUARIO}/sectores" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"nombreSector":"Sector Norte","zona":null}'
# -> HTTP 500, {"title":"Error interno del servidor","status":500,"detail":"Ocurrió un error inesperado."}

curl -i -X POST "http://localhost:5095/api/usuarios/{ID_DE_UN_USUARIO}/permisos" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"tipoPermiso":"EntradaDatos"}'
# -> HTTP 500, mismo detalle genérico
```

**Variantes probadas (todas fallan igual):**
- Con `zona` en `null`.
- Con `zona` como string (`"Zona A"`).
- Sin el campo `zona` en el body.
- Contra `captador@siga.com` (usuario del seed).
- Contra un usuario recién creado vía `POST /api/usuarios`.

**Lo que SÍ funciona (control, mismo servicio):**
`PUT /api/usuarios/{id}` (`ActualizarAsync` — editar nombre/cargo/estado) responde
`200 OK` correctamente contra el mismo usuario.

**Pista para depurar:** en `UsuarioService.cs`, `AsignarSectorAsync` y
`AsignarPermisoAsync` comparten un patrón que `ActualizarAsync` no usa: ambos llaman
`GetConDetalleAsync` (usuario con colecciones de navegación ya cargadas), agregan un
ítem a esa colección (`usuario.SectoresAsignados.Add(...)` / `usuario.Permisos.Add(...)`),
y luego llaman `usuarioRepository.Update(usuario)` antes de `SaveChangesAsync`. Sospecho
algo en esa combinación (posible excepción de EF Core al llamar `Update()` sobre una
entidad que `GetConDetalleAsync` ya deja *tracked* en el mismo `DbContext`, o una
configuración de la relación `SectorAsignado`/`PermisoUsuario` que no cuadra). El
`500` genérico oculta el detalle real a propósito (`ExceptionHandlingMiddleware`) —
al correr `dotnet run` en local, la excepción real debería verse en la consola.

**Impacto en el frontend:** la pantalla "Detalle de Usuario" (Seguridad y Usuarios)
no puede asignar sectores ni permisos a ningún usuario. El resto de esa pantalla
(editar cabecera, listar, revocar dispositivo — sin poder probar esta última por
falta de dispositivos en el seed) no está afectado. El frontend ya maneja el error
correctamente (muestra el mensaje del backend); en cuanto se corrija, debería
funcionar sin cambios en el cliente.

---

## 🟡 P1 — A confirmar (puede ser intencional, pero contradice la especificación)

### 2. `POST /api/registros-sanitarios` no exige rol Captador

**Spec dice:** sección 4.5 de `especificacion-integracion-frontend.md` marca
"Crear" con 🔒 (interpretado como Captador, igual que Pesaje/Movimiento/Alimentación).

**Código real:** `RegistrosSanitariosController.Crear` **no** tiene
`[Authorize(Roles = "Captador")]`, a diferencia de `RegistrosPesajeController`,
`MovimientosController` y `RegistrosAlimentacionController`, que sí lo tienen.

```csharp
// RegistrosSanitariosController.cs
[HttpPost]
public async Task<ActionResult<RegistroSanitarioDto>> Crear(CreateRegistroSanitarioDto dto, CancellationToken ct)
// ^ sin [Authorize(Roles = "Captador")], a diferencia de las otras 3 bitácoras
```

**Pregunta para el equipo de backend:** ¿fue una decisión deliberada que un
Administrador también pueda registrar eventos sanitarios (por ejemplo, un
veterinario con cuenta de Administrador), o es una anotación `[Authorize]` que
falta por descuido? El frontend ya replica este comportamiento tal cual está en el
código (Administrador sí puede crear registros sanitarios, no las otras 3
bitácoras) — si se confirma que es un descuido, avisar para ajustar el frontend
también.

---

## ⚪ Observaciones (no son bugs — funcionalidad ausente que puede ser intencional)

Estos no bloquean nada hoy, pero quedan anotados por si el alcance cambia:

- **No existe `DELETE` para Usuario.** No se puede dar de baja una cuenta creada
  por error salvo cambiando su `Estado` a `Suspendido` vía `PUT`. Si esto es
  intencional (por trazabilidad/auditoría), no hace falta nada; si no, faltaría el
  endpoint.
- **No existe `DELETE` para ninguna de las 4 bitácoras** (Pesaje, Sanitario,
  Movimiento, Alimentación). Un registro creado por error queda para siempre. Igual
  que el punto anterior, puede ser una decisión deliberada de bitácora inmutable.
