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
@click.command("reset-admin-password")
@with_appcontext
def reset_admin_password_command():
    """Reset the password for an existing admin user."""
    click.echo("Resetting Admin Password...")
    
    email = click.prompt("Enter admin email", type=str)
    
    session = SessionLocal()
    try:
        stmt = select(AdminUser).where(AdminUser.email == email)
        admin = session.execute(stmt).scalar_one_or_none()
        
        if not admin:
            click.echo(f"Error: Admin user '{email}' does not exist.")
            return

        password = click.prompt("Enter NEW password", hide_input=True, confirmation_prompt=True)
        
        admin.set_password(password)
        session.commit()
        click.echo(f"Success: Password for '{email}' has been updated.")
        
    except Exception as e:
        click.echo(f"Error: {e}")
        session.rollback()
    finally:
        session.close()
