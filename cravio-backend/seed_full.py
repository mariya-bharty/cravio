"""
Full seed script — covers restaurants across 15+ Indian states with orders, reviews, reservations.
Run with:
  python manage.py shell -c "exec(open('seed_full.py').read())"
"""
import os, random
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cravio.settings')

import django
django.setup()

from datetime import time, timedelta, date
from django.utils import timezone
from django.db import transaction

from users.models import User
from restaurants.models import Restaurant
from foods.models import Category, Food
from orders.models import Order, OrderItem
from reservations.models import Reservation
from reviews.models import Review

print("Starting full seed...")

# ─────────────────────────────────────────────
# 1. USERS
# ─────────────────────────────────────────────
def make_user(email, first, last, role, phone):
    u, created = User.objects.get_or_create(
        email=email,
        defaults=dict(username=email, first_name=first, last_name=last, role=role, phone=phone)
    )
    u.set_password(f'{role}123')
    u.save()
    return u

admin_user  = make_user('admin@cravio.app',    'Admin',   'Cravio',  'admin',    '9000000000')
owner1      = make_user('owner1@cravio.app',   'Ravi',    'Sharma',  'owner',    '9876543210')
owner2      = make_user('owner2@cravio.app',   'Priya',   'Menon',   'owner',    '9876543211')
owner3      = make_user('owner3@cravio.app',   'Arjun',   'Reddy',   'owner',    '9876543212')
owner4      = make_user('owner4@cravio.app',   'Fatima',  'Khan',    'owner',    '9876543213')
owner5      = make_user('owner5@cravio.app',   'Suresh',  'Iyer',    'owner',    '9876543214')

customers = []
CUSTOMER_DATA = [
    ('divya@gmail.com',   'Divya',   'Pillai',  '9800000001'),
    ('rahul@gmail.com',   'Rahul',   'Gupta',   '9800000002'),
    ('sneha@gmail.com',   'Sneha',   'Joshi',   '9800000003'),
    ('karan@gmail.com',   'Karan',   'Singh',   '9800000004'),
    ('meera@gmail.com',   'Meera',   'Nair',    '9800000005'),
    ('aditya@gmail.com',  'Aditya',  'Kumar',   '9800000006'),
    ('pooja@gmail.com',   'Pooja',   'Verma',   '9800000007'),
    ('vikram@gmail.com',  'Vikram',  'Malhotra','9800000008'),
    ('ananya@gmail.com',  'Ananya',  'Das',     '9800000009'),
    ('rohit@gmail.com',   'Rohit',   'Shah',    '9800000010'),
]
for email, first, last, phone in CUSTOMER_DATA:
    customers.append(make_user(email, first, last, 'customer', phone))

print(f"  ✓ {len(customers)+6} users ready")

# ─────────────────────────────────────────────
# 2. FOOD CATEGORIES
# ─────────────────────────────────────────────
CAT_DATA = [
    ('North Indian', ''), ('South Indian', ''), ('Biryani', ''),
    ('Chinese', ''),      ('Italian', ''),       ('Pizza', ''),
    ('Cafe', ''),         ('Desserts', ''),       ('Mughlai', ''),
    ('Street Food', ''),  ('Seafood', ''),        ('Continental', ''),
]
cats = {}
for name, icon in CAT_DATA:
    c, _ = Category.objects.get_or_create(name=name, defaults={'icon': icon})
    cats[name] = c

print(f"  ✓ {len(cats)} categories ready")

