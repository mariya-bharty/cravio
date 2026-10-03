import requests
from datetime import time
from django.db import transaction

# Swiggy endpoint configuration
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
    'Accept': 'application/json',
    'Referer': 'https://www.swiggy.com/',
}

CITY_COORDINATES = {
    'bengaluru': ('12.9715987', '77.5945627'),
    'bangalore': ('12.9715987', '77.5945627'),
    'mumbai': ('19.0760', '72.8777'),
    'delhi': ('28.6139', '77.2090'),
    'new delhi': ('28.6139', '77.2090'),
    'kolkata': ('22.5726', '88.3639'),
    'calcutta': ('22.5726', '88.3639'),
    'chennai': ('13.0827', '80.2707'),
    'madras': ('13.0827', '80.2707'),
    'pune': ('18.5204', '73.8567'),
    'hyderabad': ('17.3850', '78.4867'),
    'ahmedabad': ('23.0225', '72.5714'),
    'jaipur': ('26.9124', '75.7873'),
    'gurgaon': ('28.4595', '77.0266'),
    'gurugram': ('28.4595', '77.0266'),
    'noida': ('28.5355', '77.3910'),
    'kochi': ('9.9312', '76.2673'),
}

MOCK_SWIGGY_RESTAURANTS = [
    {
        'swiggy_id': 'swiggy_101',
        'name': "Leon's Burgers & Wings",
        'cuisine': "Burgers, Fast Food, Beverages",
        'address': "Koramangala 5th Block",
        'city': "Bengaluru",
        'image': "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80",
        'average_rating': 4.4,
        'total_reviews': 500,
        'opening_time': time(10, 0),
        'closing_time': time(23, 0),
    },
    {
        'swiggy_id': 'swiggy_102',
        'name': "Truffles Café",
        'cuisine': "American, Desserts, Italian",
        'address': "Indiranagar 100 Feet Rd",
        'city': "Bengaluru",
        'image': "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&q=80",
        'average_rating': 4.6,
        'total_reviews': 1200,
        'opening_time': time(9, 0),
        'closing_time': time(22, 30),
    },
    {
        'swiggy_id': 'swiggy_103',
        'name': "Meghana Foods",
        'cuisine': "Biryani, Andhra, South Indian",
        'address': "Jayanagar 4th Block",
        'city': "Bengaluru",
        'image': "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&q=80",
        'average_rating': 4.5,
        'total_reviews': 2400,
        'opening_time': time(11, 30),
        'closing_time': time(23, 0),
    },
    {
        'swiggy_id': 'swiggy_104',
        'name': "Empire Restaurant",
        'cuisine': "North Indian, Mughlai, Kebab",
        'address': "Church Street",
        'city': "Bengaluru",
        'image': "https://images.unsplash.com/photo-1585938338392-50a59970d2ee?w=600&q=80",
        'average_rating': 4.2,
        'total_reviews': 3100,
        'opening_time': time(12, 0),
        'closing_time': time(2, 0),
    },
]

