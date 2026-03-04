from app.db import SessionLocal
from app.models.evento import Evento
from app.models.auditorio import Auditorio
from app.models.dependencia import Dependencia
from datetime import datetime, timedelta

def seed_events():
    session = SessionLocal()
    try:
        # Ensure we have dependencies and auditorium
        dep = session.query(Dependencia).first()
        aud = session.query(Auditorio).first()
        
        if not dep or not aud:
            print("ERROR: Need Auditorios and Dependencias seeded first.")
            return

        # Check if we already have pending events
        pending_count = session.query(Evento).filter_by(estado="PENDIENTE").count()
        if pending_count > 0:
            print(f"INFO: Found {pending_count} pending events. Skipping seed.")
            return

        print("Seeding pending events...")
        event1 = Evento(
            titulo="Conferencia de Tecnología",
            descripcion="Evento de prueba para validación de admin",
            fecha_inicio=datetime.now() + timedelta(days=5),
            fecha_fin=datetime.now() + timedelta(days=5, hours=4),
            auditorio_id=aud.id,
            dependencia_id=dep.id,
            jornada="MANANA",
            responsable_nombre="Juan Perez",
            correo_confirmacion="juan@test.com",
            responsable_telefono="555-0001",
            estado="PENDIENTE",
            aforo_estimado=100
        )
        
        event2 = Evento(
            titulo="Taller de Capacitación",
            descripcion="Capacitación anual para empleados",
            fecha_inicio=datetime.now() + timedelta(days=10),
            fecha_fin=datetime.now() + timedelta(days=10, hours=8),
            auditorio_id=aud.id,
            dependencia_id=dep.id,
            jornada="MANANA",
            responsable_nombre="Maria Garcia",
            correo_confirmacion="maria@test.com",
            responsable_telefono="555-0002",
            estado="PENDIENTE",
            aforo_estimado=50
        )

        session.add(event1)
        session.add(event2)
        session.commit()
        print("SUCCESS: Seeded 2 pending events.")

    except Exception as e:
        print(f"ERROR: Failed to seed events: {e}")
        session.rollback()
    finally:
        session.close()

if __name__ == "__main__":
    seed_events()
