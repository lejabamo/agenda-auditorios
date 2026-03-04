import os
from flask import Flask
from flask_mail import Mail, Message

app = Flask(__name__)
app.config['MAIL_SERVER'] = os.environ.get('MAIL_SERVER', 'smtp.gmail.com')
app.config['MAIL_PORT'] = int(os.environ.get('MAIL_PORT', 1025))
app.config['MAIL_USE_TLS'] = False
app.config['MAIL_USE_SSL'] = False
app.config['MAIL_USERNAME'] = ""
app.config['MAIL_PASSWORD'] = ""
app.config['MAIL_DEFAULT_SENDER'] = "sistema@agenda.local"

# Ensure debug info
app.config['MAIL_DEBUG'] = True

mail = Mail(app)

print("Attempting to send a test email...")
try:
    with app.app_context():
        msg = Message("Prueba de Correo Agenda Auditorios",
                      recipients=["leonardo.bastidas@cauca.gov.co"])
        msg.body = "Si recibes esto, la configuración de Flask-Mail con tu App Password de Gmail funciona correctamente."
        mail.send(msg)
    print("Email sent successfully!")
except Exception as e:
    print(f"Failed to send email: {e}")