MOCK_SWIGGY_MENUS = {
    'swiggy_101': [
        {'name': "Leon Classic Chicken Burger", 'price': 189.0, 'description': "Juicy chicken patty with house sauces and veggies", 'is_veg': False, 'category_name': "Burgers"},
        {'name': "Spicy Peri Peri Wings", 'price': 229.0, 'description': "Crispy fried wings tossed in hot peri peri seasoning", 'is_veg': False, 'category_name': "Wings"},
        {'name': "Cheese Loaded Fries", 'price': 149.0, 'description': "Golden french fries layered with warm cheese sauce", 'is_veg': True, 'category_name': "Sides"},
        {'name': "Chocolate Milkshake", 'price': 129.0, 'description': "Creamy milkshake made with dark Belgian chocolate", 'is_veg': True, 'category_name': "Beverages"},
    ],
    'swiggy_102': [
        {'name': "All American Cheese Burger", 'price': 249.0, 'description': "Classic grilled patty with melted cheddar and pickles", 'is_veg': False, 'category_name': "Burgers"},
        {'name': "Ferrero Rocher Waffle", 'price': 199.0, 'description': "Freshly baked waffle topped with Nutella and chopped Ferrero Rocher", 'is_veg': True, 'category_name': "Desserts"},
        {'name': "Alfredo Penne Pasta", 'price': 279.0, 'description': "Penne pasta in rich, creamy parmesan cheese sauce with mushrooms", 'is_veg': True, 'category_name': "Pasta"},
        {'name': "Cold Brew Coffee", 'price': 139.0, 'description': "Smooth, 18-hour steep premium coffee served over ice", 'is_veg': True, 'category_name': "Beverages"},
    ],
    'swiggy_103': [
        {'name': "Meghana Special Chicken Biryani", 'price': 349.0, 'description': "Flavorful basmati rice cooked with tender spiced chicken pieces", 'is_veg': False, 'category_name': "Biryani"},
        {'name': "Andhra Paneer Biryani", 'price': 299.0, 'description': "Spicy, aromatic Andhra style biryani with marinated paneer", 'is_veg': True, 'category_name': "Biryani"},
        {'name': "Chicken Kabab (Dry)", 'price': 259.0, 'description': "Deep fried spicy chicken pieces with bone, seasoned with lemon", 'is_veg': False, 'category_name': "Starters"},
        {'name': "Masala Buttermilk", 'price': 49.0, 'description': "Refreshing buttermilk churned with ginger, coriander, and green chillies", 'is_veg': True, 'category_name': "Beverages"},
    ],
    'swiggy_104': [
        {'name': "Empire Special Chicken Kebabs", 'price': 269.0, 'description': "Marinated tender chicken skewers grilled to perfection", 'is_veg': False, 'category_name': "Kebabs"},
        {'name': "Butter Chicken Masala", 'price': 329.0, 'description': "Roasted chicken in a rich, buttery, creamy tomato curry", 'is_veg': False, 'category_name': "Mains"},
        {'name': "Paneer Butter Masala", 'price': 289.0, 'description': "Soft paneer cubes cooked in a sweet and mildly spiced creamy gravy", 'is_veg': True, 'category_name': "Mains"},
        {'name': "Garlic Naan", 'price': 69.0, 'description': "Leavened flatbread baked in tandoor and brushed with garlic butter", 'is_veg': True, 'category_name': "Breads"},
    ],
}

def fetch_restaurants_from_swiggy(lat='12.9715987', lng='77.5945627'):
    url = f"https://www.swiggy.com/dapi/restaurants/list/v5?lat={lat}&lng={lng}&is-seo-homepage-enabled=true&page_type=DESKTOP_WEB_LISTING"
    try:
        response = requests.get(url, headers=HEADERS, timeout=4)
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Swiggy list API returned status code {response.status_code}.")
    except Exception as e:
        print(f"Error calling Swiggy list API: {e}")
    return None

def fetch_menu_from_swiggy(restaurant_id, lat='12.9715987', lng='77.5945627'):
    url = f"https://www.swiggy.com/dapi/menu/pl?page-type=REGULAR_MENU&complete-menu=true&lat={lat}&lng={lng}&restaurantId={restaurant_id}"
    try:
        response = requests.get(url, headers=HEADERS, timeout=4)
        if response.status_code == 200:
            return response.json()
        elif response.status_code == 202:
            print(f"Swiggy menu API returned 202 (WAF block/challenge).")
        else:
            print(f"Swiggy menu API returned status code {response.status_code}.")
    except Exception as e:
        print(f"Error calling Swiggy menu API: {e}")
    return None

def parse_swiggy_menu(json_data):
    items = []
    if not json_data:
        return items
    
    try:
        cards = json_data.get('data', {}).get('cards', [])
        grouped_card = None
        for card in cards:
            if 'groupedCard' in card:
                grouped_card = card.get('groupedCard', {})
                break
            elif 'card' in card and 'groupedCard' in card['card']:
                grouped_card = card['card'].get('groupedCard', {})
                break
                
        if not grouped_card:
            return items
            
        regular_cards = grouped_card.get('cardGroupMap', {}).get('REGULAR', {}).get('cards', [])
        for rcard in regular_cards:
            inner_card = rcard.get('card', {}).get('card', {})
            item_cards = inner_card.get('itemCards', [])
            category_name = inner_card.get('title', 'General')
            
            for icard in item_cards:
                info = icard.get('card', {}).get('info', {})
                iid = info.get('id')
                if not iid:
                    continue
                
                price_paise = info.get('price') or info.get('defaultPrice') or 0
                price = float(price_paise) / 100.0 if price_paise else 0.0
                if price <= 0:
                    price = 150.0 # fallback default price
                
                img_id = info.get('imageId', '')
                img_url = f"https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_300/{img_id}" if img_id else ""
                
                is_veg = info.get('isVeg') == 1 or info.get('itemAttribute', {}).get('vegClassifier') == 'VEG'
                in_stock = info.get('inStock') == 1 or info.get('isAvailable', True)
                
                items.append({
                    'swiggy_food_id': str(iid),
                    'name': info.get('name'),
                    'description': info.get('description', f"Delicious {info.get('name')} from our kitchen."),
                    'price': price,
                    'image': img_url,
                    'is_veg': is_veg,
                    'category_name': category_name,
                    'is_available': bool(in_stock)
                })
    except Exception as e:
        print(f"Error parsing Swiggy menu json: {e}")
        
    return items

