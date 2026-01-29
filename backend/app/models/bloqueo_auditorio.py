from sqlalchemy import String, Integer, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from ..db import Base

class BloqueoAuditorio(Base):
    __tablename__ = "bloqueos_auditorio"

    id: Mapped[int] = mapped_column(primary_key=True)
    auditorio_id: Mapped[int] = mapped_column(ForeignKey("auditorios.id"), nullable=False)
    fecha_inicio: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    fecha_fin: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    motivo: Mapped[str] = mapped_column(String(200), nullable=False)
    activo: Mapped[bool] = mapped_column(Boolean, default=True)

    # Relación opcional para facilitar consultas futuras
    auditorio: Mapped["Auditorio"] = relationship()

    def __repr__(self) -> str:
        return f"<BloqueoAuditorio(id={self.id}, motivo='{self.motivo}')>"