# ─────────────────────────────────────────────
# 3. RESTAURANTS — 20 across 15 states
# ─────────────────────────────────────────────
RESTAURANT_DATA = [
    # Karnataka
    dict(name='The Spice Room',      cuisine='North Indian, Mughlai', city='Bengaluru',   state='Karnataka',       pincode='560001', address='45 Koramangala, Bengaluru',     owner=owner1, average_rating=4.7, total_reviews=312, latitude=12.9352, longitude=77.6245, image='https://images.unsplash.com/photo-1585938338392-50a59970d2ee?w=800&q=80'),
    dict(name='Café Willow',         cuisine='Cafe, Continental',     city='Bengaluru',   state='Karnataka',       pincode='560038', address='7 Indiranagar, Bengaluru',      owner=owner2, average_rating=4.5, total_reviews=198, latitude=12.9784, longitude=77.6408, image='https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80'),
    # Maharashtra
    dict(name='Mumbai Darbar',       cuisine='North Indian, Mughlai', city='Mumbai',      state='Maharashtra',     pincode='400001', address='12 Marine Drive, Mumbai',       owner=owner3, average_rating=4.8, total_reviews=540, latitude=18.9438, longitude=72.8234, image='https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80'),
    dict(name='Pav Bhaji Palace',    cuisine='Street Food',           city='Pune',        state='Maharashtra',     pincode='411001', address='22 FC Road, Pune',              owner=owner1, average_rating=4.4, total_reviews=220, latitude=18.5275, longitude=73.8418, image='https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&q=80'),
    # Delhi
    dict(name='Dilli Haat Kitchen',  cuisine='North Indian, Mughlai', city='Delhi',       state='Delhi',           pincode='110001', address='Connaught Place, New Delhi',     owner=owner4, average_rating=4.9, total_reviews=720, latitude=28.6315, longitude=77.2167, image='https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&q=80'),
    dict(name='Old Delhi Biryani',   cuisine='Biryani, Mughlai',      city='Delhi',       state='Delhi',           pincode='110006', address='Chandni Chowk, Old Delhi',      owner=owner5, average_rating=4.7, total_reviews=485, latitude=28.6507, longitude=77.2334, image='https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80'),
    # Tamil Nadu
    dict(name='Murugan Idli Shop',   cuisine='South Indian',          city='Chennai',     state='Tamil Nadu',      pincode='600001', address='14 Anna Salai, Chennai',        owner=owner2, average_rating=4.6, total_reviews=390, latitude=13.0604, longitude=80.2496, image='https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&q=80'),
    dict(name='The Marina Seafood',  cuisine='Seafood, Continental',  city='Chennai',     state='Tamil Nadu',      pincode='600004', address='Marina Beach Road, Chennai',    owner=owner3, average_rating=4.5, total_reviews=275, latitude=13.0500, longitude=80.2824, image='https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=800&q=80'),
    # Telangana
    dict(name='Paradise Biryani',    cuisine='Biryani, Mughlai',      city='Hyderabad',   state='Telangana',       pincode='500001', address='MG Road, Hyderabad',            owner=owner4, average_rating=4.9, total_reviews=890, latitude=17.3950, longitude=78.4867, image='https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=800&q=80'),
    dict(name='Chutneys Hyderabad',  cuisine='South Indian',          city='Hyderabad',   state='Telangana',       pincode='500082', address='Banjara Hills, Hyderabad',      owner=owner1, average_rating=4.6, total_reviews=340, latitude=17.4156, longitude=78.4347, image='https://images.unsplash.com/photo-1630383249896-424e482df921?w=800&q=80'),
    # West Bengal
    dict(name='Arsalan Kolkata',     cuisine='Biryani, Mughlai',      city='Kolkata',     state='West Bengal',     pincode='700017', address='Park Street, Kolkata',          owner=owner5, average_rating=4.8, total_reviews=610, latitude=22.5511, longitude=88.3517, image='https://images.unsplash.com/photo-1701765696059-1f36c9c8d21c?w=800&q=80'),
    dict(name='Oh! Calcutta',        cuisine='Continental, Seafood',  city='Kolkata',     state='West Bengal',     pincode='700071', address='Forum Mall, Kolkata',           owner=owner2, average_rating=4.5, total_reviews=295, latitude=22.5085, longitude=88.3632, image='https://images.unsplash.com/photo-1625944525533-473f1a3d54e7?w=800&q=80'),
    # Rajasthan
    dict(name='Lal Mahal Dawat',     cuisine='Rajasthani, North Indian', city='Jaipur',   state='Rajasthan',       pincode='302001', address='Civil Lines, Jaipur',           owner=owner3, average_rating=4.7, total_reviews=430, latitude=26.9124, longitude=75.7873, image='https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=800&q=80'),
    # Gujarat
    dict(name='Agashiye',            cuisine='Gujarati, Street Food', city='Ahmedabad',   state='Gujarat',         pincode='380001', address='House of MG, Ahmedabad',        owner=owner4, average_rating=4.8, total_reviews=510, latitude=23.0258, longitude=72.5873, image='https://images.unsplash.com/photo-1626804475297-41608ea09aeb?w=800&q=80'),
    # Punjab
    dict(name='Dhaba on the Street', cuisine='North Indian, Mughlai', city='Chandigarh',  state='Punjab',          pincode='160001', address='Sector 17, Chandigarh',         owner=owner5, average_rating=4.6, total_reviews=380, latitude=30.7412, longitude=76.7687, image='https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=800&q=80'),
    # Kerala
    dict(name='Paragon Restaurant',  cuisine='Seafood, South Indian', city='Kozhikode',   state='Kerala',          pincode='673001', address='SM Street, Kozhikode',          owner=owner1, average_rating=4.7, total_reviews=460, latitude=11.2500, longitude=75.7804, image='https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80'),
    # Goa
    dict(name='Fisherman\'s Wharf',  cuisine='Seafood, Continental',  city='Panaji',      state='Goa',             pincode='403001', address='Calapor, Panaji, Goa',          owner=owner2, average_rating=4.8, total_reviews=550, latitude=15.4990, longitude=73.8278, image='https://images.unsplash.com/photo-1519984388953-d2406bc725e1?w=800&q=80'),
    # Uttar Pradesh
    dict(name='Tunday Kababi',        cuisine='Mughlai, Street Food', city='Lucknow',     state='Uttar Pradesh',   pincode='226001', address='Aminabad, Lucknow',             owner=owner3, average_rating=4.9, total_reviews=780, latitude=26.8467, longitude=80.9462, image='https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80'),
    # Madhya Pradesh
    dict(name='Indian Cafe Bhopal',  cuisine='North Indian, Cafe',   city='Bhopal',      state='Madhya Pradesh',  pincode='462001', address='New Market, Bhopal',            owner=owner4, average_rating=4.3, total_reviews=180, latitude=23.2599, longitude=77.4126, image='https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=800&q=80'),
    # Assam
    dict(name='Khorika',             cuisine='North Indian, Seafood', city='Guwahati',    state='Assam',           pincode='781001', address='GS Road, Guwahati',             owner=owner5, average_rating=4.4, total_reviews=150, latitude=26.1445, longitude=91.7362, image='https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&q=80'),
]

