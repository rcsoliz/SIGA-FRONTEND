<script setup lang="ts">
// Sistema de íconos único de la app: reemplaza la fuente de íconos "Material
// Symbols Outlined" (ligaduras de texto, sección "robotic/generic" señalada
// en la revisión de diseño) por trazos SVG reales de Lucide — mismo peso 2px
// de trazo que ya usaban los botones/inputs secundarios de AgroField
// Precision, así que el cambio de sistema de íconos no rompe el lenguaje
// visual existente. Las claves del mapa son los mismos nombres semánticos que
// ya usaba el resto de la app (ver src/config/bitacoras.ts, AppShell.vue,
// etc.) para no tener que tocar ningún dato de ícono fuera de este archivo.
import { computed } from 'vue'
import {
  ArrowLeft,
  Baby,
  Beef,
  Bell,
  Building2,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleAlert,
  CircleCheck,
  CirclePlus,
  ClipboardCheck,
  ClipboardList,
  Eye,
  EyeOff,
  Fence,
  FileClock,
  History,
  Info,
  LandPlot,
  LayoutDashboard,
  Layers,
  Lock,
  LocateFixed,
  LogIn,
  LogOut,
  Mail,
  Map,
  Mars,
  MapPin,
  Moon,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Scale,
  Search,
  SearchX,
  ShieldCheck,
  Smartphone,
  Sprout,
  Sun,
  Syringe,
  Trash2,
  TrendingUp,
  TriangleAlert,
  Trophy,
  Truck,
  Users,
  UserPlus,
  UserRound,
  UserRoundX,
  Venus,
  Warehouse,
  X,
} from '@lucide/vue'

const ICONOS = {
  add: Plus,
  add_circle: CirclePlus,
  // Marca de SIGA (logo): un glifo de ganado, no el genérico LandPlot que ya
  // usa el ítem de navegación "Estancia" (home_work) — evita que el logo y
  // un ítem de nav cualquiera compartan el mismo trazo.
  agriculture: Beef,
  arrow_back: ArrowLeft,
  assignment: ClipboardList,
  calendar_month: CalendarDays,
  check: Check,
  check_circle: CircleCheck,
  child_care: Baby,
  chevron_left: ChevronLeft,
  chevron_right: ChevronRight,
  close: X,
  cruelty_free: Beef,
  dark_mode: Moon,
  dataset: Layers,
  delete: Trash2,
  edit: Pencil,
  error: CircleAlert,
  expand_less: ChevronUp,
  expand_more: ChevronDown,
  fact_check: ClipboardCheck,
  female: Venus,
  fence: Fence,
  grass: Sprout,
  group: Users,
  group_off: UserRoundX,
  history: History,
  history_toggle_off: FileClock,
  home_work: LandPlot,
  info: Info,
  insights: TrendingUp,
  leaderboard: Trophy,
  light_mode: Sun,
  local_shipping: Truck,
  location_city: Building2,
  location_on: MapPin,
  lock: Lock,
  login: LogIn,
  logout: LogOut,
  mail: Mail,
  male: Mars,
  map: Map,
  monitoring: LayoutDashboard,
  more_horiz: MoreHorizontal,
  my_location: LocateFixed,
  notifications: Bell,
  // Cabezas de ganado (métrica): mismo glifo que la marca — ambos significan
  // "ganado", nunca un ícono de mascota.
  pets: Beef,
  person: UserRound,
  person_add: UserPlus,
  save: Save,
  scale: Scale,
  search: Search,
  search_off: SearchX,
  smartphone: Smartphone,
  sync: RefreshCw,
  task_alt: CheckCheck,
  vaccines: Syringe,
  verified_user: ShieldCheck,
  visibility: Eye,
  visibility_off: EyeOff,
  warehouse: Warehouse,
  warning: TriangleAlert,
} as const

export type NombreIcono = keyof typeof ICONOS

const props = withDefaults(defineProps<{ name: NombreIcono; size?: number; strokeWidth?: number }>(), {
  size: 20,
  strokeWidth: 2,
})

const componente = computed(() => ICONOS[props.name])
</script>

<template>
  <component :is="componente" :size="size" :stroke-width="strokeWidth" />
</template>
