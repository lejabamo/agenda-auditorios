from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List, Optional
from ..models.auditorio import Auditorio

class AuditorioService:
    def __init__(self, db: Session):
        self.db = db

    def create(self, data: dict) -> Auditorio:
        nuevo_auditorio = Auditorio(
            nombre=data["nombre"],
            ubicacion=data.get("ubicacion"),
            capacidad=data.get("capacidad", 0),
            descripcion=data.get("descripcion"),
            activo=data.get("activo", True)
        )
        self.db.add(nuevo_auditorio)
        self.db.commit()
        self.db.refresh(nuevo_auditorio)
        return nuevo_auditorio

    def get_all(self) -> List[Auditorio]:
        # Standard: Use is_(True)
        stmt = select(Auditorio).where(Auditorio.activo.is_(True))
        result = self.db.execute(stmt)
        return list(result.scalars().all())

    def get_by_id(self, id: int) -> Optional[Auditorio]:
        # Standard: Use is_(True) and scalar_one_or_none
        stmt = select(Auditorio).where(
            Auditorio.id == id,
            Auditorio.activo.is_(True)
        )
        result = self.db.execute(stmt)
        return result.scalar_one_or_none()

    def update(self, id: int, data: dict) -> Optional[Auditorio]:
        auditorio = self.get_by_id(id)
        if not auditorio:
            return None
        
        # Standard: Explicit whitelist, no generic setattr
        allowed_fields = {'nombre', 'ubicacion', 'capacidad', 'descripcion', 'activo'}
        
        for field in allowed_fields:
            if field in data:
                setattr(auditorio, field, data[field])
        
        self.db.commit()
        self.db.refresh(auditorio)
        return auditorio

    def delete(self, id: int) -> bool:
        """Soft delete: set activo = False"""
        auditorio = self.get_by_id(id)
        if not auditorio:
            return False
        
        # Standard: Soft delete only
        auditorio.activo = False
        self.db.commit()
        return True
