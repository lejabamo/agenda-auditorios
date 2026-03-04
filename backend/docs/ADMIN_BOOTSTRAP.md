# Admin Bootstrap Documentation

## Overview
This document describes how to safely create the initial administrator for the Auditorium Scheduling System. 
There is **NO public registration endpoint**. The simplified CLI tool is the only supported method.

## Safety Features
- **Hidden Input**: Passwords are entered securely via hidden prompt.
- **Idempotency**: Checks if the user already exists before attempting creation.
- **Security**: Uses PBKDF2/Scrypt hashing via `werkzeug.security`.

## How to Create the First Admin

Run the following command from the `backend/` directory:

```bash
flask create-admin
```

### Interactive Example:
```text
$ flask create-admin
Bootstrapping Admin User...
Enter admin email: admin@example.com
Warning: Admin user 'admin@example.com' already exists.
```

### Non-Interactive (CI/CD/Scripting)
You can pipe inputs if necessary, though manual execution is preferred for security.

## Configuration
- **Database**: Uses the connection string defined in `backend/app/db.py`.
- **Hashing**: Auto-configured by `werkzeug.security`.

## Troubleshooting
- **Command not found**: Ensure you are in the `backend/` directory and your virtual environment is active.
- **Micro-migration**: If the table `admin_users` does not exist, run `python -m alembic upgrade head` first.
