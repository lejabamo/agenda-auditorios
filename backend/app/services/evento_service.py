import logging
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from typing import List, Optional
from datetime import datetime, timedelta, timezone
import re
from ..models.evento import Evento
from ..models.auditorio import Auditorio
from ..models.bloqueo_auditorio import BloqueoAuditorio
from ..models.dependencia import Dependencia
from ..exceptions import AgendaConflictError, ValidationError

logger = logging.getLogger(__name__)

class EventoService:
    def __init__(self, db: Session):
        self.db = db

    def _resolve_dependencia(self, identifier: any) -> int:
        """
        Helper to resolve dependency ID.
        If identifier is int or digit string -> returns int ID.
        If identifier is string -> finds by name or creates new Dependencia.
        """
        if isinstance(identifier, int):
            return identifier
        
        if isinstance(identifier, str) and identifier.isdigit():
            return int(identifier)
            
        if not identifier:
            return None

        # It's a string name, try to find existing
        stmt = select(Dependencia).where(Dependencia.nombre == str(identifier))
        existing = self.db.execute(stmt).scalar_one_or_none()

        if existing:
            return existing.id

        # Create new dependencia dynamically
        new_dep = Dependencia(
            nombre=str(identifier),
            tipo="EXTERNA",
            activa=True
        )
        self.db.add(new_dep)
        self.db.flush()
        return new_dep.id

    def create(self, data: dict) -> Evento:

        # Validar fechas
        fecha_inicio_str = data.get("fecha_inicio")
        fecha_fin_str = data.get("fecha_fin")

        if isinstance(fecha_inicio_str, str):
            fecha_inicio = datetime.fromisoformat(fecha_inicio_str)
        else:
            fecha_inicio = fecha_inicio_str

        if isinstance(fecha_fin_str, str):
            fecha_fin = datetime.fromisoformat(fecha_fin_str)
        else:
            fecha_fin = fecha_fin_str
        
        if fecha_inicio >= fecha_fin:
            raise ValidationError("La fecha de inicio debe ser anterior a la fecha de fin")

        # 0. Validar bloqueos administrativos (PRIORIDAD ALTA)
        # Activo = True. Regla: Overlap standard.
        stmt_bloqueo = select(BloqueoAuditorio).where(
            BloqueoAuditorio.auditorio_id == data["auditorio_id"],
            BloqueoAuditorio.activo.is_(True),
            BloqueoAuditorio.fecha_inicio < fecha_fin,
            BloqueoAuditorio.fecha_fin > fecha_inicio
        )
        if self.db.execute(stmt_bloqueo).first() is not None:
             raise AgendaConflictError("El auditorio no está disponible en la fecha seleccionada por bloqueo administrativo")

        # Business Rule: Same-day scheduling validation
        # Adjust for Colombia/UTC-5
        tz_col = timezone(timedelta(hours=-5))
        now = datetime.now()  # Use datetime.now() so tests can mock it
        now_local = now  # Treat local time as Colombia time for validation

        # Assume incoming naive time is local Colombia time (as parsed from slice)
        if fecha_inicio.tzinfo is None:
            fecha_start_local = fecha_inicio
        else:
            fecha_start_local = fecha_inicio.astimezone(tz_col).replace(tzinfo=None)
            fecha_inicio = fecha_start_local
            if getattr(fecha_fin, 'tzinfo', None):
                fecha_fin = fecha_fin.astimezone(tz_col).replace(tzinfo=None)

        if fecha_start_local.date() == now_local.date():
            current_hour = now_local.hour
            time_str = now_local.strftime("%H:%M")
            jornada = data.get("jornada")
            
            # 1. Strict cutoff at 17:00 (5 PM) for any request today
            if current_hour >= 17:
                raise ValidationError(f"No es posible programar eventos para hoy después de las 17:00 (hora actual: {time_str})")
            
            # 2. 'MAÑANA' window ends at 12:00
            if jornada == 'MAÑANA' and current_hour >= 12:
                raise ValidationError(f"No es posible programar la jornada MAÑANA porque la hora actual es {time_str}")
            
            # 3. 'TODO_EL_DIA' window ends at 13:00
            if jornada == 'TODO_EL_DIA' and current_hour >= 13:
                raise ValidationError(f"No es posible programar la jornada TODO_EL_DIA porque la hora actual es {time_str}")

        # Business Rule: Daily Agenda Closure (5 PM Rule for Tomorrow)
        # This is checked FIRST because it's a categorical block: after 17:00,
        # all requests for the next day are blocked regardless of 24h notice.
        tomorrow = now_local.date() + timedelta(days=1)
        if fecha_start_local.date() == tomorrow and now_local.hour >= 17:
             raise ValidationError("La agenda para el día siguiente se encuentra cerrada a partir de las 17:00. Las solicitudes deben realizarse con mínimo 24 horas de anticipación y antes de las 17:00.")

        # Business Rule: Minimum Advance Notice (24 hours)
        # Applies to all other cases not already blocked by the 5 PM closure rule.
        time_difference = fecha_start_local - now_local
        if time_difference < timedelta(hours=24):
             raise ValidationError("Las solicitudes deben realizarse con mínimo 24 horas de anticipación")


        # Validaciones de contacto (Fase 4)
        email = data.get("correo_confirmacion", "")
        if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
            raise ValidationError("Formato de correo electrónico inválido")

        telefono = data.get("responsable_telefono", "")
        if len(telefono) < 7:
             raise ValidationError("El teléfono debe tener al menos 7 caracteres")

        # Validar capacidad auditorio
        auditorio = self.db.execute(select(Auditorio).where(Auditorio.id == data["auditorio_id"])).scalar_one_or_none()
        if not auditorio:
             raise ValidationError("Auditorio no encontrado")
        
        aforo = int(data.get("aforo_estimado", 0))
        if aforo > auditorio.capacidad:
             raise ValidationError(f"El aforo ({aforo}) excede la capacidad del auditorio ({auditorio.capacidad})")

        # HOLD LOGIC: Check if promoting a hold
        hold_id = data.get('hold_id')
        evento_existente = None
        
        if hold_id:
            evento_existente = self.get_by_id(hold_id)
            if not evento_existente or evento_existente.estado not in ['BLOQUEO_TEMPORAL', 'PENDIENTE']:
                evento_existente = None
            else:
                logger.debug("Promoting hold %s to PENDIENTE", hold_id)

        # Validar solapamiento if NOT promoting a valid hold
        # If promoting, we technically overlap with OURSELVES, so skip check or exclude self
        stmt = select(Evento).where(
            Evento.auditorio_id == data["auditorio_id"],
            Evento.estado.in_(['PENDIENTE', 'APROBADO', 'BLOQUEO_TEMPORAL']),
            Evento.fecha_inicio < fecha_fin,
            Evento.fecha_fin > fecha_inicio
        )
        
        if evento_existente:
             stmt = stmt.where(Evento.id != evento_existente.id)

        if self.db.execute(stmt).first() is not None:
             raise AgendaConflictError("El auditorio no está disponible en ese horario")


        if evento_existente:
            # Update existing
            nuevo_evento = evento_existente
            nuevo_evento.titulo = data["titulo"]
            nuevo_evento.descripcion = data.get("descripcion")
            nuevo_evento.aforo_estimado = data.get("aforo_estimado", 0)
            nuevo_evento.estado = "PENDIENTE"
            nuevo_evento.requiere_microfono = data.get("requiere_microfono", False)
            nuevo_evento.requiere_videobeam = data.get("requiere_videobeam", False)
            nuevo_evento.requiere_sonido = data.get("requiere_sonido", False)
            nuevo_evento.requiere_asistencia_tecnica = data.get("requiere_asistencia_tecnica", False)
            nuevo_evento.dependencia_id = self._resolve_dependencia(data.get("dependencia_id"))
            nuevo_evento.horario_detalle = data.get("horario_detalle")
            nuevo_evento.responsable_nombre = data["responsable_nombre"]
            nuevo_evento.responsable_telefono = telefono
            nuevo_evento.correo_confirmacion = email
            # Dates/Auditorio are trusted from hold, or we could overwrite to ensure consistency
            # Let's overwrite to be safe in case wizard changed (though forbidden in frontend)
            nuevo_evento.fecha_inicio = fecha_inicio
            nuevo_evento.fecha_fin = fecha_fin
            
        else:
            # Create New
            nuevo_evento = Evento(
                titulo=data["titulo"],
                descripcion=data.get("descripcion"),
                fecha_inicio=fecha_inicio,
                fecha_fin=fecha_fin,
                jornada=data["jornada"],
                aforo_estimado=data.get("aforo_estimado", 0),
                estado="PENDIENTE", # Default
                requiere_microfono=data.get("requiere_microfono", False),
                requiere_videobeam=data.get("requiere_videobeam", False),
                requiere_sonido=data.get("requiere_sonido", False),
                requiere_asistencia_tecnica=data.get("requiere_asistencia_tecnica", False),
                auditorio_id=data["auditorio_id"],
                dependencia_id=self._resolve_dependencia(data.get("dependencia_id")),
                tipo_evento=data.get("tipo_evento"),
                # Nuevos campos Fase 4
                horario_detalle=data.get("horario_detalle"),
                responsable_nombre=data["responsable_nombre"],
                responsable_telefono=telefono,
                correo_confirmacion=email
            )
            self.db.add(nuevo_evento)
        
        self.db.flush()
        self.db.commit()
        self.db.refresh(nuevo_evento)
        
        # Send Email Notifications
        try:
            import os
            from .email_service import EmailService
            admin_email = os.environ.get("ADMIN_NOTIFICATION_EMAIL", "leonardo.bastidas@cauca.gov.co")
            EmailService.send_solicitud_recibida(nuevo_evento, email)
            EmailService.send_nueva_solicitud_admin(nuevo_evento, admin_email)
            
        except Exception as e:
            logger.error("Failed to send emails on event create: %s", e)
            
        return nuevo_evento

    def get_all(self, filters: dict = None) -> List[Evento]:
        stmt = select(Evento)

        if filters and filters.get('estado') in ['PENDIENTE', 'APROBADO', 'RECHAZADO', 'CANCELADO', 'BLOQUEO_TEMPORAL']:
             stmt = stmt.where(Evento.estado == filters.get('estado'))
        else:
             stmt = stmt.where(Evento.estado != 'CANCELADO') # Default: oculta cancelados

        if filters:

             # Safe conversion for auditorio_id
             auditorio_id = filters.get('auditorio_id')
             if auditorio_id and str(auditorio_id).isdigit():
                  stmt = stmt.where(Evento.auditorio_id == int(auditorio_id))
             
             # Safe check for fecha
             fecha = filters.get('fecha')
             if fecha and re.match(r"^\d{4}-\d{2}-\d{2}$", str(fecha)):
                  # func.date() works reliably only with valid format
                  stmt = stmt.where(func.date(Evento.fecha_inicio) == fecha)

        # Robust Sorting
        sort_by = filters.get('sort_by', 'fecha_solicitud') if filters else 'fecha_solicitud'
        order = filters.get('order', 'asc') if filters else 'asc'

        # Whitelist columns
        sort_column = Evento.fecha_solicitud # Default
        if sort_by == 'fecha_inicio':
            sort_column = Evento.fecha_inicio
        elif sort_by == 'id':
            sort_column = Evento.id
        
        # Apply Order
        if order == 'desc':
            stmt = stmt.order_by(sort_column.desc())
        else:
            stmt = stmt.order_by(sort_column.asc())
        
        result = self.db.execute(stmt)
        return list(result.scalars().all())

    def get_by_id(self, id: int) -> Optional[Evento]:
        stmt = select(Evento).where(
            Evento.id == id
        )
        result = self.db.execute(stmt)
        return result.scalar_one_or_none()

    def cancel(self, id: int) -> bool:
        """Cambiar estado a CANCELADO (soft delete)"""
        evento = self.get_by_id(id)
        if not evento:
            return False
        
        # Standard constraint: whitelist update only logic here simply sets the status
        evento.estado = 'CANCELADO'
        self.db.commit()
        return True

    def update_status(self, evento_id: int, nuevo_estado: str, observacion: str = None, motivo_rechazo: str = None, admin_id: int = None, nueva_fecha_inicio=None, nueva_fecha_fin=None, nueva_jornada: str = None) -> Evento:
        if nuevo_estado not in ['PENDIENTE', 'APROBADO', 'RECHAZADO', 'CANCELADO']:
            raise ValidationError("Estado inválido")

        # B2: Mandatory Rejection Reason
        if nuevo_estado == 'RECHAZADO':
            if not motivo_rechazo:
                 raise ValidationError("Debe seleccionar un motivo de rechazo.")

        evento = self.get_by_id(evento_id)
        if not evento:
            return None
            
        evento.estado = nuevo_estado
        
        # Handle Rescheduling
        reagendado = False
        if (nueva_fecha_inicio and nueva_fecha_fin and nueva_jornada):
             # Validate new overlap
             stmt = select(Evento).where(
                 Evento.auditorio_id == evento.auditorio_id,
                 Evento.estado.in_(['PENDIENTE', 'APROBADO', 'BLOQUEO_TEMPORAL']),
                 Evento.fecha_inicio < nueva_fecha_fin,
                 Evento.fecha_fin > nueva_fecha_inicio,
                 Evento.id != evento.id
             )
             if self.db.execute(stmt).first() is not None:
                 raise AgendaConflictError("El auditorio no está disponible en el nuevo horario sugerido.")
             
             evento.fecha_inicio = nueva_fecha_inicio
             evento.fecha_fin = nueva_fecha_fin
             evento.jornada = nueva_jornada
             reagendado = True
        
        # Audit Trail
        evento.observacion = observacion
        evento.motivo_rechazo = motivo_rechazo
        evento.decision_at = datetime.utcnow()
        if admin_id:
            evento.admin_id = admin_id
            
        # B3: Audit Log
        from ..models.historial_evento import HistorialEvento
        nuevo_historial = HistorialEvento(
            evento_id=evento.id,
            accion=nuevo_estado,
            admin_id=admin_id,
            observacion=observacion,
            motivo=motivo_rechazo,
            fecha=datetime.utcnow()
        )
        self.db.add(nuevo_historial)

        try:
            self.db.commit()
            self.db.refresh(evento)
            
            # Send Notification Emails
            try:
                from .email_service import EmailService
                if nuevo_estado == 'APROBADO':
                    if evento.correo_confirmacion:
                        if reagendado:
                             EmailService.send_solicitud_reagendada_aprobada(evento, evento.correo_confirmacion)
                        else:
                             EmailService.send_solicitud_aprobada(evento, evento.correo_confirmacion)
                    
                    # Soporte Técnico Email (Fase 4 - Auto)
                    if evento.requiere_microfono or evento.requiere_videobeam or evento.requiere_sonido or evento.requiere_asistencia_tecnica:
                         EmailService.send_notificacion_soporte_tecnico(evento)
                         
                elif nuevo_estado == 'RECHAZADO':
                    if evento.correo_confirmacion:
                        if reagendado:
                            EmailService.send_solicitud_reagendada(evento, evento.correo_confirmacion)
                        else:
                            EmailService.send_solicitud_rechazada(evento, evento.correo_confirmacion)
            except Exception as e:
                logger.error("Failed to send email on status update: %s", e)
                
            return evento
        except Exception as e:
            self.db.rollback()
            raise e

    def create_admin_direct(self, data: dict) -> Evento:
        """
        Admin creates an event directly as APROBADO.
        Bypasses user-facing time restrictions (same-day, 24h notice, etc).
        Sends notification emails to user, admin, and support (if technical reqs).
        """
        import os
        from ..models.historial_evento import HistorialEvento

        fecha_inicio_str = data.get("fecha_inicio")
        fecha_fin_str = data.get("fecha_fin")

        fecha_inicio = datetime.fromisoformat(fecha_inicio_str) if isinstance(fecha_inicio_str, str) else fecha_inicio_str
        fecha_fin = datetime.fromisoformat(fecha_fin_str) if isinstance(fecha_fin_str, str) else fecha_fin_str

        if fecha_inicio >= fecha_fin:
            raise ValidationError("La fecha de inicio debe ser anterior a la fecha de fin")

        # Validate auditorio exists
        auditorio = self.db.execute(select(Auditorio).where(Auditorio.id == data["auditorio_id"])).scalar_one_or_none()
        if not auditorio:
            raise ValidationError("Auditorio no encontrado")

        # Validate overlap
        stmt = select(Evento).where(
            Evento.auditorio_id == data["auditorio_id"],
            Evento.estado.in_(['PENDIENTE', 'APROBADO', 'BLOQUEO_TEMPORAL']),
            Evento.fecha_inicio < fecha_fin,
            Evento.fecha_fin > fecha_inicio
        )
        if self.db.execute(stmt).first() is not None:
            raise AgendaConflictError("El auditorio no está disponible en ese horario")

        # Validate email format
        email = data.get("correo_confirmacion", "")
        if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
            raise ValidationError("Formato de correo electrónico inválido")

        telefono = data.get("responsable_telefono", "")
        if len(str(telefono)) < 7:
            raise ValidationError("El teléfono debe tener al menos 7 caracteres")

        admin_id = data.get("admin_id")

        nuevo_evento = Evento(
            titulo=data["titulo"],
            descripcion=data.get("descripcion"),
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin,
            jornada=data["jornada"],
            aforo_estimado=data.get("aforo_estimado", 0),
            estado="APROBADO",
            requiere_microfono=data.get("requiere_microfono", False),
            requiere_videobeam=data.get("requiere_videobeam", False),
            requiere_sonido=data.get("requiere_sonido", False),
            requiere_asistencia_tecnica=data.get("requiere_asistencia_tecnica", False),
            auditorio_id=data["auditorio_id"],
            dependencia_id=self._resolve_dependencia(data.get("dependencia_id")),
            tipo_evento=data.get("tipo_evento"),
            horario_detalle=data.get("horario_detalle"),
            responsable_nombre=data["responsable_nombre"],
            responsable_telefono=telefono,
            correo_confirmacion=email,
            decision_at=datetime.utcnow(),
            admin_id=admin_id
        )
        self.db.add(nuevo_evento)
        self.db.flush()

        # Audit trail
        historial = HistorialEvento(
            evento_id=nuevo_evento.id,
            accion="APROBADO",
            admin_id=admin_id,
            observacion="Evento creado directamente por administrador",
            motivo=None,
            fecha=datetime.utcnow()
        )
        self.db.add(historial)
        self.db.commit()
        self.db.refresh(nuevo_evento)

        # Send notification emails
        try:
            from .email_service import EmailService
            admin_email = os.environ.get("ADMIN_NOTIFICATION_EMAIL", "leonardo.bastidas@cauca.gov.co")
            # 1. Notify the event responsible
            EmailService.send_solicitud_aprobada(nuevo_evento, email)
            # 2. Notify admin (confirmation of action taken)
            EmailService.send_nueva_solicitud_admin(nuevo_evento, admin_email)
            # 3. Notify technical support if needed
            if (nuevo_evento.requiere_microfono or nuevo_evento.requiere_videobeam
                    or nuevo_evento.requiere_sonido or nuevo_evento.requiere_asistencia_tecnica):
                EmailService.send_notificacion_soporte_tecnico(nuevo_evento)
        except Exception as e:
            logger.error("Failed to send emails on admin direct create: %s", e)

        return nuevo_evento

    def create_hold(self, data: dict) -> Evento:
        """Create a temporary hold (BLOQUEO_TEMPORAL) for 10 minutes"""
        fecha_str = data.get("fecha")
        jornada = data.get("jornada")
        auditorio_id = data.get("auditorio_id")
        hora_inicio_str = data.get("hora_inicio")
        hora_fin_str = data.get("hora_fin")

        try:
            if not all([fecha_str, jornada, auditorio_id]):
                raise ValidationError("Datos incompletos para bloqueo")

            fecha = datetime.strptime(fecha_str, "%Y-%m-%d")

            start_hour, end_hour = 8, 18
            start_minute, end_minute = 0, 0

            # Prioritize exact times if provided (e.g. from the custom calendar interaction)
            if hora_inicio_str and hora_fin_str:
                sh, sm = map(int, hora_inicio_str.split(':'))
                eh, em = map(int, hora_fin_str.split(':'))
                start_hour, start_minute = sh, sm
                end_hour, end_minute = eh, em
            else:
                if jornada == 'MAÑANA':
                    start_hour, end_hour = 8, 12
                elif jornada == 'TARDE':
                    start_hour, end_hour = 14, 18

            fecha_inicio = fecha.replace(hour=start_hour, minute=start_minute, second=0)
            fecha_fin = fecha.replace(hour=end_hour, minute=end_minute, second=0)

            stmt = select(Evento).where(
                Evento.auditorio_id == auditorio_id,
                Evento.estado.in_(['PENDIENTE', 'APROBADO', 'BLOQUEO_TEMPORAL']),
                Evento.fecha_inicio < fecha_fin,
                Evento.fecha_fin > fecha_inicio
            )
            existing = self.db.execute(stmt).first()
            if existing:
                raise AgendaConflictError("El espacio ya está seleccionado o reservado")

            hold = Evento(
                titulo="Reserva Temporal",
                fecha_inicio=fecha_inicio,
                fecha_fin=fecha_fin,
                jornada=jornada,
                auditorio_id=auditorio_id,
                estado="BLOQUEO_TEMPORAL",
                responsable_nombre="Usuario Temporal",
                fecha_solicitud=datetime.utcnow(),
            )

            self.db.add(hold)
            self.db.flush()
            self.db.commit()
            self.db.refresh(hold)
            logger.debug("Temporary hold created with ID %s", hold.id)
            return hold

        except Exception as e:
            self.db.rollback()
            logger.error("Error creating hold: %s", e, exc_info=True)
            raise e

