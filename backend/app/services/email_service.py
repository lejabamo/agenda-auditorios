import logging
from flask_mail import Mail, Message
from flask import current_app

mail = Mail()
logger = logging.getLogger(__name__)


class EmailService:

    @staticmethod
    def send_solicitud_recibida(evento, destinatario):
        """Notifica al usuario que su solicitud fue recibida."""
        auditorio_nombre = evento.auditorio.nombre if evento.auditorio else 'No especificado'
        subject = f"Confirmación de Solicitud de Auditorio: {evento.titulo}"
        body = f"""Hola {evento.responsable_nombre},

Hemos recibido tu solicitud para el uso del auditorio "{auditorio_nombre}".

Detalles de la solicitud:
  - Evento:  {evento.titulo}
  - Fecha:   {evento.fecha_inicio.strftime('%d/%m/%Y')}
  - Jornada: {evento.jornada}
  - Estado:  Pendiente de revisión

Tu solicitud pasará por un proceso de revisión. Te notificaremos una vez sea aprobada o rechazada.

Atentamente,
Secretaría de Educación del Cauca — Sistema de Agenda de Auditorios
"""
        EmailService._send(subject, body, destinatario)

    @staticmethod
    def send_solicitud_aprobada(evento, destinatario):
        """Notifica al usuario que su solicitud fue aprobada."""
        auditorio_nombre = evento.auditorio.nombre if evento.auditorio else 'No especificado'
        subject = f"✅ Solicitud Aprobada — {evento.titulo}"
        body = f"""Hola {evento.responsable_nombre},

¡Buenas noticias! Tu solicitud para el uso del auditorio "{auditorio_nombre}" ha sido APROBADA.

Detalles aprobados:
  - Evento:  {evento.titulo}
  - Fecha:   {evento.fecha_inicio.strftime('%d/%m/%Y')}
  - Jornada: {evento.jornada}
  - Horario: {evento.fecha_inicio.strftime('%H:%M')} — {evento.fecha_fin.strftime('%H:%M')}

Observaciones del administrador: {evento.observacion or 'Ninguna'}

Atentamente,
Secretaría de Educación del Cauca — Sistema de Agenda de Auditorios
"""
        EmailService._send(subject, body, destinatario)

    @staticmethod
    def send_solicitud_rechazada(evento, destinatario):
        """Notifica al usuario que su solicitud fue rechazada."""
        auditorio_nombre = evento.auditorio.nombre if evento.auditorio else 'No especificado'
        subject = f"❌ Actualización de Solicitud — {evento.titulo}"
        body = f"""Hola {evento.responsable_nombre},

Te informamos que tu solicitud para el uso del auditorio "{auditorio_nombre}" ha sido RECHAZADA.

Motivo:        {evento.motivo_rechazo or 'No especificado'}
Observaciones: {evento.observacion or 'Sin detalles adicionales.'}

Si tienes alguna duda, puedes contactar con la administración de los auditorios.

Atentamente,
Secretaría de Educación del Cauca — Sistema de Agenda de Auditorios
"""
        EmailService._send(subject, body, destinatario)

    @staticmethod
    def send_solicitud_reagendada(evento, destinatario):
        """Notifica al usuario que se rechazó la solicitud pero se sugiere nueva fecha."""
        auditorio_nombre = evento.auditorio.nombre if evento.auditorio else 'No especificado'
        subject = f"📅 Fecha Alternativa Sugerida — {evento.titulo}"
        body = f"""Hola {evento.responsable_nombre},

Lamentablemente no podemos aprobar tu solicitud en el horario original para el auditorio "{auditorio_nombre}".

Sin embargo, el auditorio se encuentra disponible y te sugerimos la siguiente fecha alternativa:
  - Nueva Fecha:   {evento.fecha_inicio.strftime('%d/%m/%Y')}
  - Nueva Jornada: {evento.jornada}
  - Horario:       {evento.fecha_inicio.strftime('%H:%M')} — {evento.fecha_fin.strftime('%H:%M')}

Mensaje del Administrador: {evento.observacion or 'Te sugerimos radicar nuevamente tu solicitud en este horario.'}

Si estás de acuerdo, ingresa al sistema y crea una nueva solicitud en esa fecha.

Atentamente,
Secretaría de Educación del Cauca — Sistema de Agenda de Auditorios
"""
        EmailService._send(subject, body, destinatario)

    @staticmethod
    def send_solicitud_reagendada_aprobada(evento, destinatario):
        """Notifica al usuario que su solicitud fue aprobada con una nueva fecha."""
        auditorio_nombre = evento.auditorio.nombre if evento.auditorio else 'No especificado'
        subject = f"✅ Solicitud Aprobada (Nueva Fecha) — {evento.titulo}"
        body = f"""Hola {evento.responsable_nombre},

¡Buenas noticias! Tu solicitud para el uso del auditorio "{auditorio_nombre}" ha sido APROBADA y agendada exitosamente.

La administración ha reasignado tu reserva al siguiente horario:
  - Fecha Aprobada: {evento.fecha_inicio.strftime('%d/%m/%Y')}
  - Jornada:        {evento.jornada}
  - Horario:        {evento.fecha_inicio.strftime('%H:%M')} — {evento.fecha_fin.strftime('%H:%M')}

Mensaje del Administrador: {evento.observacion or 'Tu evento ha sido programado en este nuevo horario.'}

Si tienes algún inconveniente, por favor contacta a la administración de inmediato.

Atentamente,
Secretaría de Educación del Cauca — Sistema de Agenda de Auditorios
"""
        EmailService._send(subject, body, destinatario)

    @staticmethod
    def send_notificacion_soporte_tecnico(evento, email="serviciosinformaticos@cauca.gov.co"):
        """Notifica a soporte técnico cuando se aprueba un evento con requerimientos."""
        auditorio_nombre = evento.auditorio.nombre if evento.auditorio else 'No especificado'
        reqs = []
        if evento.requiere_microfono: reqs.append("  - Micrófono")
        if evento.requiere_videobeam: reqs.append("  - Videobeam / Proyector")
        if evento.requiere_sonido: reqs.append("  - Sonido Especial")
        if evento.requiere_asistencia_tecnica: reqs.append("  - Asistencia Técnica Presencial")

        subject = f"🔧 Requerimiento Técnico — Evento aprobado: {evento.titulo}"
        body = f"""Hola Equipo de Servicios Informáticos,

Se ha aprobado un evento que requiere apoyo técnico. Por favor gestionar oportunamente.

Detalles del Evento:
  - Nombre:    {evento.titulo}
  - Auditorio: {auditorio_nombre}
  - Fecha:     {evento.fecha_inicio.strftime('%d/%m/%Y')}
  - Horario:   {evento.fecha_inicio.strftime('%H:%M')} — {evento.fecha_fin.strftime('%H:%M')}

Responsable del Evento:
  - Nombre:    {evento.responsable_nombre}
  - Teléfono:  {evento.responsable_telefono}

Requerimientos Técnicos Solicitados:
{chr(10).join(reqs) if reqs else '  (Ninguno registrado)'}

Por favor confirmar la disponibilidad de los equipos con el responsable del evento.

Sistema de Agenda de Auditorios
Secretaría de Educación del Cauca
"""
        EmailService._send(subject, body, email)

    @staticmethod
    def send_nueva_solicitud_admin(evento, admin_email):
        """Notifica al administrador que hay una nueva solicitud pendiente."""
        auditorio_nombre = evento.auditorio.nombre if evento.auditorio else 'No especificado'
        subject = "📋 Nueva Solicitud de Auditorio Pendiente de Revisión"
        body = f"""Hola Administrador,

Se ha recibido una nueva solicitud de auditorio que requiere revisión.

Detalles:
  - Evento:      {evento.titulo}
  - Solicitante: {evento.responsable_nombre} ({evento.correo_confirmacion})
  - Auditorio:   {auditorio_nombre}
  - Fecha:       {evento.fecha_inicio.strftime('%d/%m/%Y')}
  - Jornada:     {evento.jornada}

Por favor ingresa al panel de administración para aprobarla o rechazarla.

Sistema de Agenda de Auditorios
Secretaría de Educación del Cauca
"""
        EmailService._send(subject, body, admin_email)

    @staticmethod
    def _send(subject: str, body: str, recipient: str):
        """
        Internal method to send a plain-text email via Flask-Mail.
        Errors are logged but never raise exceptions to avoid blocking the main flow.
        Compatible with Mailpit (dev) and any SMTP server (prod: Gmail, Exchange, etc.)
        """
        try:
            app = current_app._get_current_object()
            sender = app.config.get('MAIL_DEFAULT_SENDER', 'noreply@agenda.com')
            msg = Message(subject=subject, sender=sender, recipients=[recipient])
            msg.body = body
            mail.send(msg)
            logger.info("Email sent to %s — subject: %s", recipient, subject)
        except Exception as e:
            logger.error(
                "Failed to send email to %s (subject: %s): %s",
                recipient, subject, e
            )
            # Never block the main business flow if email fails
