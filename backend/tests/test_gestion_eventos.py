"""
=============================================================================
TEST SUITE — Gestión de Eventos: Casos de la sesión de trabajo
=============================================================================
Usa PostgreSQL real (db_session de conftest.py) con rollback por test.
Migración aplicada: b1c2d3e4f5a6 (observacion, motivo_rechazo, admin_id, decision_at)

  TC-01  Cancelar un evento APROBADO — slot queda libre
  TC-02  Reagendar RECHAZADO sugiriendo nueva fecha
  TC-03  Reagendar RECHAZADO aprobando en nueva fecha (Asignar Nueva Fecha)
  TC-04  Slot original libre tras reagendamiento
  TC-05  Reagendar a horario ocupado — debe lanzar conflicto
  TC-06  Reserva Temporal sin correo — update_status no explota
  TC-07  Admin crea evento directo como APROBADO (Pelea de Gallos / urgencia)
  TC-08  Admin crea sobre slot ocupado — debe rechazarse con conflicto
  TC-09  Rechazar sin motivo_rechazo — debe lanzar ValidationError
  TC-10a Historial registrado tras reagendamiento
  TC-10b Historial registrado tras creación admin directa
=============================================================================
"""

import pytest
from datetime import datetime, timedelta
from unittest.mock import patch

from app.models.evento import Evento
from app.models.auditorio import Auditorio
from app.models.dependencia import Dependencia
from app.models.historial_evento import HistorialEvento
from app.services.evento_service import EventoService
from app.exceptions import AgendaConflictError, ValidationError


@pytest.fixture(scope="session", autouse=True)
def _init_app(test_app):
    """
    Ensures create_app() runs before any test, registering all SQLAlchemy
    relationships (including AdminUser) in the mapper registry.
    """
    pass  # test_app fixture from conftest.py already calls create_app()


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _future(days=10, hour=8):
    return (datetime.now() + timedelta(days=days)).replace(
        hour=hour, minute=0, second=0, microsecond=0
    )


def _make_auditorio(db, nombre="Auditorio Test Suite"):
    a = Auditorio(nombre=nombre, ubicacion="Piso Test", capacidad=100, activo=True)
    db.add(a)
    db.flush()
    return a


def _make_dependencia(db, nombre="Servicios Informáticos"):
    d = Dependencia(nombre=nombre, tipo="INTERNA", activa=True)
    db.add(d)
    db.flush()
    return d


def _make_evento(db, auditorio_id, inicio, fin,
                 jornada="MAÑANA", estado="APROBADO",
                 titulo="Evento Test", email="test@cauca.gov.co",
                 dependencia_id=None):
    if dependencia_id is None:
        dep = _make_dependencia(db, f"Dep-{titulo[:10]}")
        dependencia_id = dep.id
    e = Evento(
        titulo=titulo,
        fecha_inicio=inicio,
        fecha_fin=fin,
        jornada=jornada,
        fecha_solicitud=datetime.utcnow(),
        auditorio_id=auditorio_id,
        dependencia_id=dependencia_id,
        estado=estado,
        responsable_nombre="Responsable Test",
        responsable_telefono="3001234567",
        correo_confirmacion=email,
        aforo_estimado=30,
    )
    db.add(e)
    db.flush()
    return e


# ─────────────────────────────────────────────────────────────────────────────
# TC-01 — Cancelar un evento APROBADO: slot queda libre
# ─────────────────────────────────────────────────────────────────────────────

def test_TC01_cancelar_evento_aprobado(db_session):
    """Cancelar un APROBADO → estado=CANCELADO, slot libre para nuevas reservas."""
    aud = _make_auditorio(db_session)
    inicio = _future(days=10, hour=8)
    fin    = _future(days=10, hour=12)
    evento = _make_evento(db_session, aud.id, inicio, fin, estado="APROBADO")

    svc = EventoService(db_session)
    result = svc.cancel(evento.id)
    assert result is True

    db_session.refresh(evento)
    assert evento.estado == "CANCELADO"

    ocupado = db_session.query(Evento).filter(
        Evento.auditorio_id == aud.id,
        Evento.estado.in_(["PENDIENTE", "APROBADO", "BLOQUEO_TEMPORAL"]),
        Evento.fecha_inicio < fin,
        Evento.fecha_fin > inicio,
    ).first()
    assert ocupado is None, "El slot debe estar libre tras la cancelación"


# ─────────────────────────────────────────────────────────────────────────────
# TC-02 — Rechazar + sugerir nueva fecha (Reagendar)
# ─────────────────────────────────────────────────────────────────────────────

