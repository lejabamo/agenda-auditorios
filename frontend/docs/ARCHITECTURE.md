# Arquitectura Frontend & UX - Agenda de Auditorios

## 1. Estrategia de Layouts (Shells)

Para separar contextos y mantener el código limpio, utilizaremos 3 layouts base:

### A. PublicLayout (Solicitantes)
*Enfoque: Simplicidad, Carga rápida, Mobile-first.*
- **Header:** Logo institucional, Botón "Estado de mi solicitud".
- **Main:** Contenido centrado, ancho limitado (max-w-prose) para lectura fácil.
- **Footer:** Información de contacto y legales.
- **Micro-interacciones:** Feedback inmediato al validar pasos.

### B. AdminLayout (Gestores)
*Enfoque: Densidad de información, Productividad.*
- **Sidebar:** Navegación (Calendario, Solicitudes, Entidades, Configuración).
- **Navbar:** Usuario actual, Selector de Tema, Notificaciones.
- **Main:** Fluid container. Padding ajustado para maximizar espacio de tablas/calendarios.

### C. AuthLayout
- Pantalla dividida (Imagen institucional / Formulario de acceso).
- Solo para login administrativo.

---

## 2. Estructura de Rutas

```typescript
/                  -> Landing (Buscador de disponibilidad rápida)
/solicitar         -> Wizard de Solicitud (Multi-step form)
/seguimiento/:id   -> Vista de estado (Read-only) para el solicitante

/admin             -> Login
/admin/dashboard   -> Métricas del día (Eventos hoy, Pendientes)
/admin/calendario  -> Vista principal de gestión (Drag & drop)
/admin/solicitudes -> Lista (Kanban o Tabla) de peticiones
/admin/entidades   -> CRUD de Entidades y Contactos
/admin/auditorios  -> Configuración de salas (Capacidad, Recursos)
```

---

## 3. Flujo UX: "Solicitud Guiada" (The Wizard)

El núcleo del sistema para el ciudadano/funcionario. Evitamos el "Muro de Texto".

### Estados del Wizard:
1. **Selección de Entidad (Identity First)**
   - *UI:* Un `Combobox` (Input con autocompletado).
   - *Lógica:* El usuario escribe "Ministerio...". El sistema busca en BD.
   - *Caso Existe:* Selecciona, muestra badge "Entidad Verificada".
   - *Caso Nuevo:* Botón "¿No aparece?" -> Abre modal pequeño para registrar nombre y RUC/Sigla. **Crucial:** No permite escribir libremente en el input principal.
   - *Validación:* ID de Entidad requerido para avanzar.

2. **Selección de Espacio y Tiempo (Resource Allocation)**
   - *UI:* Split View. Izquierda: Filtros (Capacidad, Fecha). Derecha: Tarjetas de Auditorios disponibles.
   - *Interacción:* Al seleccionar auditorio, muestra slots de horario disponibles para esa fecha.
   - *Mobile:* Acordeón (Primero Fecha -> Luego Lista de Auditorios).

3. **Detalle del Evento (Context)**
   - *Campos:* Título, Tipo (Capacitación, Reunión, Ceremonia), Descripción breve.
   - *Recursos:* Checkbox list (Proyector, Sonido, Streaming).

4. **Responsable (Contact Person)**
   - *Concepto:* La Entidad solicita, pero una Persona responde.
   - *UI:* Formulario simple (Nombre, Cargo, Email, Teléfono).
   - *Autocomplete:* Si el usuario ya ha solicitado antes (detectado por email o localStorage), pre-llenar.

5. **Resumen y Confirmación**
   - Vista de lectura ("Ticket").
   - Requiere captcha o validación simple.
   - *Acción:* "Enviar Solicitud". Genera código de seguimiento.

---

## 4. Decisiones Técnicas Clave

1.  **React Hook Form + Zod**:
    - Manejo de formularios complejos sin re-renders innecesarios.
    - Validación estricta con esquemas Zod compartibles (si se movieran a un paquete shared).

2.  **TanStack Query (React Query)**:
    - Imprescindible para el autocompletado de Entidades y chequeo de disponibilidad en tiempo real.
    - Manejo automático de estados `isLoading`, `isError`.

3.  **Componentes Atómicos**:
    - `StatusBadge`: Componente visual crítico para diferenciar estados (Pendiente, Aprobado, Rechazado).
    - `AvailabilityCalendar`: Componente complejo aislado.

4.  **Mobile First**:
    - Las tablas de administración colapsan a "Cards" en móvil.
    - El calendario cambia de "Mes/Semana" a "Agenda (Lista)" en pantallas < 768px.
