from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List, Optional
from ..models.dependencia import Dependencia

class DependenciaService:
    def __init__(self, db: Session):
        self.db = db

    def create(self, data: dict) -> Dependencia:
        nueva_dependencia = Dependencia(
            nombre=data["nombre"],
            tipo=data["tipo"],
            sigla=data.get("sigla"),
            activa=data.get("activa", True)
        )
        self.db.add(nueva_dependencia)
        self.db.commit()
        self.db.refresh(nueva_dependencia)
        return nueva_dependencia

    def get_all(self) -> List[Dependencia]:
        # Standard: Use is_(True)
        stmt = select(Dependencia).where(Dependencia.activa.is_(True))
        result = self.db.execute(stmt)
        return list(result.scalars().all())

    def get_by_id(self, id: int) -> Optional[Dependencia]:
        # Standard: Use is_(True) and scalar_one_or_none
        stmt = select(Dependencia).where(
            Dependencia.id == id,
            Dependencia.activa.is_(True)
        )
        result = self.db.execute(stmt)
        return result.scalar_one_or_none()

    def update(self, id: int, data: dict) -> Optional[Dependencia]:
        dependencia = self.get_by_id(id)
        if not dependencia:
            return None
        
        # Standard: Explicit whitelist, no generic setattr
        allowed_fields = {'nombre', 'tipo', 'sigla', 'activa'}
        
        for field in allowed_fields:
            if field in data:
                setattr(dependencia, field, data[field])
        
        self.db.commit()
        self.db.refresh(dependencia)
        return dependencia

    def delete(self, id: int) -> bool:
        """Soft delete: set activa = False"""
        dependencia = self.get_by_id(id)
        if not dependencia:
            return False
        
        # Standard: Soft delete only
        dependencia.activa = False
        self.db.commit()
        return True