def test_TC02_rechazar_y_sugerir_nueva_fecha(db_session):
    """Admin rechaza una solicitud PENDIENTE sugeriendo nueva fecha. Queda RECHAZADO."""
    aud = _make_auditorio(db_session)
    evento = _make_evento(db_session, aud.id,
                          _future(days=5, hour=8), _future(days=5, hour=12),
                          jornada="MAÑANA", estado="PENDIENTE")
    nueva_i = _future(days=15, hour=8)
    nueva_f = _future(days=15, hour=12)

    svc = EventoService(db_session)
    with patch("app.services.email_service.EmailService.send_solicitud_reagendada"), \
         patch("app.services.email_service.EmailService.send_nueva_solicitud_admin"):
        result = svc.update_status(
            evento.id, "RECHAZADO",
            observacion="Horario ocupado por evento prioritario",
            motivo_rechazo="Conflicto de agenda (Superposición de evento)",
            nueva_fecha_inicio=nueva_i, nueva_fecha_fin=nueva_f, nueva_jornada="MAÑANA",
        )

    assert result is not None
    db_session.refresh(evento)
    assert evento.estado == "RECHAZADO"
    assert evento.fecha_inicio.date() == nueva_i.date(), "Debe guardar la nueva fecha sugerida"
    assert evento.motivo_rechazo is not None


# ─────────────────────────────────────────────────────────────────────────────
# TC-03 — Aprobar en nueva fecha (Asignar Nueva Fecha)
# ─────────────────────────────────────────────────────────────────────────────

def test_TC03_asignar_nueva_fecha_y_aprobar(db_session):
    """Admin aprueba una solicitud RECHAZADA reasignándola a nueva fecha."""
    aud = _make_auditorio(db_session)
    evento = _make_evento(db_session, aud.id,
                          _future(days=3, hour=8), _future(days=3, hour=12),
                          jornada="MAÑANA", estado="RECHAZADO",
                          titulo="Reserva Temporal")
    evento.motivo_rechazo = "Ocupación de Espacio"
    db_session.flush()

    nueva_i = _future(days=20, hour=8)
    nueva_f = _future(days=20, hour=12)

    svc = EventoService(db_session)
    with patch("app.services.email_service.EmailService.send_solicitud_reagendada_aprobada"), \
         patch("app.services.email_service.EmailService.send_nueva_solicitud_admin"):
        result = svc.update_status(
            evento.id, "APROBADO",
            observacion="Reasignado a fecha acordada",
            nueva_fecha_inicio=nueva_i, nueva_fecha_fin=nueva_f, nueva_jornada="MAÑANA",
        )

    assert result is not None
    db_session.refresh(evento)
    assert evento.estado == "APROBADO"
    assert evento.fecha_inicio.date() == nueva_i.date()
    assert evento.fecha_fin.hour == 12


# ─────────────────────────────────────────────────────────────────────────────
# TC-04 — Slot original libre tras el reagendamiento
# ─────────────────────────────────────────────────────────────────────────────

def test_TC04_slot_original_libre_tras_reagendamiento(db_session):
    """
    Tras reagendar (viernes 6 → miércoles 18), el slot del viernes 6 debe
    quedar disponible para otra reserva.
    """
    aud = _make_auditorio(db_session)
    inicio_orig = _future(days=7, hour=8)
    fin_orig    = _future(days=7, hour=12)
    evento = _make_evento(db_session, aud.id, inicio_orig, fin_orig,
                          jornada="MAÑANA", estado="APROBADO", titulo="Refrigerio")

    nueva_i = _future(days=21, hour=8)
    nueva_f = _future(days=21, hour=12)

    svc = EventoService(db_session)
    with patch("app.services.email_service.EmailService.send_solicitud_reagendada_aprobada"), \
         patch("app.services.email_service.EmailService.send_nueva_solicitud_admin"):
        svc.update_status(evento.id, "APROBADO",
                          nueva_fecha_inicio=nueva_i, nueva_fecha_fin=nueva_f,
                          nueva_jornada="MAÑANA")

    ocupado_orig = db_session.query(Evento).filter(
        Evento.auditorio_id == aud.id,
        Evento.estado.in_(["PENDIENTE", "APROBADO", "BLOQUEO_TEMPORAL"]),
        Evento.fecha_inicio < fin_orig,
        Evento.fecha_fin > inicio_orig,
    ).first()
    assert ocupado_orig is None, "El slot original debe estar libre"

    db_session.refresh(evento)
    assert evento.fecha_inicio.date() == nueva_i.date()


# ─────────────────────────────────────────────────────────────────────────────
# TC-05 — Reagendar a horario ocupado: conflicto
# ─────────────────────────────────────────────────────────────────────────────