RESTAURANT_DESCRIPTIONS = {
    'The Spice Room': 'A sophisticated dining room offering a rich tapestry of North Indian spices, slow-cooked curries, and hand-stretched tandoori breads.',
    'Café Willow': 'A cozy, sun-drenched cafe with artisanal coffee brews, freshly baked treats, and classic continental comfort food.',
    'Mumbai Darbar': 'A celebration of Mumbai\'s heritage with legendary slow-cooked Mughlai curries, fragrant biryanis, and royal kebabs.',
    'Pav Bhaji Palace': 'A bustling local favorite serving street-style pav bhaji dripping with butter, spicy chaats, and local Maharashtrian delicacies.',
    'Dilli Haat Kitchen': 'Bringing the vibrant colors and legendary street flavors of old Delhi to your table, with recipes passed down through generations.',
    'Old Delhi Biryani': 'Authentic charcoal-cooked Degh biryanis, slow-steamed with premium basmati rice, pure ghee, and secret spices.',
    'Murugan Idli Shop': 'Famous for cloud-soft steamed idlis, crispy golden dosas, and a colorful array of traditional house chutneys.',
    'The Marina Seafood': 'Experience the catch of the day cooked with authentic coastal spices, overlooking the bay.',
    'Paradise Biryani': 'The undisputed king of Hyderabadi biryani, layered with saffron-scented rice and slow-dum tender meat.',
    'Chutneys Hyderabad': 'A legendary vegetarian dining experience featuring six iconic house-made chutneys served with giant paper-thin dosas.',
    'Arsalan Kolkata': 'Kolkata\'s iconic Mughal destination, famous for its melt-in-mouth Kolkata-style potato and meat biryani.',
    'Oh! Calcutta': 'A nostalgic journey into Bengal\'s rich culinary heritage, featuring authentic fish curries, mustard gravies, and traditional sweets.',
    'Lal Mahal Dawat': 'A royal Rajasthani dining experience serving heritage recipes like Laal Maas, Dal Baati, and sweet Churma in a palace setting.',
    'Agashiye': 'A beautiful terrace dining destination serving unlimited traditional Gujarati thalis showcasing seasonal regional specialties.',
    'Dhaba on the Street': 'A rustic, highway-style dhaba experience serving hot tandoori rotis, buttery paneer, and authentic Amritsari kulchas.',
    'Paragon Restaurant': 'A Malabar culinary institution, celebrated for its legendary fish curries, seafood fries, and historic recipes.',
    'Fisherman\'s Wharf': 'A vibrant, riverside Goan shack experience serving authentic Portuguese-Goan fish curries, feni cocktails, and live music vibes.',
    'Tunday Kababi': 'The legendary Lucknowi culinary treasure, serving melt-in-your-mouth minced buffalo galouti kebabs infused with 160 secret spices.',
    'Indian Cafe Bhopal': 'A relaxed student and family favorite offering a perfect mix of street food platters, thick milkshakes, and North Indian comfort meals.',
    'Khorika': 'An authentic Assamese dining experience showcasing traditional smoke-grilled meats, tangy fish curries, and local bamboo shoot delicacies.',
}

