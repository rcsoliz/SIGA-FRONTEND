# Prompt para Claude Code — SIGA-FRONTEND: consumir catálogos + fix de email

Contexto: el backend (`SIGA-BACKEND`) ya expone los catálogos de ubicación/raza/producto
y acepta los `*Id` nuevos en Estancias, DetalleLoteGanado y RegistroSanitario. Ya
implementé y **verifiqué que compila** (`npx vue-tsc -b` sin errores) esta misma tarea en
un entorno aparte — este prompt tiene el detalle exacto de esa implementación, incluidos
dos problemas reales que encontré en el camino. Seguilo tal cual salvo que el código del
repo haya cambiado desde entonces, en cuyo caso adaptá.

**Regla:** aditivo. Los campos string legado (`departamento`, `provincia`, `municipio`,
`raza`, `productoTratamiento`) se mantienen tal cual — se agregan los `*Id` al lado, no
se reemplazan.

---

## 1. Nuevo cliente API: `src/api/catalogos.ts`

Mismo patrón que `src/api/estancias.ts` (funciones sueltas exportadas):

```typescript
import { apiClient } from './client'
import type {
  DepartamentoDto,
  MunicipioDto,
  ProductoTratamientoDto,
  ProvinciaDto,
  RazaDto,
} from '@/types/dto'

export async function listarDepartamentos(): Promise<DepartamentoDto[]> {
  const { data } = await apiClient.get<DepartamentoDto[]>('/catalogos/departamentos')
  return data
}

export async function listarProvincias(departamentoId: string): Promise<ProvinciaDto[]> {
  const { data } = await apiClient.get<ProvinciaDto[]>(
    `/catalogos/departamentos/${departamentoId}/provincias`,
  )
  return data
}

export async function listarMunicipios(provinciaId: string): Promise<MunicipioDto[]> {
  const { data } = await apiClient.get<MunicipioDto[]>(
    `/catalogos/provincias/${provinciaId}/municipios`,
  )
  return data
}

export async function listarRazas(): Promise<RazaDto[]> {
  const { data } = await apiClient.get<RazaDto[]>('/catalogos/razas')
  return data
}

export async function listarProductosTratamiento(): Promise<ProductoTratamientoDto[]> {
  const { data } = await apiClient.get<ProductoTratamientoDto[]>(
    '/catalogos/productos-tratamiento',
  )
  return data
}
```

## 2. `src/types/dto.ts` — tipos nuevos + campos agregados

Agregar (nuevo bloque `// --- Catálogos (SIGA-BACKEND: CatalogosController.cs) ---`):

```typescript
export interface DepartamentoDto {
  id: string
  nombre: string
}

export interface ProvinciaDto {
  id: string
  nombre: string
  departamentoId: string
}

export interface MunicipioDto {
  id: string
  nombre: string
  provinciaId: string
}

export interface RazaDto {
  id: string
  nombre: string
}

export interface ProductoTratamientoDto {
  id: string
  nombre: string
}
```

Agregar campos al final de cada interface existente (no reordenar lo que ya está):

- `EstanciaDto`: + `departamentoId: string | null`, `provinciaId: string | null`, `municipioId: string | null`
- `CreateEstanciaDto`: + `departamentoId?: string | null`, `provinciaId?: string | null`, `municipioId?: string | null`
- `UpdateEstanciaDto`: + `departamentoId?: string | null`, `provinciaId?: string | null`, `municipioId?: string | null`
- `DetalleLoteGanadoDto`: + `razaId: string | null`
- `CreateDetalleLoteGanadoDto`: + `razaId?: string | null`
- `RegistroSanitarioDto`: + `productoTratamientoId: string | null`
- `CreateRegistroSanitarioDto`: + `productoTratamientoId?: string | null`

