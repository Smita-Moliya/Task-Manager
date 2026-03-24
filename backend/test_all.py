import os, sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
import django
django.setup()

import jwt
from django.conf import settings
from django.test import Client
from django.urls import get_resolver
from api.db import users_db

try:
    users = users_db.list_users_page(10, 0, "ADMIN")
    if not users:
        print("NO ADMIN USERS FOUND")
        sys.exit(0)
    admin_id = users[0][0]
    admin_email = users[0][2]
except Exception as e:
    print("FAILED TO FETCH ADMIN USER:", e)
    sys.exit(1)

print("Using Admin ID:", admin_id, "Email:", admin_email)

token = jwt.encode(
    {"user_id": admin_id, "type": "access"},
    settings.JWT_SECRET,
    algorithm=settings.JWT_ALG
)

def get_all_urls(urllist, prefix=''):
    paths = []
    for entry in urllist:
        if hasattr(entry, 'url_patterns'):
            paths.extend(get_all_urls(entry.url_patterns, prefix + str(entry.pattern)))
        else:
            paths.append(prefix + str(entry.pattern))
    return paths

urls = get_all_urls(get_resolver().url_patterns)
api_urls = [u for u in urls if u.startswith('api/') and '<' not in u]

c = Client()
print(f"Testing {len(api_urls)} endpoints...")
has_errors = False

for url in api_urls:
    full_url = '/' + url
    if 'export' in full_url: continue
    
    try:
        r = c.get(full_url, HTTP_AUTHORIZATION=f"Bearer {token}")
        if r.status_code >= 500:
            print(f"ERROR {r.status_code} at {full_url}")
            has_errors = True
    except Exception as e:
        print(f"EXCEPTION at {full_url}: {str(e)}")
        has_errors = True
        
if not has_errors:
    print("ALL LIST ENDPOINTS PASSED WITHOUT 500 ERRORS.")