restaurants = []
for rd in RESTAURANT_DATA:
    r, created = Restaurant.objects.get_or_create(
        name=rd['name'],
        defaults={
            **rd,
            'status': 'approved',
            'is_active': True,
            'opening_time': time(10, 0),
            'closing_time': time(23, 0),
            'description': RESTAURANT_DESCRIPTIONS.get(rd['name'], f"A popular {rd['cuisine']} restaurant in {rd['city']}, known for authentic flavors and warm hospitality."),
        }
    )
    if created:
        print(f"  + Restaurant: {r.name} ({r.city}, {r.state})")
    restaurants.append(r)


print(f"  ✓ {len(restaurants)} restaurants ready")

# ─────────────────────────────────────────────
# 4. FOOD ITEMS — 5 per restaurant
# ─────────────────────────────────────────────
FOOD_TEMPLATES = {
    'North Indian, Mughlai': [
        ('Butter Chicken',    'Mughlai',    350, False),
        ('Dal Makhani',       'North Indian', 220, True),
        ('Paneer Tikka',      'North Indian', 280, True),
        ('Seekh Kebab',       'Mughlai',    310, False),
        ('Garlic Naan',       'North Indian', 60,  True),
    ],
    'South Indian': [
        ('Masala Dosa',       'South Indian', 120, True),
        ('Idli Sambhar',      'South Indian', 80,  True),
        ('Vada',              'South Indian', 60,  True),
        ('Uttapam',           'South Indian', 110, True),
        ('Filter Coffee',     'Cafe',         50,  True),
    ],
    'Biryani, Mughlai': [
        ('Chicken Dum Biryani','Biryani',    320, False),
        ('Mutton Biryani',    'Biryani',    390, False),
        ('Veg Biryani',       'Biryani',    220, True),
        ('Raita',             'North Indian', 60,  True),
        ('Shorba',            'Mughlai',    90,  False),
    ],
    'Biryani, Mughlai': [
        ('Chicken Dum Biryani','Biryani',    320, False),
        ('Mutton Biryani',    'Biryani',    390, False),
        ('Veg Biryani',       'Biryani',    220, True),
        ('Raita',             'North Indian', 60,  True),
        ('Shorba',            'Mughlai',    90,  False),
    ],
    'Cafe, Continental': [
        ('Cappuccino',        'Cafe',        120, True),
        ('Avocado Toast',     'Continental', 220, True),
        ('Eggs Benedict',     'Continental', 280, False),
        ('Blueberry Muffin',  'Desserts',    90,  True),
        ('Chicken Sandwich',  'Continental', 250, False),
    ],
    'Street Food': [
        ('Pav Bhaji',         'Street Food', 120, True),
        ('Vada Pav',          'Street Food', 40,  True),
        ('Pani Puri',         'Street Food', 60,  True),
        ('Bhel Puri',         'Street Food', 70,  True),
        ('Misal Pav',         'Street Food', 100, True),
    ],
    'Seafood, Continental': [
        ('Grilled Pomfret',   'Seafood',    480, False),
        ('Prawn Masala',      'Seafood',    520, False),
        ('Fish Curry Rice',   'Seafood',    320, False),
        ('Calamari Rings',    'Seafood',    380, False),
        ('Crab Butter Garlic','Seafood',    650, False),
    ],
    'Italian': [
        ('Margherita Pizza',  'Pizza',       320, True),
        ('Pasta Arrabiata',   'Italian',    290, True),
        ('Tiramisu',          'Desserts',    180, True),
        ('Bruschetta',        'Italian',    160, True),
        ('Risotto Fungi',     'Italian',    350, True),
    ],
    'Rajasthani, North Indian': [
        ('Dal Baati Churma',  'North Indian', 280, True),
        ('Laal Maas',         'North Indian', 420, False),
        ('Gatte ki Sabzi',    'North Indian', 200, True),
        ('Kachori',           'Street Food', 60,  True),
        ('Mawa Kachori',      'Desserts',    80,  True),
    ],
    'Gujarati, Street Food': [
        ('Dhokla',            'Street Food', 80,  True),
        ('Thepla',            'Street Food', 60,  True),
        ('Undhiyu',           'North Indian', 200, True),
        ('Fafda Jalebi',      'Street Food', 90,  True),
        ('Handvo',            'Street Food', 100, True),
    ],
    'Seafood, South Indian': [
        ('Karimeen Pollichathu','Seafood',  480, False),
        ('Kerala Prawn Curry', 'Seafood',   420, False),
        ('Fish Molee',        'Seafood',    380, False),
        ('Appam Stew',        'South Indian',160, False),
        ('Kozhikodan Halwa',  'Desserts',   100, True),
    ],
    'North Indian, Cafe': [
        ('Shahi Paneer',      'North Indian', 280, True),
        ('Chicken Korma',     'North Indian', 340, False),
        ('Cold Coffee',       'Cafe',         110, True),
        ('Chocolate Cake',    'Desserts',    150, True),
        ('Veg Biryani',       'Biryani',    200, True),
    ],
    'North Indian, Seafood': [
        ('Masor Tenga',       'Seafood',    280, False),
        ('Chicken Curry',     'North Indian', 300, False),
        ('Aloo Pitika',       'North Indian', 80,  True),
        ('Pitha',             'Desserts',    70,  True),
        ('Duck Curry',        'North Indian', 380, False),
    ],
}