def sync_swiggy_restaurants(lat='12.9715987', lng='77.5945627', city_name=None):
    from users.models import User
    from restaurants.models import Restaurant

    if city_name:
        city_key = city_name.lower().strip()
        coords = CITY_COORDINATES.get(city_key)
        if coords:
            lat, lng = coords
        else:
            # Check if city_name matches an existing restaurant city in DB before syncing
            if not Restaurant.objects.filter(city__iexact=city_name).exists():
                print(f"Skipping Swiggy sync: '{city_name}' is not a recognized city.")
                return []

    # Get a default owner user to assign to Swiggy restaurants
    owner = User.objects.filter(role='owner').first()
    if not owner:
        owner = User.objects.filter(is_superuser=True).first()
    if not owner:
        owner = User.objects.create_user(
            username='swiggy_owner',
            email='swiggy_owner@cravio.app',
            password='swiggy_owner123',
            role='owner',
            first_name='Swiggy',
            last_name='Owner'
        )

    json_data = fetch_restaurants_from_swiggy(lat, lng)
    restaurants_data = []
    
    # Try parsing live data
    if json_data:
        try:
            cards = json_data.get('data', {}).get('cards', [])
            raw_res_list = []
            for card in cards:
                grid_elements = card.get('card', {}).get('card', {}).get('gridElements', {})
                res_list = grid_elements.get('infoWithStyle', {}).get('restaurants', [])
                if res_list:
                    raw_res_list.extend(res_list)
                else:
                    res_list = card.get('card', {}).get('card', {}).get('restaurants', [])
                    if res_list:
                        raw_res_list.extend(res_list)

            for r in raw_res_list:
                info = r.get('info', {})
                rid = info.get('id')
                if not rid:
                    continue
                img_id = info.get('cloudinaryImageId')
                img_url = f"https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_660/{img_id}" if img_id else ""
                
                restaurants_data.append({
                    'swiggy_id': str(rid),
                    'name': info.get('name'),
                    'cuisine': ", ".join(info.get('cuisines', [])),
                    'address': info.get('locality', '') or info.get('areaName', '') or "Bengaluru",
                    'city': city_name.capitalize() if city_name else (info.get('city', 'Bengaluru') or "Bengaluru"),
                    'image': img_url,
                    'average_rating': float(info.get('avgRating', 4.0) or 4.0),
                    'total_reviews': int(info.get('totalRatingsCount', 100) or 100),
                    'opening_time': time(9, 0),
                    'closing_time': time(22, 0),
                    'latitude': float(lat) if lat else 12.9715987,
                    'longitude': float(lng) if lng else 77.5945627,
                })
        except Exception as parse_err:
            print(f"Error parsing live Swiggy JSON: {parse_err}")

    # Fallback to mock data if live API was blocked or returned nothing
    if not restaurants_data:
        print("Swiggy API blocked or returned empty. Using mock restaurants...")
        restaurants_data = []
        for r in MOCK_SWIGGY_RESTAURANTS:
            r_copy = r.copy()
            if city_name:
                r_copy['city'] = city_name.capitalize()
            r_copy['latitude'] = float(lat) if lat else 12.9715987
            r_copy['longitude'] = float(lng) if lng else 77.5945627
            restaurants_data.append(r_copy)
        
    synced_restaurants = []
    with transaction.atomic():
        for rdata in restaurants_data:
            swiggy_id = rdata.get('swiggy_id')
            restaurant, created = Restaurant.objects.update_or_create(
                swiggy_id=swiggy_id,
                defaults={
                    'owner': owner,
                    'name': rdata['name'],
                    'cuisine': rdata['cuisine'],
                    'address': rdata['address'],
                    'city': rdata['city'],
                    'image': rdata['image'],
                    'status': 'approved',
                    'is_active': True,
                    'opening_time': rdata['opening_time'],
                    'closing_time': rdata['closing_time'],
                    'average_rating': rdata['average_rating'],
                    'total_reviews': rdata['total_reviews'],
                    'latitude': rdata.get('latitude'),
                    'longitude': rdata.get('longitude'),
                }
            )
            synced_restaurants.append(restaurant)
            
    for r in synced_restaurants:
        try:
            sync_swiggy_menu(r)
            sync_swiggy_reviews(r)
        except Exception as e:
            print(f"Error syncing menu/reviews for {r.name}: {e}")
            
    return synced_restaurants

