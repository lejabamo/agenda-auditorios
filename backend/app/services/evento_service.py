from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List, Optional
from datetime import datetime
import re
from ..models.evento import Evento
from ..models.bloqueo_auditorio import BloqueoAuditorio
from ..exceptions import AgendaConflictError, ValidationError

class EventoService:
    def __init__(self, db: Session):
        self.db = db

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

        # Validaciones de contacto (Fase 4)
        email = data.get("correo_confirmacion", "")
        if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
            raise ValidationError("Formato de correo electrónico inválido")

        telefono = data.get("responsable_telefono", "")
        if len(telefono) < 7:
             raise ValidationError("El teléfono debe tener al menos 7 caracteres")

        # Validar solapamiento: (StartA < EndB) and (EndA > StartB)
        # Estado IN ('PENDIENTE', 'APROBADO')
        # Regla de solapamiento:
        # nuevo_inicio < existente.fecha_fin AND nuevo_fin > existente.fecha_inicio
        stmt = select(Evento).where(
            Evento.auditorio_id == data["auditorio_id"],
            Evento.estado.in_(['PENDIENTE', 'APROBADO']),
            Evento.fecha_inicio < fecha_fin,
            Evento.fecha_fin > fecha_inicio
        )
        if self.db.execute(stmt).first() is not None:
             raise AgendaConflictError("El auditorio no está disponible en ese horario")

        # Validar bloqueos administrativos: (StartA < EndB) and (EndA > StartB)
        # Activo = True
        stmt_bloqueo = select(BloqueoAuditorio).where(
            BloqueoAuditorio.auditorio_id == data["auditorio_id"],
            BloqueoAuditorio.activo.is_(True),
            BloqueoAuditorio.fecha_inicio < fecha_fin,
            BloqueoAuditorio.fecha_fin > fecha_inicio
        )
        if self.db.execute(stmt_bloqueo).first() is not None:
             raise AgendaConflictError("El auditorio está bloqueado administrativamente en ese horario")

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
            dependencia_id=data["dependencia_id"],
            # Nuevos campos Fase 4
            # fecha_solicitud tiene default=now() en modelo, pero permitimos override si data lo trae?
            # El requerimiento dice default NOW. Dejemos que SQLA lo maneje si no viene.
            horario_detalle=data.get("horario_detalle"),
            responsable_nombre=data["responsable_nombre"],
            responsable_telefono=telefono,
            correo_confirmacion=email
        )
        self.db.add(nuevo_evento)
        self.db.commit()
        self.db.refresh(nuevo_evento)
        return nuevo_evento

    def get_all(self) -> List[Evento]:
        # Listar activos/no cancelados => estado != 'CANCELADO'
        stmt = select(Evento).where(Evento.estado != 'CANCELADO')
        result = self.db.execute(stmt)
        return list(result.scalars().all())

    def get_by_id(self, id: int) -> Optional[Evento]:
        stmt = select(Evento).where(
            Evento.id == id,
            Evento.estado != 'CANCELADO'
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
