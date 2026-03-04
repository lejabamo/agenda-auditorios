from app.db import SessionLocal
from app.models.admin_user import AdminUser

session = SessionLocal()
admins = session.query(AdminUser).all()
print("ADMIN USERS:")
for a in admins:
    print(f"ID: {a.id} | Email: {a.email} | Active: {a.is_active}")
session.close()
