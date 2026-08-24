import os, django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cravio.settings')
django.setup()

from restaurants.models import Restaurant

IMAGES = {
    'The Spice Room': 'https://images.unsplash.com/photo-1585938338392-50a59970d2ee?w=800&q=80',
    'Café Willow': 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80',
    'Mumbai Darbar': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
    'Pav Bhaji Palace': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80',
    'Dilli Haat Kitchen': 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&q=80',
    'Old Delhi Biryani': 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80',
    'Murugan Idli Shop': 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&q=80',
    'The Marina Seafood': 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=800&q=80',
    'Paradise Biryani': 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=800&q=80',
    'Chutneys Hyderabad': 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=800&q=80',
    'Arsalan Kolkata': 'http://localhost:8000/media/restaurants/arsalan_kolkata.png',
    'Oh! Calcutta': 'https://images.unsplash.com/photo-1625944525533-473f1a3d54e7?w=800&q=80',
    'Lal Mahal Dawat': 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=800&q=80',
    'Agashiye': 'https://images.unsplash.com/photo-1626804475297-41608ea09aeb?w=800&q=80',
    'Dhaba on the Street': 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=800&q=80',
    'Paragon Restaurant': 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80',
    "Fisherman's Wharf": 'https://images.unsplash.com/photo-1519984388953-d2406bc725e1?w=800&q=80',
    'Tunday Kababi': 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80',
    'Indian Cafe Bhopal': 'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=800&q=80',
    'Khorika': 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&q=80',
}

count = 0
for name, img in IMAGES.items():
    if 'Willow' in name:
        updated = Restaurant.objects.filter(name__icontains='Willow').update(image=img)
    else:
        updated = Restaurant.objects.filter(name=name).update(image=img)
    count += updated

print(f"[OK] Updated {count} restaurants with unique images!")
print("Remaining without image:", Restaurant.objects.filter(image=None).count())