def test_TC05_reagendar_sobre_slot_ocupado_falla(db_session):
    """Reagendar a un slot ya ocupado debe lanzar AgendaConflictError."""
    aud = _make_auditorio(db_session)
    inicio_bloq = _future(days=25, hour=8)
    fin_bloq    = _future(days=25, hour=12)
    _make_evento(db_session, aud.id, inicio_bloq, fin_bloq,
                 estado="APROBADO", titulo="Bloqueador")

    evento = _make_evento(db_session, aud.id,
                          _future(days=12, hour=8), _future(days=12, hour=12),
                          estado="PENDIENTE", titulo="A Reagendar")

    svc = EventoService(db_session)
    with pytest.raises(AgendaConflictError, match="disponible"):
        svc.update_status(evento.id, "APROBADO",
                          nueva_fecha_inicio=inicio_bloq, nueva_fecha_fin=fin_bloq,
                          nueva_jornada="MAÑANA")


# ─────────────────────────────────────────────────────────────────────────────
# TC-06 — Reserva Temporal sin correo no explota
# ─────────────────────────────────────────────────────────────────────────────

def test_TC06_hold_sin_correo_no_explota(db_session):
    """
    Un BLOQUEO_TEMPORAL sin correo_confirmacion puede recibir update_status
    sin lanzar excepción en el envío de email.
    Reproduce el bug de la Reserva Temporal del 4 de marzo.
    """
    aud = _make_auditorio(db_session)
    dep = _make_dependencia(db_session, "Dep-Hold")
    hold = Evento(
        titulo="Reserva Temporal",
        fecha_inicio=_future(days=8, hour=8),
        fecha_fin=_future(days=8, hour=18),
        jornada="TODO_EL_DIA",
        fecha_solicitud=datetime.utcnow(),
        auditorio_id=aud.id,
        dependencia_id=dep.id,
        estado="BLOQUEO_TEMPORAL",
        responsable_nombre="Temporal",
        responsable_telefono=None,
        correo_confirmacion=None,   # Sin correo — caso real
    )
    db_session.add(hold)
    db_session.flush()

    svc = EventoService(db_session)
    result = svc.update_status(hold.id, "RECHAZADO",
                               motivo_rechazo="Bloqueo Expirado / Liberado")
    assert result is not None
    db_session.refresh(hold)
    assert hold.estado == "RECHAZADO"


# ─────────────────────────────────────────────────────────────────────────────
# TC-07 — Admin crea evento directo (Pelea de Gallos / Urgencia)
# ─────────────────────────────────────────────────────────────────────────────

def test_TC07_admin_crea_directo_pelea_de_gallos(db_session):
    """
    Admin crea 'Pelea de Gallos' (Servicios Informáticos) directamente aprobado.
    Verifica: estado=APROBADO, decision_at registrado, 3 correos enviados.
    """
    aud = _make_auditorio(db_session)
    dep = _make_dependencia(db_session)
    inicio = _future(days=3, hour=8)
    fin    = _future(days=3, hour=12)

    data = {
        "titulo":               "Pelea de Gallos",
        "descripcion":          "Organizado por Servicios Informáticos",
        "fecha_inicio":         inicio.isoformat(),
        "fecha_fin":            fin.isoformat(),
        "jornada":              "MAÑANA",
        "auditorio_id":         aud.id,
        "dependencia_id":       dep.id,
        "responsable_nombre":   "Leonardo Bastidas",
        "responsable_telefono": "3101234567",
        "correo_confirmacion":  "lbastidas@cauca.gov.co",
        "aforo_estimado":       80,
        "requiere_microfono":   True,
        "admin_id":             None,
    }

    email_calls = []
    with patch("app.services.email_service.EmailService.send_solicitud_aprobada",
               side_effect=lambda e, r: email_calls.append(("aprobada", r))), \
         patch("app.services.email_service.EmailService.send_nueva_solicitud_admin",
               side_effect=lambda e, r: email_calls.append(("admin",    r))), \
         patch("app.services.email_service.EmailService.send_notificacion_soporte_tecnico",
               side_effect=lambda e:    email_calls.append(("soporte",  None))):

        svc = EventoService(db_session)
        evento = svc.create_admin_direct(data)

    assert evento.estado == "APROBADO"
    assert evento.titulo == "Pelea de Gallos"
    assert evento.requiere_microfono is True
    assert evento.decision_at is not None

    tipos = [t for t, _ in email_calls]
    assert "aprobada" in tipos, "Debe notificar al responsable del evento"
    assert "admin"    in tipos, "Debe notificar al administrador"
    assert "soporte"  in tipos, "Debe notificar a soporte técnico (requiere micrófono)"


# ─────────────────────────────────────────────────────────────────────────────
# TC-08 — Admin crea sobre slot ocupado: conflicto
# ─────────────────────────────────────────────────────────────────────────────

