from sqlalchemy import String, Integer, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List
from datetime import datetime
from ..db import Base

class Evento(Base):
    __tablename__ = "eventos"

    id: Mapped[int] = mapped_column(primary_key=True)
    titulo: Mapped[str | None] = mapped_column(String(200), nullable=True)
    descripcion: Mapped[str | None] = mapped_column(Text)
    fecha_inicio: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    fecha_fin: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    jornada: Mapped[str] = mapped_column(String(20), nullable=False) # TODO_EL_DIA | MANANA | TARDE | PERSONALIZADO
    aforo_estimado: Mapped[int] = mapped_column(Integer, default=0)
    estado: Mapped[str] = mapped_column(
    String(20),
    default="PENDIENTE",
    nullable=False)  # PENDIENTE | BLOQUEO_TEMPORAL | APROBADO | RECHAZADO | CANCELADO
    requiere_microfono: Mapped[bool] = mapped_column(Boolean, default=False)
    requiere_videobeam: Mapped[bool] = mapped_column(Boolean, default=False)
    requiere_sonido: Mapped[bool] = mapped_column(Boolean, default=False)
    requiere_asistencia_tecnica: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    # Campos de contacto y solicitud (Fase 4)
    fecha_solicitud: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    horario_detalle: Mapped[str | None] = mapped_column(String(255))
    tipo_evento: Mapped[str | None] = mapped_column(String(100))
    responsable_nombre: Mapped[str | None] = mapped_column(String(150), nullable=True)
    responsable_cargo: Mapped[str | None] = mapped_column(String(150), nullable=True)
    responsable_telefono: Mapped[str | None] = mapped_column(String(50), nullable=True)
    correo_confirmacion: Mapped[str | None] = mapped_column(String(150), nullable=True)

    auditorio_id: Mapped[int] = mapped_column(ForeignKey("auditorios.id"))
    auditorio: Mapped["Auditorio"] = relationship(back_populates="eventos")

    dependencia_id: Mapped[int | None] = mapped_column(ForeignKey("dependencias.id"), nullable=True)
    dependencia: Mapped["Dependencia"] = relationship(back_populates="eventos")

    # B2: Admin Audit & Decision fields
    observacion: Mapped[str | None] = mapped_column(Text)
    motivo_rechazo: Mapped[str | None] = mapped_column(String(100))
    admin_id: Mapped[int | None] = mapped_column(Integer) # For future relation to AdminUser
    decision_at: Mapped[datetime | None] = mapped_column(DateTime)



    def __repr__(self) -> str:
        return f"<Evento(titulo='{self.titulo}', estado='{self.estado}')>"
