import re
from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Q
from .models import Food, Category
from .serializers import FoodSerializer, CategorySerializer


class IsOwnerOfRestaurant(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.restaurant.owner == request.user


class FoodListView(generics.ListCreateAPIView):
    serializer_class = FoodSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        restaurant_id = self.request.query_params.get('restaurant')
        category_id = self.request.query_params.get('category')
        is_veg = self.request.query_params.get('is_veg')

        if restaurant_id:
            # Sync Swiggy menu on-demand if the restaurant is a Swiggy restaurant and not synced yet
            try:
                from restaurants.models import Restaurant
                restaurant = Restaurant.objects.get(id=restaurant_id)
                if restaurant.swiggy_id:
                    if not Food.objects.filter(restaurant=restaurant).exists():
                        from restaurants.swiggy_helper import sync_swiggy_menu
                        sync_swiggy_menu(restaurant)
            except Exception as e:
                print(f"Error syncing Swiggy menu: {e}")

        qs = Food.objects.select_related('restaurant', 'category')
        if restaurant_id:
            qs = qs.filter(restaurant_id=restaurant_id)
        if category_id:
            qs = qs.filter(category_id=category_id)
        if is_veg is not None:
            qs = qs.filter(is_veg=is_veg.lower() == 'true')
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        if user.role != 'owner':
            raise PermissionDenied('Only restaurant owners can add food items.')
        restaurant = user.restaurants.first()
        if not restaurant:
            raise PermissionDenied('No restaurant found for this owner.')
        serializer.save(restaurant=restaurant)


class FoodDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Food.objects.all()
    serializer_class = FoodSerializer

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsOwnerOfRestaurant()]


class MyFoodsView(generics.ListAPIView):
    serializer_class = FoodSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role != 'owner':
            return Food.objects.none()
        return Food.objects.filter(restaurant__owner=user)


class CategoryListView(generics.ListCreateAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]


from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