**Importante — `EstanciaDto` y `DetalleLoteGanadoDto` se usan en más lugares que solo la
respuesta HTTP real:** `src/services/invitadoApi.ts` (modo invitado/offline) fabrica
estos DTOs a mano con un objeto literal, sin pasar por el backend. Al agregar campos no
opcionales a esas dos interfaces, `vue-tsc -b` va a fallar ahí con "missing properties" —
es un error real, no un falso positivo. Arreglarlo en el mismo cambio (ver punto 5, ya
tiene la solución exacta).

## 3. `src/views/estancias/EstanciaFormView.vue` — selects en cascada

Estado actual: `form.departamento`/`form.provincia`/`form.municipio` son 3 `FormField` de
texto libre. Cambiar a selects en cascada. **`FormField.vue` no tiene prop `disabled` ni
usa `placeholder` en modo `select`** (verificado leyendo el componente) — no le pases esas
props, no hacen nada; la lista de opciones vacía ya evita que se pueda elegir sin el nivel
anterior.

```typescript
// imports nuevos
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue' // agregar nextTick, watch
import * as catalogosApi from '@/api/catalogos'
import type { DepartamentoDto, MunicipioDto, ProvinciaDto } from '@/types/dto'

// agregar al `form` reactive existente:
departamentoId: null as string | null,
provinciaId: null as string | null,
municipioId: null as string | null,

// nuevo, junto a la definición de `form`:
const departamentos = ref<DepartamentoDto[]>([])
const provincias = ref<ProvinciaDto[]>([])
const municipios = ref<MunicipioDto[]>([])

const departamentoOptions = computed(() =>
  departamentos.value.map((d) => ({ value: d.id, label: d.nombre })),
)
const provinciaOptions = computed(() =>
  provincias.value.map((p) => ({ value: p.id, label: p.nombre })),
)
const municipioOptions = computed(() =>
  municipios.value.map((m) => ({ value: m.id, label: m.nombre })),
)

// Bandera para no resetear provincia/municipio cuando cargarDetalle() setea los
// tres *Id de un registro existente (ver más abajo por qué hace falta nextTick).
let cargandoDetalleInicial = true

watch(
  () => form.departamentoId,
  async (departamentoId) => {
    if (!cargandoDetalleInicial) {
      form.provinciaId = null
      form.municipioId = null
      municipios.value = []
    }
    provincias.value = departamentoId ? await catalogosApi.listarProvincias(departamentoId) : []
  },
)

watch(
  () => form.provinciaId,
  async (provinciaId) => {
    if (!cargandoDetalleInicial) {
      form.municipioId = null
    }
    municipios.value = provinciaId ? await catalogosApi.listarMunicipios(provinciaId) : []
  },
)
```

**El problema real que encontré (y por qué hace falta `nextTick`):** en `cargarDetalle()`,
al editar una estancia existente, hay que setear `form.departamentoId`, `form.provinciaId`
y `form.municipioId` desde la respuesta del backend. Eso dispara los dos `watch()` de
arriba — pero como son asíncronos y Vue los corre en la cola de microtasks, si la función
sigue de largo sin ningún `await` y apaga `cargandoDetalleInicial = false` en el mismo
tick síncrono, **los watch terminan leyendo la bandera ya en `false`** y resetean a `null`
los valores que se acababan de cargar. La solución: `await nextTick()` justo después de
setear los tres `*Id`, antes de apagar la bandera:

```typescript
async function cargarDetalle() {
  departamentos.value = await catalogosApi.listarDepartamentos()

  if (!id.value) {
    cargandoDetalleInicial = false
    return
  }
  cargandoDetalle.value = true
  errorMensaje.value = null
  try {
    const e = await estanciasApi.obtener(id.value)
    // ... asignaciones existentes de form.nombre, form.propietario, etc. sin cambios ...
    form.departamento = e.departamento
    form.provincia = e.provincia
    form.municipio = e.municipio
    form.latitud = e.latitud
    form.longitud = e.longitud

    form.departamentoId = e.departamentoId
    form.provinciaId = e.provinciaId
    form.municipioId = e.municipioId
    await nextTick() // ← deja que los watch() de arriba arranquen antes de bajar la bandera
  } catch (error) {
    errorMensaje.value = error instanceof ApiError ? error.message : 'Ocurrió un error inesperado.'
  } finally {
    cargandoDetalle.value = false
    cargandoDetalleInicial = false
  }
}
```

