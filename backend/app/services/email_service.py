from flask_mail import Mail, Message
from flask import current_app

mail = Mail()

class EmailService:
    @staticmethod
    def send_solicitud_recibida(evento, destinatario):
        """Notifica al usuario que su solicitud fue recibida."""
        subject = f"Confirmación de Solicitud de Auditorio: {evento.titulo}"
        auditorio_nombre = evento.auditorio.nombre if evento.auditorio else 'No especificado'
        body = f"""
    Hola {evento.responsable_nombre},
    
    Hemos recibido tu solicitud para el uso del auditorio "{auditorio_nombre}".
    
    Detalles de la solicitud:
    - Evento: {evento.titulo}
    - Fecha: {evento.fecha_inicio.strftime('%Y-%m-%d')}
    - Jornada: {evento.jornada}
    - Estado Actual: {evento.estado}
    
    Tu solicitud pasará por un proceso de revisión. Te notificaremos una vez sea aprobada o rechazada.
    
    Atentamente,
    Equipo de Agenda de Auditorios
    """
        EmailService.send_email(subject, body, destinatario)

    @staticmethod
    def send_solicitud_aprobada(evento, destinatario):
        """Notifica al usuario que su solicitud fue aprobada."""
        subject = f"Solicitud Aprobada - Auditorio: {evento.titulo}"
        auditorio_nombre = evento.auditorio.nombre if evento.auditorio else 'No especificado'
        body = f"""
    Hola {evento.responsable_nombre},
    
    ¡Buenas noticias! Tu solicitud para el uso del auditorio "{auditorio_nombre}" ha sido APROBADA.
    
    Detalles aprobados:
    - Evento: {evento.titulo}
    - Fecha: {evento.fecha_inicio.strftime('%Y-%m-%d')}
    - Jornada: {evento.jornada}
    
    Observaciones del administrador (si las hay): {evento.observacion or 'Ninguna'}
    
    Atentamente,
    Equipo de Agenda de Auditorios
    """
        EmailService.send_email(subject, body, destinatario)
        
    @staticmethod
    def send_solicitud_rechazada(evento, destinatario):
        """Notifica al usuario que su solicitud fue rechazada."""
        subject = f"Actualización de Solicitud - Auditorio: {evento.titulo}"
        auditorio_nombre = evento.auditorio.nombre if evento.auditorio else 'No especificado'
        body = f"""
    Hola {evento.responsable_nombre},
    
    Te informamos que tu solicitud para el uso del auditorio "{auditorio_nombre}" ha sido RECHAZADA.
    
    Motivo: {evento.motivo_rechazo or 'No especificado'}
    Observaciones: {evento.observacion or 'No hay detalles adicionales.'}
    
    Si tienes alguna duda, puedes contactar con la administración de los auditorios.
    
    Atentamente,
    Equipo de Agenda de Auditorios
    """
        EmailService.send_email(subject, body, destinatario)

    @staticmethod
    def send_solicitud_reagendada(evento, destinatario):
        """Notifica al usuario que su solicitud original no pudo ser aprobada, pero se le sugiere una nueva fecha."""
        subject = f"Alternativa Sugerida - Auditorio: {evento.titulo}"
        auditorio_nombre = evento.auditorio.nombre if evento.auditorio else 'No especificado'
        body = f"""
    Hola {evento.responsable_nombre},
    
    Te informamos que lamentablemente no podemos aprobar tu solicitud en el horario original para el auditorio "{auditorio_nombre}".
    
    Sin embargo, el espacio se encuentra libre y te sugerimos la siguiente fecha alternativa:
    - Nueva Fecha Sugerida: {evento.fecha_inicio.strftime('%Y-%m-%d')}
    - Nueva Jornada: {evento.jornada}
    - Horario: {evento.fecha_inicio.strftime('%H:%M')} a {evento.fecha_fin.strftime('%H:%M')}
    
    Mensaje del Administrador: {evento.observacion or 'Te sugerimos radicar nuevamente la solicitud usando este horario en el que el auditorio está disponible.'}
    
    Si estás de acuerdo con esta nueva fecha, por favor ingresa nuevamente al sistema y realiza una nueva solicitud seleccionando este horario.
    
    Atentamente,
    Equipo de Agenda de Auditorios
    """
        EmailService.send_email(subject, body, destinatario)

    @staticmethod
    def send_solicitud_reagendada_aprobada(evento, destinatario):
        """Notifica al usuario que su solicitud fue aprobada, pero reasignada directamente a una nueva fecha."""
        subject = f"Solicitud Aprobada (Reasignada) - Auditorio: {evento.titulo}"
        auditorio_nombre = evento.auditorio.nombre if evento.auditorio else 'No especificado'
        body = f"""
    Hola {evento.responsable_nombre},
    
    ¡Buenas noticias! Tu solicitud para el uso del auditorio "{auditorio_nombre}" ha sido APROBADA y agendada exitosamente.
    
    Por favor nota que la administración ha reasignado tu reserva a la siguiente fecha/horario, como pudo haber sido acordado previamente:
    - Fecha Aprobada: {evento.fecha_inicio.strftime('%Y-%m-%d')}
    - Jornada: {evento.jornada}
    - Horario: {evento.fecha_inicio.strftime('%H:%M')} a {evento.fecha_fin.strftime('%H:%M')}
    
    Mensaje del Administrador: {evento.observacion or 'Tu evento ha sido programado en este nuevo horario.'}
    
    Si tienes algún inconveniente con esta nueva configuración, por favor contacta a la administración de inmediato.
    
    Atentamente,
    Equipo de Agenda de Auditorios
    """
        EmailService.send_email(subject, body, destinatario)

    @staticmethod
    def send_notificacion_soporte_tecnico(evento, email="serviciosinformaticos@cauca.gov.co"):
        """Notifica automáticamente a soporte técnico cuando se aprueba un evento con requerimientos."""
        subject = f"Requerimiento Técnico para Evento: {evento.titulo}"
        auditorio_nombre = evento.auditorio.nombre if evento.auditorio else 'No especificado'
        
        reqs = []
        if evento.requiere_microfono: reqs.append("- Micrófono")
        if evento.requiere_videobeam: reqs.append("- Videobeam")
        if evento.requiere_sonido: reqs.append("- Sonido Especial")
        if evento.requiere_asistencia_tecnica: reqs.append("- Asistencia Técnica Presencial")
        
        body = f"""
    Hola Equipo de Servicios Informáticos,
    
    Se ha aprobado un nuevo evento que requiere de su apoyo técnico.
    
    Detalles del Evento:
    - Evento: {evento.titulo}
    - Auditorio: {auditorio_nombre}
    - Fecha: {evento.fecha_inicio.strftime('%Y-%m-%d')}
    - Horario: {evento.fecha_inicio.strftime('%H:%M')} a {evento.fecha_fin.strftime('%H:%M')}
    
    Responsable del Evento:
    - Nombre: {evento.responsable_nombre}
    - Teléfono: {evento.responsable_telefono}
    
    Requerimientos Solicitados:
    {chr(10).join(reqs)}
    
    Por favor gestionar la asignación de los equipos solicitados para este espacio.
    
    Sistema de Agenda de Auditorios
    """
        EmailService.send_email(subject, body, email)

    @staticmethod
    def send_nueva_solicitud_admin(evento, admin_email):
        """Notifica al administrador que hay una nueva solicitud pendiente de revisión."""
        subject = "Nueva Solicitud de Auditorio Pendiente"
        auditorio_nombre = evento.auditorio.nombre if evento.auditorio else 'No especificado'
        body = f"""
    Hola Administrador,
    
    Se ha recibido una nueva solicitud de auditorio que requiere revisión.
    
    Detalles:
    - Evento: {evento.titulo}
    - Solicitante: {evento.responsable_nombre} ({evento.correo_confirmacion})
    - Auditorio Solicitado: {auditorio_nombre}
    - Fecha: {evento.fecha_inicio.strftime('%Y-%m-%d')}
    - Jornada: {evento.jornada}
    
    Por favor ingresa al panel de administración para revisarla.
    
    Sistema de Agenda de Auditorios
    """
        EmailService.send_email(subject, body, admin_email)


    @staticmethod
    def send_email(subject, body, recipient):
        try:
            # Capturamos la app actual antes de iniciar el hilo de envío o si estamos fuera de contexto estricto
            app = current_app._get_current_object()
            msg = Message(subject,
                        sender=app.config.get('MAIL_DEFAULT_SENDER', 'noreply@agenda.com'),
                        recipients=[recipient])
            msg.body = body
            
            # Send message using mail object bound to the app
            mail.send(msg)
            app.logger.info("Correo '%s' enviado a %s", subject, recipient)
        except Exception as e:
            app = current_app._get_current_object()
            app.logger.error("Error al enviar correo a %s: %s", recipient, e)
            # No bloqueamos el proceso principal si falla el correo
            pass