class MenuExtractionView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    # Patterns for non-dish content that should be filtered out
    NON_DISH_PATTERNS = [
        re.compile(r'^\+?[\d\s\-\(\)]{7,}$'),                          # Phone numbers
        re.compile(r'[\w\.-]+@[\w\.-]+\.\w+'),                          # Emails
        re.compile(r'https?://|www\.', re.IGNORECASE),                  # URLs/websites
        re.compile(r'\b(open|closed|hours?|timing|we are open)\b', re.IGNORECASE),  # Hours/timing lines
        re.compile(r'\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b', re.IGNORECASE),  # Weekdays
        re.compile(r'\b(am|pm)\b.*\d', re.IGNORECASE),                 # Time expressions like "10am - 10pm"
        re.compile(r'^\d+\s*(am|pm)', re.IGNORECASE),                  # Lines starting with times
        re.compile(r'\b(welcome|thank you|thanks|enjoy|visit us|follow us|call us|contact|reservation|book|address|located|copyright|all rights reserved|est\.?|established)\b', re.IGNORECASE),
        re.compile(r'^(tel|ph|phone|fax|mob|mobile|call)\s*[:.]', re.IGNORECASE),  # Tel:/Ph: labels
        re.compile(r'\b(street|st\.|avenue|ave\.|road|rd\.|lane|ln\.|blvd|nagar|sector|block|colony|floor|plot|flat|no\.|#)\b', re.IGNORECASE),  # Address tokens
        re.compile(r'\b(gst|tax|service charge|inclusive|exclusive|subject to)\b', re.IGNORECASE),  # Tax/billing notes
        re.compile(r'^(note|please note|kindly note|disclaimer|terms|conditions)\b', re.IGNORECASE),  # Disclaimers
        re.compile(r'\b(wifi|wi-fi|password|ssid|free wifi)\b', re.IGNORECASE),    # WiFi info
        re.compile(r'^[\*\-=_#~]{2,}$'),                               # Decorative separator lines
        re.compile(r'^(our|we|the|a|an)\s+\w+\s*$', re.IGNORECASE),   # Generic tagline starters (short)
        re.compile(r'\b(restaurant|cafe|hotel|dhaba|kitchen|diner|bistro|eatery|lounge|bar)\b', re.IGNORECASE),  # Establishment names
        re.compile(r'^\d{4,}$'),                                        # Long standalone numbers (zip codes etc.)
        re.compile(r'\b(since|est)\s+\d{4}\b', re.IGNORECASE),         # "Since 1990" type lines
        re.compile(r'\b(special offer|discount|% off|combo|deal|buy one|get one|free|today only)\b', re.IGNORECASE),  # Promotions
        re.compile(r'^\s*[\(\[{].*[\)\]}]\s*$'),                       # Lines that are purely parenthetical
        re.compile(r'\b(serves?\s+\d|for\s+\d\s+person|portion)\b', re.IGNORECASE),  # Serving size standalone
        re.compile(r'^(page|pg\.?)\s*\d+\s*$', re.IGNORECASE),        # Page numbers
    ]

    # Extended set of menu section headers / category names to skip
    MENU_HEADERS = {
        'appetizers', 'appetizer', 'starters', 'starter',
        'soups', 'soup', 'salads', 'salad',
        'main course', 'mains', 'main', 'entrees', 'entree',
        'sides', 'sides & salads', 'side dishes',
        'desserts', 'dessert', 'sweets',
        'beverages', 'beverage', 'drinks', 'drink', 'juices', 'juice',
        'lunch specials', 'lunch', 'dinner', 'breakfast', 'brunch',
        'specialties', 'chef specials', 'chef\'s special', 'house special',
        'pizza', 'pizzas', 'pasta', 'pastas', 'burgers', 'burger',
        'sandwiches', 'sandwich', 'wraps', 'wrap',
        'platters', 'platter', 'combos', 'combo',
        'biryani', 'biryanis', 'breads', 'bread', 'naan', 'rotis',
        'rice', 'rice dishes', 'noodles', 'chinese', 'indian',
        'north indian', 'south indian', 'mughlai', 'tandoor', 'tandoori',
        'kebabs', 'kebab', 'kabab', 'kababs', 'grills', 'grill',
        'curries', 'curry', 'gravies', 'gravy',
        'veg', 'non veg', 'non-veg', 'vegetarian', 'vegan',
        'seafood', 'sea food', 'fish', 'prawns',
        'kids menu', 'kids', 'for kids',
        'menu', 'our menu', 'food menu',
        'add-ons', 'add ons', 'extras', 'toppings',
        'mocktails', 'cocktails', 'shakes', 'milkshakes', 'smoothies',
        'hot drinks', 'cold drinks', 'cold beverages', 'hot beverages',
        'tea', 'coffee',
    }

    def _is_non_dish_line(self, line: str) -> bool:
        """Return True if the line looks like non-dish content (header, address, etc.)."""
        line_lower = line.lower().strip()

        # Skip empty or too short
        if len(line_lower) < 3:
            return True

        # Skip known category/section headers
        if line_lower in self.MENU_HEADERS:
            return True

        # Skip lines that match known non-dish patterns
        for pattern in self.NON_DISH_PATTERNS:
            if pattern.search(line):
                return True

        # Skip lines that are ALL CAPS and short (typically headings like "MENU", "BEVERAGES")
        if line.isupper() and len(line.split()) <= 3 and not re.search(r'\d', line):
            return True

        # Skip lines that end with a colon (section headers like "Starters:")
        if re.match(r'^[A-Za-z\s&/\']+:$', line):
            return True

        return False

    def _looks_like_dish(self, name: str, has_price: bool) -> bool:
        """Return True if the name looks like an actual food dish."""
        if not name or len(name.strip()) < 3:
            return False

        name_lower = name.lower().strip()

        # Common food keywords — strong positive signal
        food_keywords = [
            'chicken', 'mutton', 'fish', 'prawn', 'shrimp', 'beef', 'pork', 'lamb', 'egg',
            'paneer', 'tofu', 'cheese', 'veg', 'biryani', 'curry', 'masala', 'tikka', 'kebab',
            'kabab', 'korma', 'dal', 'daal', 'rice', 'naan', 'roti', 'paratha', 'dosa', 'idli',
            'sambar', 'rasam', 'soup', 'salad', 'pasta', 'pizza', 'burger', 'sandwich', 'wrap',
            'roll', 'fries', 'waffle', 'pancake', 'shake', 'smoothie', 'juice', 'coffee', 'tea',
            'latte', 'cappuccino', 'espresso', 'mocha', 'chai', 'lassi', 'buttermilk',
            'cake', 'ice cream', 'sundae', 'brownie', 'pudding', 'pie', 'tart', 'cheesecake',
            'raita', 'chutney', 'papad', 'pickle', 'bread', 'toast', 'omelette', 'steak',
            'grilled', 'roasted', 'fried', 'baked', 'steamed', 'tandoori', 'spicy', 'crispy',
            'stuffed', 'loaded', 'special', 'classic', 'signature', 'house',
            'wings', 'nuggets', 'strips', 'platter', 'combo',
        ]
        if any(kw in name_lower for kw in food_keywords):
            return True

        # If it has a price attached, it's very likely a dish even without food keywords
        if has_price:
            # But reject if it's clearly not a dish name despite having a price
            # (e.g. single word that's a number, or address + price)
            word_count = len(name.split())
            if word_count >= 2:
                return True
            # Single word with price — accept only if it looks like a food name
            if word_count == 1 and len(name) >= 4 and not re.match(r'^\d+$', name):
                return True

        return False

    def _detect_is_veg(self, name: str, description: str) -> bool:
        """Accurately determine if a dish is vegetarian based on name and description."""
        combined = f"{name} {description}".lower()

        # 1. Explicit Non-Veg indicators (highest priority)
        non_veg_patterns = [
            r'\bnon[\s\-_]?veg(etarian)?\b',
            r'\bchicken\b', r'\bmutton\b', r'\blamb\b', r'\bbeef\b', r'\bpork\b',
            r'\bfish\b', r'\bprawns?\b', r'\bshrimp\b', r'\bcrab\b', r'\blobster\b',
            r'\bseafood\b', r'\bsea[\s\-_]food\b', r'\beggs?\b', r'\bomelette\b',
            r'\bmeat\b', r'\bkeema\b', r'\bkheema\b', r'\bseekh\b',
            r'\bduck\b', r'\bturkey\b', r'\bbacon\b', r'\bham\b', r'\bpepperoni\b',
            r'\bsalami\b', r'\btuna\b', r'\bsalmon\b', r'\bwings\b', r'\banchov(y|ies)\b'
        ]

        for pattern in non_veg_patterns:
            if re.search(pattern, combined):
                # Check for explicit mock/veg overrides like "Veg Seekh Kebab", "Mock Chicken", "Soya Tikka"
                if re.search(r'\b(veg|veggie|soya|soy|mock|plant[\s\-_]based)\s+(seekh|kebab|kabab|tikka|meat|chicken|mutton)\b', combined):
                    return True
                return False

        # 2. Check for kebab/tikka dishes with veg items (e.g. Paneer Tikka, Mushroom Kebab)
        if re.search(r'\b(kebab|kabab|tikka)\b', combined):
            if re.search(r'\b(paneer|mushroom|soya|soy|veg|veggie|gobi|hara bhara|corn|aloo)\b', combined):
                return True

        # 3. Explicit Veg indicators
        veg_patterns = [
            r'\bpure[\s\-_]?veg\b', r'\bveg\b', r'\bvegetarian\b', r'\bvegan\b',
            r'\bpaneer\b', r'\btofu\b', r'\bmushroom\b', r'\bsoya\b', r'\bsoy\b',
            r'\bcorn\b', r'\bpotato\b', r'\baloo\b', r'\bspinach\b', r'\bpalak\b',
            r'\bgobi\b', r'\bcauliflower\b', r'\bdal\b', r'\bdaal\b', r'\brajma\b',
            r'\bchole\b', r'\bchana\b', r'\bhara bhara\b', r'\bveggie\b'
        ]

        for pattern in veg_patterns:
            if re.search(pattern, combined):
                return True

        # Default to True (Veg) if ambiguous
        return True

    def parse_text_content(self, content):
        extracted_items = []
        lines = [line.strip() for line in content.split('\n') if line.strip()]

        i = 0
        while i < len(lines):
            line = lines[i]
            if not line or line.startswith('#'):
                i += 1
                continue

            line = re.sub(r'\s+', ' ', line).strip()

            # Filter obvious non-dish content early
            if self._is_non_dish_line(line):
                i += 1
                continue

            name = ""
            description = ""
            price = 150.0
            has_price = False

            # Try to extract price at end of line
            price_at_end_match = re.search(
                r'[\s\.\-_~:,\*]+(?:\$|Rs\.?|₹|INR)?\s*([0-9]+(?:\.[0-9]+)?)\s*$',
                line, re.IGNORECASE
            )

            if price_at_end_match:
                has_price = True
                price = float(price_at_end_match.group(1))
                text_before_price = line[:price_at_end_match.start()].strip()
            else:
                text_before_price = line
                # Try finding price inside delimiters or next line
                parts = None
                for delim in (' - ', ' : ', ' | '):
                    if delim in line:
                        parts = [p.strip() for p in line.split(delim)]
                        break

                if parts:
                    for idx in range(len(parts) - 1, 0, -1):
                        val_str = parts[idx].replace('Rs', '').replace('INR', '').replace('₹', '').replace('$', '').strip()
                        try:
                            price = float(val_str)
                            has_price = True
                            parts.pop(idx)
                            break
                        except ValueError:
                            continue
                    text_before_price = " - ".join(parts)
                else:
                    if i + 1 < len(lines):
                        next_line = re.sub(r'\s+', ' ', lines[i + 1]).strip()
                        next_line_lower = next_line.lower()
                        if next_line_lower not in self.MENU_HEADERS:
                            next_price_match = re.search(
                                r'[\s\.\-_~:,\*]+(?:\$|Rs\.?|₹|INR)?\s*([0-9]+(?:\.[0-9]+)?)\s*$',
                                next_line, re.IGNORECASE
                            )
                            if next_price_match:
                                text_before_price = line
                                price = float(next_price_match.group(1))
                                has_price = True
                                extra_desc = next_line[:next_price_match.start()].strip()
                                if extra_desc:
                                    description = extra_desc
                                i += 1

            # Separate text_before_price into name and description
            if text_before_price:
                delim_found = False
                for delim in (' - ', ' : ', ' | '):
                    if delim in text_before_price:
                        parts = [p.strip() for p in text_before_price.split(delim, 1)]
                        if len(parts) == 2 and parts[0] and parts[1]:
                            name = parts[0]
                            if not description:
                                description = parts[1]
                            delim_found = True
                            break

                if not delim_found:
                    # Check for parenthetical description e.g. "Paneer Tikka (Grilled cottage cheese)"
                    paren_match = re.match(r'^(.*?)\s*[\(\[]([^\]\)]+)[\)\]]\s*$', text_before_price)
                    if paren_match and len(paren_match.group(1).strip()) >= 2:
                        name = paren_match.group(1).strip()
                        if not description:
                            description = paren_match.group(2).strip()
                    else:
                        name = text_before_price.strip()

            name = name.strip()
            description = description.strip()

            # Final validation: must look like a real dish
            if not self._looks_like_dish(name, has_price):
                i += 1
                continue

            # Veg / Non-Veg detection
            is_veg = self._detect_is_veg(name, description)

            extracted_items.append({
                'name': name,
                'description': description or f"Delicious {name}",
                'price': price,
                'is_veg': is_veg,
                'is_available': True
            })
            i += 1

        return extracted_items

    def post(self, request, *args, **kwargs):
        if request.user.role != 'owner':
            return Response({'detail': 'Only restaurant owners can extract menus.'}, status=403)

        restaurant = request.user.restaurants.first()
        if not restaurant:
            return Response({'detail': 'No restaurant found. Register your restaurant first.'}, status=400)

        raw_text = request.data.get('raw_text')
        menu_file = request.FILES.get('menu_file')

        if not menu_file and not raw_text:
            return Response({'detail': 'No file uploaded or raw text provided.'}, status=400)

        extracted_items = []
        parsed_text = ""

        if raw_text:
            parsed_text = raw_text
            extracted_items = self.parse_text_content(parsed_text)
        elif menu_file:
            filename = menu_file.name.lower()
            if filename.endswith('.txt'):
                try:
                    content = menu_file.read().decode('utf-8')
                    parsed_text = content
                    extracted_items = self.parse_text_content(content)
                except Exception as e:
                    print(f"Error parsing text file: {e}")
                    return Response({'detail': 'Failed to read text file.'}, status=400)

            else:
                return Response({'detail': 'Only .txt files are supported. Please upload a plain text menu file.'}, status=400)

        # Allow empty items if we got some parsed text, otherwise error out
        if not parsed_text and not extracted_items:
            return Response({'detail': 'No food items could be parsed. Please check your file format (Name - Price per line).'}, status=400)

        return Response({
            'items': extracted_items,
            'raw_text': parsed_text,
            'count': len(extracted_items),
            'message': f'Successfully extracted {len(extracted_items)} items. Please review and modify them below.' if extracted_items else 'Could not parse items automatically. Please edit the text below and click re-parse.'
        })