def test_TC08_admin_directo_sobre_slot_ocupado_falla(db_session):
    """create_admin_direct sobre slot APROBADO debe lanzar AgendaConflictError."""
    aud = _make_auditorio(db_session)
    inicio = _future(days=4, hour=8)
    fin    = _future(days=4, hour=12)
    _make_evento(db_session, aud.id, inicio, fin, estado="APROBADO",
                 titulo="Evento Refrigerio")

    data = {
        "titulo":               "Sobreescritura Urgente",
        "fecha_inicio":         inicio.isoformat(),
        "fecha_fin":            fin.isoformat(),
        "jornada":              "MAÑANA",
        "auditorio_id":         aud.id,
        "responsable_nombre":   "Admin Test",
        "responsable_telefono": "3001234567",
        "correo_confirmacion":  "admin@cauca.gov.co",
        "admin_id":             None,
    }

    svc = EventoService(db_session)
    with pytest.raises(AgendaConflictError, match="disponible"):
        svc.create_admin_direct(data)


# ─────────────────────────────────────────────────────────────────────────────
# TC-09 — Rechazar sin motivo lanza ValidationError
# ─────────────────────────────────────────────────────────────────────────────

def test_TC09_rechazar_sin_motivo_falla(db_session):
    """update_status con RECHAZADO sin motivo_rechazo debe lanzar ValidationError
    antes de tocar la BD (validación pura de servicio)."""
    aud = _make_auditorio(db_session)
    evento = _make_evento(db_session, aud.id,
                          _future(days=6, hour=14), _future(days=6, hour=18),
                          jornada="TARDE", estado="PENDIENTE")
    # Commit para que otro estado no interfiera con la validación
    db_session.flush()

    svc = EventoService(db_session)
    raised = False
    try:
        svc.update_status(evento.id, "RECHAZADO")  # Sin motivo_rechazo
    except ValidationError as exc:
        raised = True
        assert "motivo" in str(exc).lower()
    assert raised, "Debe lanzar ValidationError por falta de motivo_rechazo"


# ─────────────────────────────────────────────────────────────────────────────
# TC-10a — Historial registrado tras reagendamiento
# ─────────────────────────────────────────────────────────────────────────────

def test_TC10a_historial_reagendamiento(db_session):
    """update_status debe crear un registro en HistorialEvento."""
    aud = _make_auditorio(db_session)
    evento = _make_evento(db_session, aud.id,
                          _future(days=9, hour=8), _future(days=9, hour=12),
                          jornada="MAÑANA", estado="PENDIENTE")

    svc = EventoService(db_session)
    with patch("app.services.email_service.EmailService.send_solicitud_reagendada"), \
         patch("app.services.email_service.EmailService.send_nueva_solicitud_admin"):
        svc.update_status(
            evento.id, "RECHAZADO",
            motivo_rechazo="Conflicto de agenda (Superposición de evento)",
            observacion="Reagendado por urgencia",
            nueva_fecha_inicio=_future(days=30, hour=8),
            nueva_fecha_fin=_future(days=30, hour=12),
            nueva_jornada="MAÑANA",
        )

    historial = db_session.query(HistorialEvento).filter(
        HistorialEvento.evento_id == evento.id
    ).all()
    assert len(historial) >= 1
    assert any(h.accion == "RECHAZADO" for h in historial)


# ─────────────────────────────────────────────────────────────────────────────
# TC-10b — Historial registrado tras creación admin directa
# ─────────────────────────────────────────────────────────────────────────────

def test_TC10b_historial_admin_directo(db_session):
    """create_admin_direct debe crear historial con accion=APROBADO.
    admin_id=None para evitar FK sobre admin_users (nullable en el modelo).
    """
    aud = _make_auditorio(db_session)
    dep = _make_dependencia(db_session, "Dep-Urgente")
    data = {
        "titulo":               "Evento Urgente de Prueba",
        "fecha_inicio":         _future(days=11, hour=8).isoformat(),
        "fecha_fin":            _future(days=11, hour=18).isoformat(),
        "jornada":              "TODO_EL_DIA",
        "auditorio_id":         aud.id,
        "dependencia_id":       dep.id,
        "responsable_nombre":   "Admin Urgente",
        "responsable_telefono": "3009876543",
        "correo_confirmacion":  "admin_urgente@cauca.gov.co",
        "admin_id":             None,   # Nullable — sin FK a admin_users en prueba
    }

    with patch("app.services.email_service.EmailService.send_solicitud_aprobada"), \
         patch("app.services.email_service.EmailService.send_nueva_solicitud_admin"):
        svc = EventoService(db_session)
        evento = svc.create_admin_direct(data)

    historial = db_session.query(HistorialEvento).filter(
        HistorialEvento.evento_id == evento.id
    ).all()
    assert len(historial) >= 1
    assert any(h.accion == "APROBADO" for h in historial), \
        "Debe registrar accion=APROBADO en el historial"

