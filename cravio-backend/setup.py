"""
Cravio first-time setup script.
Run once after cloning on a new machine:
  python setup.py

What it does:
  1. Runs migrations
  2. Creates essential accounts if they don't exist (never overwrites existing)
  3. Prints login credentials
"""
import os, subprocess, sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cravio.settings')
import django
django.setup()

# ── 1. Run migrations ─────────────────────────────────────────────
print("Running migrations...")
subprocess.run([sys.executable, 'manage.py', 'migrate'], check=True)

# ── 2. Create accounts (only if they don't already exist) ─────────
from users.models import User

def ensure_user(email, first_name, role, password, is_superuser=False):
    user, created = User.objects.get_or_create(
        email=email,
        defaults=dict(
            username=email,
            first_name=first_name,
            role=role,
            is_staff=is_superuser,
            is_superuser=is_superuser,
        )
    )
    if created:
        user.set_password(password)
        user.save()
        print(f"  Created : {email} ({role})")
    else:
        print(f"  Exists  : {email} ({role}) — skipped")
    return user

print("\nEnsuring accounts exist...")
ensure_user('admin@cravio.app',    'Admin',   'admin',    'admin123',    is_superuser=True)
ensure_user('owner1@cravio.app',   'Ravi',    'owner',    'owner123')
ensure_user('divya@gmail.com',     'Divya',   'customer', 'customer123')
ensure_user('rahul@gmail.com',     'Rahul',   'customer', 'customer123')
ensure_user('sneha@gmail.com',     'Sneha',   'customer', 'customer123')

print("\n[OK] Setup complete!")
print("\nTest accounts:")
print("  Admin    → admin@cravio.app    / admin123")
print("  Owner    → owner1@cravio.app   / owner123")
print("  Customer → divya@gmail.com     / customer123")