def sync_swiggy_menu(restaurant):
    from foods.models import Food, Category
    
    swiggy_id = restaurant.swiggy_id
    if not swiggy_id:
        return []
        
    is_mock = swiggy_id.startswith('swiggy_')
    menu_items = []
    
    if is_mock:
        menu_items = MOCK_SWIGGY_MENUS.get(swiggy_id, [])
    else:
        json_data = fetch_menu_from_swiggy(swiggy_id)
        menu_items = parse_swiggy_menu(json_data)
        if not menu_items:
            print(f"Swiggy menu API blocked for restaurant {swiggy_id}. Using cuisine-aware menu generator...")
            from restaurants.menu_generator import get_menu_for_restaurant
            menu_items = get_menu_for_restaurant(restaurant)
                
    synced_foods = []
    with transaction.atomic():
        for item in menu_items:
            cat_name = item.get('category_name', 'General')
            category, _ = Category.objects.get_or_create(name=cat_name)
            
            swiggy_food_id = item.get('swiggy_food_id', f"mock_food_{restaurant.swiggy_id}_{item['name']}")
            
            food, created = Food.objects.update_or_create(
                restaurant=restaurant,
                swiggy_food_id=swiggy_food_id,
                defaults={
                    'category': category,
                    'name': item['name'],
                    'description': item.get('description', f"Delicious {item['name']}"),
                    'price': item['price'],
                    'image': item.get('image', ''),
                    'is_veg': item['is_veg'],
                    'is_available': item.get('is_available', True)
                }
            )
            synced_foods.append(food)
            
    return synced_foods


def sync_swiggy_reviews(restaurant):
    from users.models import User
    from reviews.models import Review

    reviewers = [
        {'username': 'rohan_k', 'email': 'rohan@swiggy.user', 'first_name': 'Rohan', 'last_name': 'K.', 'comment': "Absolutely delicious! The taste was spot on and packaging was great.", 'rating': 5},
        {'username': 'anjali_s', 'email': 'anjali@swiggy.user', 'first_name': 'Anjali', 'last_name': 'S.', 'comment': "Good value for money. The spices were well balanced. Will order again.", 'rating': 4},
        {'username': 'vikram_m', 'email': 'vikram@swiggy.user', 'first_name': 'Vikram', 'last_name': 'M.', 'comment': "Prompt service and hot food. The quality was extremely good.", 'rating': 4},
        {'username': 'divya_p', 'email': 'divya@swiggy.user', 'first_name': 'Divya', 'last_name': 'P.', 'comment': "Best in town! Strongly recommend their signature dishes.", 'rating': 5},
    ]

    cuisine_lower = restaurant.cuisine.lower()
    if 'biryani' in cuisine_lower:
        reviewers[0]['comment'] = "The biryani was so aromatic and the meat was perfectly tender! Highly recommended."
        reviewers[1]['comment'] = "Spicy and delicious Andhra style biryani, quantity was generous."
    elif 'burger' in cuisine_lower:
        reviewers[0]['comment'] = "Hands down one of the best burgers I've had. The patty was juicy."
        reviewers[1]['comment'] = "Loved the peri peri seasoning on the fries and the burger was huge!"
    elif 'pizza' in cuisine_lower:
        reviewers[0]['comment'] = "Amazing wood-fired crust! The cheese pull was spectacular."
        reviewers[1]['comment'] = "Toppings were fresh and the pizza was delivered piping hot."
    elif 'cafe' in cuisine_lower or 'coffee' in cuisine_lower:
        reviewers[0]['comment'] = "The cold brew was incredibly smooth and the sandwich was freshly toasted."
        reviewers[1]['comment'] = "Cozy vibes and excellent coffee options. A must visit."

    for rev in reviewers:
        user, _ = User.objects.get_or_create(
            email=rev['email'],
            defaults={
                'username': rev['username'],
                'first_name': rev['first_name'],
                'last_name': rev['last_name'],
                'role': 'customer'
            }
        )
        
        Review.objects.get_or_create(
            user=user,
            restaurant=restaurant,
            defaults={
                'rating': rev['rating'],
                'comment': rev['comment']
            }
        )
