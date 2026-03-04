from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.sql import func
from ..db import Base
from datetime import datetime

class HistorialEvento(Base):
    __tablename__ = "historial_eventos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    evento_id: Mapped[int] = mapped_column(Integer, ForeignKey("eventos.id"), nullable=False)
    accion: Mapped[str] = mapped_column(String(50), nullable=False) # APROBADO, RECHAZADO, MODIFICADO
    admin_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("admin_users.id"))
    fecha: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    observacion: Mapped[str | None] = mapped_column(Text)
    motivo: Mapped[str | None] = mapped_column(String(100))

    # Relations
    evento = relationship("Evento")
    admin = relationship("AdminUser")

    def to_dict(self):
        return {
            "id": self.id,
            "evento_id": self.evento_id,
            "accion": self.accion,
            "admin_email": self.admin.email if self.admin else "Sistema/Desconocido",
            "fecha": self.fecha.isoformat(),
            "observacion": self.observacion,
            "motivo": self.motivo
        }