class BulkFoodCreateView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = FoodSerializer

    def post(self, request, *args, **kwargs):
        user = request.user
        if user.role != 'owner':
            return Response({'detail': 'Only restaurant owners can add food items.'}, status=403)
        restaurant = user.restaurants.first()
        if not restaurant:
            return Response({'detail': 'No restaurant found for this owner.'}, status=400)

        items = request.data.get('items', [])
        if not isinstance(items, list):
            return Response({'detail': 'Expected a list of items.'}, status=400)

        saved_items = []
        for item_data in items:
            name = item_data.get('name')
            if not name or not name.strip():
                continue
            
            category_name = item_data.get('category_name')
            category = None
            if category_name:
                category, _ = Category.objects.get_or_create(name=category_name)

            food = Food.objects.create(
                restaurant=restaurant,
                name=name,
                description=item_data.get('description', f"Delicious {name}"),
                price=float(item_data.get('price', 150.0)),
                is_veg=item_data.get('is_veg', True),
                is_available=item_data.get('is_available', True),
                category=category
            )
            saved_items.append(FoodSerializer(food).data)

        return Response({
            'items': saved_items,
            'count': len(saved_items),
            'message': f'Successfully added {len(saved_items)} items to your menu.'
        })


class FlavorDuelView(APIView):
    """
    GET /api/foods/duel/
    Returns 2 random food items from approved restaurants.
    Optional query param: city — filter to nearby restaurants.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        import random as rnd
        city = request.query_params.get('city', '').strip()

        # Trigger Swiggy sync if querying a specific city
        if city:
            from restaurants.models import Restaurant
            if not Restaurant.objects.filter(city__iexact=city, swiggy_id__isnull=False).exists():
                try:
                    from restaurants.swiggy_helper import sync_swiggy_restaurants
                    sync_swiggy_restaurants(city_name=city)
                except Exception as e:
                    print(f"Error syncing Swiggy restaurants for city {city}: {e}")

        qs = Food.objects.filter(
            restaurant__status='approved',
            restaurant__is_active=True,
            is_available=True,
        )

        if city:
            qs = qs.filter(
                Q(restaurant__city__icontains=city) |
                Q(restaurant__address__icontains=city)
            )

        # Need at least 2 foods
        ids = list(qs.values_list('id', flat=True))
        if len(ids) < 2:
            # Fallback — drop city filter
            ids = list(Food.objects.filter(
                restaurant__status='approved',
                restaurant__is_active=True,
                is_available=True,
            ).values_list('id', flat=True))

        if len(ids) < 2:
            return Response({'detail': 'Not enough food items for a duel.'}, status=404)

        picked_ids = rnd.sample(ids, 2)
        foods = Food.objects.filter(id__in=picked_ids).select_related('restaurant', 'category')
        serializer = FoodSerializer(foods, many=True)

        # Enrich with restaurant info
        result = []
        for food_data, food_obj in zip(serializer.data, foods):
            food_data['restaurant_name'] = food_obj.restaurant.name
            food_data['restaurant_id'] = food_obj.restaurant.id
            food_data['restaurant_city'] = food_obj.restaurant.city
            food_data['restaurant_cuisine'] = food_obj.restaurant.cuisine
            food_data['restaurant_image'] = food_obj.restaurant.image or ''
            result.append(food_data)

        return Response(result)
