import click
from flask.cli import with_appcontext
from sqlalchemy import select
from ..db import SessionLocal
from ..models.admin_user import AdminUser

@click.command("create-admin")
@with_appcontext
def create_admin_command():
    """Create a new admin user interactively."""
    click.echo("Bootstrapping Admin User...")
    
    email = click.prompt("Enter admin email", type=str)
    
    # Check if user already exists
    session = SessionLocal()
    try:
        stmt = select(AdminUser).where(AdminUser.email == email)
        existing = session.execute(stmt).scalar_one_or_none()
        
        if existing:
            click.echo(f"Warning: Admin user '{email}' already exists.")
            return

        password = click.prompt("Enter admin password", hide_input=True, confirmation_prompt=True)
        
        new_admin = AdminUser(email=email)
        new_admin.set_password(password)
        
        session.add(new_admin)
        session.commit()
        click.echo(f"Success: Admin user '{email}' created.")
        
    except Exception as e:
        click.echo(f"Error: {e}")
        session.rollback()
    finally:
        session.close()