DEFAULT_FOODS = [
    ('Special Thali',     'North Indian', 250, True),
    ('Chicken Curry',     'North Indian', 280, False),
    ('Veg Pulao',         'Biryani',     180, True),
    ('Rasgulla',          'Desserts',    60,  True),
    ('Lassi',             'Cafe',        80,  True),
]

DELICIOUS_DESCRIPTIONS = {
    'Butter Chicken': 'Tender roasted chicken pieces cooked in a rich, creamy, and mildly spiced tomato and butter gravy.',
    'Dal Makhani': 'Slow-cooked black lentils and kidney beans simmered overnight with cream, butter, and select spices.',
    'Paneer Tikka': 'Cubes of cottage cheese marinated in spiced yogurt and grilled to perfection in a tandoor.',
    'Seekh Kebab': 'Minced mutton blended with aromatic spices, skewered and grilled over charcoal.',
    'Garlic Naan': 'Soft and fluffy leavened flatbread topped with minced garlic and brushed with fresh butter.',
    'Masala Dosa': 'Thin, crispy rice and lentil crepe stuffed with a spiced potato mash, served with sambar and coconut chutney.',
    'Idli Sambhar': 'Steamed fluffy rice-and-lentil cakes served with hot, aromatic lentil soup (sambar) and fresh chutneys.',
    'Vada': 'Crispy, deep-fried savory lentil doughnuts served with sambar and coconut chutney.',
    'Uttapam': 'Thick, savory pancake made from fermented rice and lentil batter, topped with chopped onions, tomatoes, and green chilies.',
    'Filter Coffee': 'Traditional South Indian chicory-infused coffee brewed with hot frothed milk in a brass filter.',
    'Chicken Dum Biryani': 'Fragrant basmati rice layered with succulent chicken, saffron, and whole spices, slow-cooked on dum.',
    'Mutton Biryani': 'Aromatic basmati rice cooked with tender mutton chunks, layered with caramelized onions, saffron, and fresh mint.',
    'Veg Biryani': 'Fragrant basmati rice cooked with a variety of fresh vegetables, paneer, aromatic herbs, and whole spices.',
    'Raita': 'Cool, refreshing spiced yogurt dip mixed with chopped cucumber, tomatoes, and toasted cumin.',
    'Shorba': 'A rich, flavorful, and warm Mughlai-style spiced vegetable or chicken broth.',
    'Cappuccino': 'Rich espresso shot topped with a thick layer of steamed and frothed milk, dusted with cocoa powder.',
    'Avocado Toast': 'Toasted sourdough bread topped with mashed avocado, cherry tomatoes, feta cheese, and a drizzle of olive oil.',
    'Eggs Benedict': 'Poached eggs served on toasted English muffins, topped with smoked ham or spinach and rich, buttery hollandaise sauce.',
    'Blueberry Muffin': 'Warm, moist, and fluffy bakery-style muffin loaded with sweet blueberries.',
    'Chicken Sandwich': 'Grilled chicken breast with fresh lettuce, tomatoes, cheese, and herb mayonnaise in toasted artisanal bread.',
    'Pav Bhaji': 'A thick, spicy vegetable mash cooked in butter and served with warm, toasted buttered bread rolls (pav).',
    'Vada Pav': 'Classic Mumbai street food featuring a spicy fried potato dumpling in a soft bread roll with spicy garlic chutney.',
    'Pani Puri': 'Crispy hollow puris filled with spiced potatoes, chickpeas, and a tangy, spicy tamarind and mint water.',
    'Bhel Puri': 'A savory street food snack made of puffed rice, vegetables, peanuts, and tangy tamarind chutney.',
    'Misal Pav': 'A spicy sprouted lentil curry topped with farsan (crispy mix), onions, and lemon, served with soft pav.',
    'Grilled Pomfret': 'Whole pomfret fish marinated in coastal spices and grilled to a juicy perfection.',
    'Prawn Masala': 'Fresh prawns cooked in a thick, spicy, and tangy onion-tomato gravy with coconut milk.',
    'Fish Curry Rice': 'Traditional coastal-style spicy fish curry served with steamed basmati rice.',
    'Calamari Rings': 'Crispy, golden-fried squid rings served with a side of garlic aioli.',
    'Crab Butter Garlic': 'Fresh crab tossed in a rich, velvety sauce of butter, garlic, and fresh herbs.',
    'Margherita Pizza': 'Classic Neapolitan pizza topped with fresh tomato sauce, mozzarella cheese, and fresh basil leaves.',
    'Pasta Arrabiata': 'Penne pasta tossed in a fiery tomato sauce with garlic, red chili flakes, and olive oil.',
    'Tiramisu': 'Classic Italian dessert made of coffee-soaked ladyfingers layered with a whipped mixture of mascarpone and cocoa.',
    'Bruschetta': 'Toasted bread rubbed with garlic and topped with diced tomatoes, fresh basil, and extra virgin olive oil.',
    'Risotto Fungi': 'Creamy Italian arborio rice slow-cooked with fresh wild mushrooms, parmesan cheese, and white wine.',
    'Dal Baati Churma': 'Traditional Rajasthani platter containing baked wheat balls, spiced lentil curry, and sweet crumbled wheat mixture.',
    'Laal Maas': 'A fiery Rajasthani mutton curry cooked in a rich paste of red Mathania chilies and garlic.',
    'Gatte ki Sabzi': 'Gram flour dumplings cooked in a rich, tangy yogurt-based gravy with traditional spices.',
    'Kachori': 'Flaky, deep-fried pastry stuffed with a spiced mixture of lentils, onions, and potatoes.',
    'Mawa Kachori': 'A sweet Rajasthani specialty: a deep-fried pastry filled with sweetened mawa (milk solids) and nuts, dipped in sugar syrup.',
    'Dhokla': 'Steamed, spongy, and savory cakes made from fermented chickpea batter, tempered with mustard seeds and curry leaves.',
    'Thepla': 'Flatbread made from whole wheat flour, fenugreek leaves, and spices, served with fresh pickles.',
    'Undhiyu': 'A classic Gujarati mixed vegetable dish slow-cooked with fenugreek dumplings and spices.',
    'Fafda Jalebi': 'A popular Gujarati Sunday breakfast combination of crispy chickpea flour sticks and sweet, syrupy jalebis.',
    'Handvo': 'A savory, baked lentil cake made from a batter of rice, lentils, and mixed vegetables, tempered with mustard seeds.',
    'Karimeen Pollichathu': 'Pearl spot fish marinated in spicy masala, wrapped in a banana leaf, and pan-fried to a smoky finish.',
    'Kerala Prawn Curry': 'Juicy prawns simmered in a mildly spiced coconut milk gravy with raw mangoes and curry leaves.',
    'Fish Molee': 'A delicate, creamy Kerala-style fish stew prepared with coconut milk, green chilies, and ginger.',
    'Appam Stew': 'Soft, lacy rice pancakes served with a rich coconut milk vegetable stew.',
    'Kozhikodan Halwa': 'Traditional sweet, gelatinous Kerala halwa made with double-refined flour, ghee, and coconut oil, flavored with cardamom.',
    'Shahi Paneer': 'Cottage cheese cubes simmered in a royal, creamy, and nutty gravy made with cashews, tomatoes, and spices.',
    'Chicken Korma': 'Tender chicken slow-cooked in a rich, aromatic gravy of yogurt, cream, paste of nuts, and mild spices.',
    'Cold Coffee': 'Chilled frothed milk blended with rich espresso and vanilla ice cream.',
    'Chocolate Cake': 'Rich, moist double-chocolate layer cake topped with dark chocolate ganache.',
    'Masor Tenga': 'A light, tangy Assamese fish curry cooked with tomatoes, outenga (elephant apple), and lemon juice.',
    'Aloo Pitika': 'Comforting Assamese side dish of mashed potatoes seasoned with mustard oil, chopped onions, and green chilies.',
    'Pitha': 'Traditional Assamese sweet rice cakes stuffed with grated coconut and jaggery, roasted inside hollow bamboo.',
    'Duck Curry': 'Duck meat cooked with ash gourd (komora) in a rich, traditional Assamese spice blend.',
    'Special Thali': 'A grand platter featuring a curated selection of starters, mains, curries, bread, rice, and desserts.',
    'Rasgulla': 'Soft, spongy chenna balls soaked in a sweet, light cardamom-flavored sugar syrup.',
    'Lassi': 'Thick, creamy yogurt drink blended with sugar and cardamom, served chilled in a clay pot.',
}

