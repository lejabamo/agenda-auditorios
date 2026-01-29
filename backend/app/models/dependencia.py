from sqlalchemy import String, Integer, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List
from ..db import Base

class Dependencia(Base):
    __tablename__ = "dependencias"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(150), nullable=False)
    tipo: Mapped[str] = mapped_column(String(50), nullable=False) # OFICINA | ENTIDAD | DESPACHO
    sigla: Mapped[str | None] = mapped_column(String(20))
    activa: Mapped[bool] = mapped_column(Boolean, default=True)

    eventos: Mapped[List["Evento"]] = relationship(back_populates="dependencia")

    def __repr__(self) -> str:
        return f"<Dependencia(nombre='{self.nombre}', tipo='{self.tipo}')>"
