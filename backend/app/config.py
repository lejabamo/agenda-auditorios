import os

class Config:
    DB_USER = os.getenv('DB_USER', 'agenda_user')
    DB_PASSWORD = os.getenv('DB_PASSWORD', 'agenda_pass')
    DB_HOST = os.getenv('DB_HOST', 'localhost')
    DB_PORT = os.getenv('DB_PORT', '5432')
    DB_NAME = os.getenv('DB_NAME', 'agenda_db')

    # Construct standard PostgreSQL connection string
    SQLALCHEMY_DATABASE_URI = (
        f"postgresql+psycopg2://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    )