food_items_all = []
for r in restaurants:
    template = FOOD_TEMPLATES.get(r.cuisine, DEFAULT_FOODS)
    for fname, cat_name, price, is_veg in template:
        food, _ = Food.objects.get_or_create(
            name=fname, restaurant=r,
            defaults=dict(
                category=cats.get(cat_name),
                price=price, is_veg=is_veg, is_available=True,
                description=DELICIOUS_DESCRIPTIONS.get(fname, f'Freshly prepared {fname.lower()}'),
            )
        )
        food_items_all.append(food)

print(f"  ✓ {len(food_items_all)} food items ready")

# ─────────────────────────────────────────────
# 5. REVIEWS — 3-8 per restaurant
# ─────────────────────────────────────────────
REVIEW_TEXTS = [
    "Absolutely loved the food! The flavours were authentic and the service was great.",
    "One of the best meals I've had in this city. Will definitely come back.",
    "Great ambiance, good food. Slightly pricey but worth it.",
    "The biryani here is unmatched. Highly recommended!",
    "Service was a bit slow but the food made up for it.",
    "Excellent variety on the menu. The desserts were a highlight.",
    "Cosy place with delicious food. Perfect for a date night.",
    "Generous portions and great taste. Value for money.",
    "The seafood was super fresh. Best catch in town!",
    "Authentic regional flavours. Felt like home-cooked food.",
    "The staff was incredibly polite and helped us choose the best dishes.",
    "We ordered the special thali and it was a feast! Every item was delicious.",
    "A clean, hygienic place with quick table service. 10/10.",
    "The tandoori starters are exceptionally juicy. Highly recommend the paneer tikka.",
    "Lovely place to dine with family. The music was pleasant and not too loud.",
    "The spices are perfectly balanced - not too hot, but very flavorful.",
    "Their filter coffee is outstanding! Reminds me of traditional home-brewed coffee.",
    "Great location and very easy to book a table through Cravio.",
    "We had a wonderful Sunday lunch here. The food arrived piping hot.",
    "Crispy dosas and authentic chutneys. A must-visit breakfast spot.",
    "The mocktails were a bit sweet, but the main course was stellar.",
    "Superb presentation and authentic taste. Worth every rupee.",
    "The garlic naan was thin, soft, and loaded with butter. Perfect with the dal.",
    "Excellent place for corporate dinners. High-quality service and taste.",
    "Best street food flavours in a clean restaurant setting. Pav bhaji was excellent.",
    "A legendary spot for a reason. Still maintains its high standards.",
    "Every bite was full of flavor. The slow-cooked mutton was incredibly tender.",
    "Lovely rustic vibes. The bamboo shoot dishes are highly unique and delicious.",
    "Quick delivery and excellent packaging. Food was still warm.",
    "Authentic woodfired style. The crust was thin and perfectly charred."
]

