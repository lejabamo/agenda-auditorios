from sqlalchemy import String, Integer, Boolean, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List
from ..db import Base

class Auditorio(Base):
    __tablename__ = "auditorios"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    ubicacion: Mapped[str | None] = mapped_column(String(200))
    capacidad: Mapped[int] = mapped_column(Integer, default=0)
    descripcion: Mapped[str | None] = mapped_column(Text)
    activo: Mapped[bool] = mapped_column(Boolean, default=True)

    eventos: Mapped[List["Evento"]] = relationship(back_populates="auditorio")

    def __repr__(self) -> str:
        return f"<Auditorio(nombre='{self.nombre}', capacidad={self.capacidad})>"