En `guardar()`: agregar `departamentoId: form.departamentoId, provinciaId: form.provinciaId,
municipioId: form.municipioId` a los dos payloads (`actualizar` y `crear`), junto a los
campos legado que ya se mandan — no quitar esos.

En el template, reemplazar los 3 `FormField` de texto libre:

```html
<FormField v-model="form.departamentoId" type="select" label="Departamento" :options="departamentoOptions" />
<FormField v-model="form.provinciaId" type="select" label="Provincia" :options="provinciaOptions" />
<FormField v-model="form.municipioId" type="select" label="Municipio" :options="municipioOptions" />
```

## 4. `src/views/captaciones/CaptacionFormView.vue` — Raza reconciliada, no reemplazada

El `razaOptions` hardcodeado hoy tiene 7 valores (`Angus, Braford, Brahman, Brangus,
Criollo, Mocho, Nelore`). El catálogo `Razas` del backend hoy solo tiene 4
(`Nelore, Brangus, Brahman, Cruza Comercial`). **No reemplazar el select por el catálogo**
— haría desaparecer 3 opciones que el usuario puede elegir hoy. En su lugar: el select
sigue igual (mismas 7 opciones, sigue mandando el string en `raza`), pero se resuelve
`razaId` por nombre contra el catálogo cuando hay coincidencia:

```typescript
// imports nuevos
import * as catalogosApi from '@/api/catalogos'
import type { ..., RazaDto } from '@/types/dto' // agregar RazaDto al import existente

// junto a razaOptions:
const razasCatalogo = ref<RazaDto[]>([])

// en onMounted(), agregar (no reemplazar lo que ya hay):
catalogosApi.listarRazas().then((razas) => {
  razasCatalogo.value = razas
}).catch(() => {
  // No crítico: si falla, razaId simplemente queda null — raza (string) sigue igual.
})

// en agregarGrupo(), al construir el objeto que se pushea a grupos.value, agregar:
razaId: razasCatalogo.value.find((r) => r.nombre.toLowerCase() === detalle.raza?.toLowerCase())?.id ?? null,
```

## 5. `src/services/invitadoApi.ts` — fix obligatorio, no opcional

Sin esto, `npx vue-tsc -b` falla. `fabricarEstancia()` y `fabricarCaptacion()` arman los
DTOs a mano:

```typescript
// en fabricarEstancia(), agregar junto a departamento/provincia/municipio:
departamentoId: payload.departamentoId ?? null,
provinciaId: payload.provinciaId ?? null,
municipioId: payload.municipioId ?? null,

// en fabricarCaptacion(), dentro del .map() que arma cada detalle, agregar:
razaId: d.razaId ?? null,
```

## 6. Registro sanitario — sin cambios de UI

No existe ninguna vista que llame a `api/sanitario.ts` — el cliente API existe (`crear`,
`listarPorCaptacion`) pero ningún formulario lo usa todavía. Nada que modificar acá. Si
existe un formulario que no se encontró, avisar antes de tocar nada.

## 7. Verificación final (obligatoria antes de dar por terminado)

```bash
npm install   # si hace falta
npx vue-tsc -b
```

Debe terminar sin errores. Si aparece algún otro DTO fabricado a mano en otro archivo que
también rompa (no debería, pero confirmarlo), aplicar el mismo patrón del punto 5.

## 8. Fuera de alcance

- El fix de email (`Admin@Siga.com` = `admin@siga.com`) ya está aplicado en
  `SIGA-BACKEND` — no requiere ningún cambio acá.
- No crear pantallas de administración de catálogos (crear/editar departamentos, razas,
  etc.) — se siembran desde `DbInitializer.cs` del backend por ahora.