review_count = 0
for r in restaurants:
    used_customers = random.sample(customers, min(random.randint(3, 8), len(customers)))
    for rating_offset, customer in enumerate(used_customers):
        rating = min(5, max(3, r.average_rating + random.uniform(-1, 0.5)))
        rev, created = Review.objects.get_or_create(
            user=customer, restaurant=r,
            defaults=dict(
                rating=int(round(rating)),
                comment=random.choice(REVIEW_TEXTS),
            )
        )
        days_ago = random.randint(1, 60)
        review_date = timezone.now() - timedelta(days=days_ago, hours=random.randint(0, 23))
        Review.objects.filter(id=rev.id).update(created_at=review_date)
        review_count += 1

print(f"  ✓ {review_count} reviews added")

# ─────────────────────────────────────────────
# 6. ORDERS — realistic volume per restaurant
# ─────────────────────────────────────────────
STATUSES = ['delivered', 'delivered', 'delivered', 'preparing', 'pending', 'cancelled']
ADDRESSES = [
    '12 MG Road, Bengaluru', '45 Sector 17, Delhi', '7 Park Street, Kolkata',
    '88 Anna Salai, Chennai', 'FC Road, Pune', 'Banjara Hills, Hyderabad',
    'Civil Lines, Jaipur', 'GS Road, Guwahati', 'SM Street, Kozhikode',
]

