from app.db import SessionLocal
from app.models.admin_user import AdminUser

def seed_admin():
    session = SessionLocal()
    try:
        if session.query(AdminUser).count() == 0:
            print("Seeding admin user...")
            admin = AdminUser(email="admin@example.com", is_active=True)
            admin.set_password("admin123")
            session.add(admin)
            session.commit()
            print("SUCCESS: Created admin user 'admin@example.com' with password 'admin123'.")
        else:
            print("INFO: Admin user already exists.")
    except Exception as e:
        print(f"ERROR: Failed to seed admin: {e}")
        session.rollback()
    finally:
        session.close()

if __name__ == "__main__":
    seed_admin()