order_count = 0
with transaction.atomic():
    for r in restaurants:
        r_foods = list(Food.objects.filter(restaurant=r))
        if not r_foods:
            continue
        # More orders for higher-rated restaurants — simulates trending
        num_orders = int(r.average_rating * 20) + random.randint(10, 40)
        for i in range(num_orders):
            customer = random.choice(customers)
            selected_foods = random.sample(r_foods, min(random.randint(1, 3), len(r_foods)))
            items_data = [(f, random.randint(1, 3)) for f in selected_foods]
            total = sum(f.price * qty for f, qty in items_data)
            days_ago = random.randint(0, 90)
            order_date = timezone.now() - timedelta(days=days_ago)

            order = Order(
                user=customer,
                restaurant=r,
                status=random.choice(STATUSES),
                total_amount=total,
                delivery_address=random.choice(ADDRESSES),
                created_at=order_date,
            )
            order.save()

            for food, qty in items_data:
                OrderItem.objects.create(order=order, food=food, quantity=qty, price=food.price)
            order_count += 1

print(f"  ✓ {order_count} orders added")

# ─────────────────────────────────────────────
# 7. RESERVATIONS — 2-5 per restaurant
# ─────────────────────────────────────────────
res_count = 0
for r in restaurants:
    for _ in range(random.randint(2, 5)):
        customer = random.choice(customers)
        days_from_now = random.randint(-30, 30)
        res_date = date.today() + timedelta(days=days_from_now)
        Reservation.objects.get_or_create(
            user=customer, restaurant=r, date=res_date,
            defaults=dict(
                time=time(random.choice([13, 14, 19, 20, 21]), 0),
                guests=random.randint(2, 6),
                status=random.choice(['confirmed', 'pending', 'confirmed']),
            )
        )
        res_count += 1

print(f"  ✓ {res_count} reservations added")

print("\n✅ Seed complete!")
print("\nTest accounts:")
print("  Admin    → admin@cravio.app   / admin123")
print("  Owner    → owner1@cravio.app  / owner123")
print("  Customer → divya@gmail.com    / customer123")
print(f"\n  {len(restaurants)} restaurants across 15 states seeded")
