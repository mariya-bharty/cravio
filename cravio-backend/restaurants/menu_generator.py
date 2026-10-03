"""
Realistic menu generation based on restaurant cuisine type.
Used as fallback when Swiggy API is blocked and no real menu is available.
"""

# Each cuisine maps to a list of (name, price, is_veg, category, description) tuples.
# Restaurants get items matched to their actual cuisine tags.

CUISINE_MENUS = {
    'gujarati': [
        ('Khaman Dhokla', 60, True, 'Snacks', 'Soft steamed gram flour cake tempered with mustard seeds and curry leaves'),
        ('Khandvi', 70, True, 'Snacks', 'Thin rolled gram flour layers with coconut and coriander topping'),
        ('Thepla (4 pcs)', 50, True, 'Breads', 'Spiced fenugreek flatbread, a Gujarati staple'),
        ('Dal Dhokli', 120, True, 'Main Course', 'Wheat flour dumplings simmered in a tangy tuvar dal'),
        ('Undhiyu', 180, True, 'Main Course', 'Mixed vegetable casserole with fenugreek dumplings, a Gujarati winter special'),
        ('Handvo', 80, True, 'Snacks', 'Savory lentil and rice cake baked with vegetables'),
        ('Sev Tameta Nu Shaak', 100, True, 'Main Course', 'Tangy tomato curry topped with crispy sev'),
        ('Gujarati Kadhi', 90, True, 'Main Course', 'Sweet and sour yogurt-based gravy with pakora'),
        ('Shrikhand', 80, True, 'Desserts', 'Sweetened strained yogurt with saffron and cardamom'),
        ('Aam Shrikhand', 90, True, 'Desserts', 'Mango-flavored sweetened hung curd dessert'),
        ('Fafda Jalebi', 100, True, 'Snacks', 'Crispy gram flour strips served with fresh hot jalebi'),
        ('Dabeli', 40, True, 'Snacks', 'Spiced potato filling in a pav bun with chutneys and pomegranate'),
        ('Patra', 70, True, 'Snacks', 'Colocasia leaf rolls stuffed with spiced gram flour, steamed and tempered'),
        ('Basundi', 90, True, 'Desserts', 'Thickened sweet milk with nuts, saffron and cardamom'),
        ('Masala Chaas', 30, True, 'Beverages', 'Spiced buttermilk with cumin, mint and coriander'),
    ],

    'snacks': [
        ('Samosa (2 pcs)', 40, True, 'Snacks', 'Crispy pastry filled with spiced potato and peas'),
        ('Pav Bhaji', 90, True, 'Snacks', 'Spiced mashed vegetable curry served with buttered pav'),
        ('Aloo Tikki', 50, True, 'Snacks', 'Crispy pan-fried potato patties with chutney'),
        ('Vada Pav', 30, True, 'Snacks', 'Spiced potato fritter in a pav bun with garlic chutney'),
        ('Panipuri (6 pcs)', 40, True, 'Snacks', 'Hollow puris filled with spiced water and potato'),
        ('Bhel Puri', 50, True, 'Snacks', 'Puffed rice tossed with vegetables, chutneys and sev'),
        ('Sev Puri', 50, True, 'Snacks', 'Flat puris topped with potato, onion, chutneys and sev'),
        ('Ragda Pattice', 70, True, 'Snacks', 'Potato patties topped with spiced white peas curry'),
        ('Dahi Puri', 60, True, 'Snacks', 'Puris filled with potato, yogurt and sweet chutney'),
        ('Masala Corn', 50, True, 'Snacks', 'Sweet corn tossed with butter, lime and spices'),
    ],

    'fast food': [
        ('Veg Burger', 80, True, 'Burgers', 'Potato and vegetable patty with lettuce and mayo'),
        ('Paneer Wrap', 110, True, 'Wraps', 'Spiced cottage cheese wrapped in a flour tortilla'),
        ('French Fries', 70, True, 'Sides', 'Crispy golden potato fries with ketchup'),
        ('Veg Frankie', 60, True, 'Wraps', 'Spiced vegetable filling rolled in a paratha'),
        ('Cheese Grilled Sandwich', 90, True, 'Sandwiches', 'Toasted sandwich with vegetables and melted cheese'),
        ('Aloo Tikki Burger', 70, True, 'Burgers', 'Crispy potato patty burger with mint mayo'),
        ('Masala Fries', 80, True, 'Sides', 'Seasoned fries tossed in Indian spice blend'),
        ('Corn Cheese Balls', 90, True, 'Snacks', 'Deep fried corn and cheese balls, crispy outside'),
        ('Cold Coffee', 70, True, 'Beverages', 'Chilled blended coffee with milk and ice cream'),
        ('Lime Soda', 30, True, 'Beverages', 'Fresh lime juice with soda, salt or sweet'),
    ],

    'south indian': [
        ('Masala Dosa', 90, True, 'South Indian', 'Crispy rice crepe filled with spiced potato, served with sambar and chutney'),
        ('Idli (2 pcs)', 50, True, 'South Indian', 'Steamed rice and lentil cakes served with sambar and coconut chutney'),
        ('Medu Vada (2 pcs)', 60, True, 'South Indian', 'Deep fried lentil doughnuts, crispy outside and soft inside'),
        ('Rava Dosa', 100, True, 'South Indian', 'Thin crispy semolina crepe with onion and green chili'),
        ('Uttapam', 80, True, 'South Indian', 'Thick rice pancake topped with onion, tomato and chili'),
        ('Pongal', 70, True, 'South Indian', 'Savory rice and lentil porridge with black pepper and cumin'),
        ('Filter Coffee', 40, True, 'Beverages', 'Traditional South Indian filter coffee with chicory'),
        ('Rasam', 40, True, 'South Indian', 'Tangy spiced tamarind and tomato broth'),
        ('Curd Rice', 60, True, 'South Indian', 'Cooling yogurt rice tempered with mustard seeds'),
        ('Mysore Pak', 50, True, 'Desserts', 'Rich gram flour fudge made with ghee and sugar'),
    ],

    'north indian': [
        ('Butter Chicken', 280, False, 'Main Course', 'Tender chicken in a rich, creamy tomato gravy'),
        ('Paneer Butter Masala', 240, True, 'Main Course', 'Cottage cheese cubes in a smooth, buttery tomato curry'),
        ('Dal Makhani', 200, True, 'Main Course', 'Slow-cooked black lentils in a creamy butter sauce'),
        ('Butter Naan', 50, True, 'Breads', 'Soft leavened bread baked in tandoor with butter'),
        ('Chicken Tikka', 260, False, 'Starters', 'Boneless chicken marinated in yogurt and spices, grilled in tandoor'),
        ('Chole Bhature', 130, True, 'Main Course', 'Spiced chickpea curry with deep fried puffed bread'),
        ('Aloo Gobi', 180, True, 'Main Course', 'Potato and cauliflower dry curry with turmeric and cumin'),
        ('Raita', 50, True, 'Sides', 'Seasoned yogurt with cucumber and mild spices'),
        ('Gulab Jamun (2 pcs)', 60, True, 'Desserts', 'Deep fried milk dumplings soaked in sugar syrup'),
        ('Lassi', 60, True, 'Beverages', 'Chilled sweet yogurt drink blended with cardamom'),
    ],

    'biryani': [
        ('Chicken Dum Biryani', 280, False, 'Biryani', 'Layered basmati rice slow-cooked with spiced chicken on dum'),
        ('Mutton Biryani', 320, False, 'Biryani', 'Fragrant rice layered with tender mutton and whole spices'),
        ('Veg Biryani', 200, True, 'Biryani', 'Aromatic rice cooked with mixed vegetables and biryani spices'),
        ('Paneer Biryani', 240, True, 'Biryani', 'Basmati rice with marinated paneer and saffron'),
        ('Egg Biryani', 220, False, 'Biryani', 'Spiced rice with boiled eggs and biryani masala'),
        ('Raita', 50, True, 'Sides', 'Cool yogurt with onion, tomato and mint'),
        ('Mirchi Ka Salan', 90, True, 'Sides', 'Spicy peanut and sesame gravy with green chilies'),
        ('Chicken 65', 220, False, 'Starters', 'Deep fried spiced chicken with curry leaves and chilies'),
        ('Double Ka Meetha', 80, True, 'Desserts', 'Bread pudding soaked in saffron milk, a Hyderabadi classic'),
        ('Phirni', 70, True, 'Desserts', 'Ground rice pudding set in clay pots with cardamom'),
    ],

    'mughlai': [
        ('Mutton Korma', 320, False, 'Main Course', 'Tender mutton slow-cooked in a rich yogurt and onion gravy'),
        ('Seekh Kebab (4 pcs)', 240, False, 'Starters', 'Minced meat skewers grilled with herbs and spices'),
        ('Chicken Changezi', 280, False, 'Main Course', 'Chicken in a spiced tomato and onion-based gravy'),
        ('Shahi Paneer', 220, True, 'Main Course', 'Paneer in a rich cream and nut-based curry'),
        ('Galouti Kebab (4 pcs)', 260, False, 'Starters', 'Melt-in-mouth minced meat patties with aromatic spices'),
        ('Roomali Roti', 40, True, 'Breads', 'Paper-thin handkerchief bread'),
        ('Sheermal', 50, True, 'Breads', 'Sweet saffron-flavored oven-baked bread'),
        ('Shahi Tukda', 90, True, 'Desserts', 'Fried bread slices soaked in syrup and topped with rabri'),
        ('Kashmiri Pulao', 200, True, 'Rice', 'Fragrant rice with dry fruits and mild spices'),
        ('Phirni', 70, True, 'Desserts', 'Creamy ground rice pudding in earthen pots'),
    ],

    'chinese': [
        ('Veg Manchurian', 150, True, 'Starters', 'Deep fried vegetable balls in a tangy soy-based sauce'),
        ('Chicken Manchurian', 180, False, 'Starters', 'Fried chicken balls tossed in spicy Indo-Chinese sauce'),
        ('Veg Hakka Noodles', 140, True, 'Noodles', 'Stir-fried noodles with vegetables and soy sauce'),
        ('Chicken Fried Rice', 170, False, 'Rice', 'Wok-tossed rice with chicken, egg and vegetables'),
        ('Spring Roll (4 pcs)', 120, True, 'Starters', 'Crispy rolls filled with cabbage and carrot'),
        ('Chilli Paneer', 180, True, 'Starters', 'Paneer cubes tossed with bell peppers in chilli sauce'),
        ('Hot and Sour Soup', 100, True, 'Soups', 'Spicy and tangy vegetable broth with tofu'),
        ('Schezwan Fried Rice', 160, True, 'Rice', 'Spicy rice stir-fried with schezwan sauce and vegetables'),
        ('Dim Sum (6 pcs)', 150, True, 'Starters', 'Steamed dumplings with vegetable filling'),
        ('Honey Chilli Potato', 130, True, 'Starters', 'Crispy potato fingers in a sweet and spicy glaze'),
    ],

    'italian': [
        ('Margherita Pizza', 280, True, 'Pizza', 'Classic pizza with tomato sauce, mozzarella and fresh basil'),
        ('Penne Arrabbiata', 250, True, 'Pasta', 'Penne in spicy tomato sauce with garlic and chili'),
        ('Alfredo Pasta', 270, True, 'Pasta', 'Creamy white sauce pasta with parmesan'),
        ('Bruschetta', 180, True, 'Starters', 'Toasted bread topped with tomato, basil and olive oil'),
        ('Garlic Bread', 120, True, 'Starters', 'Toasted bread with garlic butter and herbs'),
        ('Tiramisu', 220, True, 'Desserts', 'Coffee-soaked ladyfinger layered with mascarpone cream'),
        ('Minestrone Soup', 150, True, 'Soups', 'Italian vegetable soup with beans and pasta'),
        ('Caprese Salad', 200, True, 'Salads', 'Fresh mozzarella, tomato and basil with olive oil'),
        ('Panini', 210, True, 'Sandwiches', 'Grilled Italian bread with vegetables and cheese'),
        ('Chicken Parmigiana', 320, False, 'Main Course', 'Breaded chicken topped with tomato sauce and melted cheese'),
    ],

    'cafe': [
        ('Cappuccino', 120, True, 'Beverages', 'Rich espresso with steamed milk foam'),
        ('Cold Coffee', 140, True, 'Beverages', 'Chilled blended coffee with ice cream'),
        ('Club Sandwich', 200, True, 'Sandwiches', 'Triple-decker sandwich with vegetables and cheese'),
        ('Paneer Tikka Sandwich', 180, True, 'Sandwiches', 'Grilled sandwich with spiced paneer filling'),
        ('Chocolate Brownie', 150, True, 'Desserts', 'Warm fudgy brownie served with vanilla ice cream'),
        ('Croissant', 100, True, 'Bakery', 'Flaky, buttery French pastry'),
        ('Caesar Salad', 220, True, 'Salads', 'Romaine lettuce with croutons and parmesan dressing'),
        ('Masala Chai', 50, True, 'Beverages', 'Indian spiced tea with ginger and cardamom'),
        ('Fresh Fruit Smoothie', 160, True, 'Beverages', 'Blended seasonal fruits with yogurt'),
        ('Cheese Garlic Toast', 130, True, 'Snacks', 'Toasted bread with melted cheese and garlic'),
    ],

    'seafood': [
        ('Fish Fry', 250, False, 'Starters', 'Crispy fried fish fillets marinated in coastal spices'),
        ('Prawn Masala', 320, False, 'Main Course', 'Prawns cooked in a spicy onion-tomato gravy'),
        ('Fish Curry Rice', 280, False, 'Main Course', 'Traditional fish curry served with steamed rice'),
        ('Crab Masala', 380, False, 'Main Course', 'Fresh crab cooked in a thick spiced gravy'),
        ('Prawn Fry', 300, False, 'Starters', 'Pan-fried prawns with pepper and curry leaves'),
        ('Fish Tikka', 270, False, 'Starters', 'Boneless fish marinated in yogurt spices and grilled'),
        ('Squid Fry', 260, False, 'Starters', 'Crispy fried calamari with lemon and spices'),
        ('Pomfret Tawa Fry', 350, False, 'Main Course', 'Whole pomfret pan-fried with coastal masala'),
        ('Fish Biryani', 300, False, 'Biryani', 'Fragrant rice layered with spiced fish pieces'),
        ('Solkadhi', 50, True, 'Beverages', 'Coconut milk and kokum digestive drink'),
    ],

    'street food': [
        ('Pav Bhaji', 90, True, 'Main Course', 'Spiced mashed vegetable curry with toasted pav'),
        ('Vada Pav', 30, True, 'Snacks', 'Spiced potato fritter in a pav with garlic chutney'),
        ('Pani Puri (6 pcs)', 40, True, 'Snacks', 'Hollow puris filled with spiced water and potato'),
        ('Sev Puri', 50, True, 'Snacks', 'Flat puris with potato, onion, chutneys and sev'),
        ('Bhel Puri', 50, True, 'Snacks', 'Puffed rice mixed with vegetables and tangy chutneys'),
        ('Chole Kulche', 80, True, 'Main Course', 'Spiced chickpeas with soft leavened bread'),
        ('Aloo Tikki Chaat', 60, True, 'Snacks', 'Crispy potato patties with yogurt and chutneys'),
        ('Dahi Bhalla', 60, True, 'Snacks', 'Lentil dumplings in sweetened yogurt with tamarind'),
        ('Ragda Pattice', 70, True, 'Snacks', 'Potato patties topped with white peas curry'),
        ('Masala Soda', 30, True, 'Beverages', 'Fizzy soda with lime, salt and cumin'),
    ],

    'sweets': [
        ('Gulab Jamun (2 pcs)', 50, True, 'Sweets', 'Soft milk dumplings soaked in rose-flavored sugar syrup'),
        ('Kaju Katli (250g)', 200, True, 'Sweets', 'Thin diamond-shaped cashew nut fudge'),
        ('Rasgulla (2 pcs)', 50, True, 'Sweets', 'Soft cottage cheese balls in light sugar syrup'),
        ('Jalebi', 60, True, 'Sweets', 'Crispy deep-fried spirals soaked in warm sugar syrup'),
        ('Mohanthal (250g)', 180, True, 'Sweets', 'Gram flour fudge with ghee and cardamom'),
        ('Barfi (250g)', 160, True, 'Sweets', 'Dense milk fudge flavored with cardamom and nuts'),
        ('Peda (4 pcs)', 80, True, 'Sweets', 'Soft milk-based sweet with saffron and pistachios'),
        ('Motichoor Ladoo (2 pcs)', 60, True, 'Sweets', 'Tiny boondi balls pressed into round sweets'),
        ('Ghevar', 100, True, 'Sweets', 'Honeycomb-shaped Rajasthani sweet soaked in syrup'),
        ('Mysore Pak', 80, True, 'Sweets', 'Rich gram flour sweet made with ghee'),
    ],

    'desserts': [
        ('Chocolate Brownie', 120, True, 'Desserts', 'Warm fudgy chocolate brownie'),
        ('Gulab Jamun (2 pcs)', 60, True, 'Desserts', 'Soft milk dumplings in rose sugar syrup'),
        ('Ice Cream Sundae', 150, True, 'Desserts', 'Vanilla ice cream with chocolate sauce and nuts'),
        ('Rasgulla (2 pcs)', 50, True, 'Desserts', 'Spongy cottage cheese balls in sugar syrup'),
        ('Cheesecake Slice', 180, True, 'Desserts', 'Creamy baked cheesecake with berry compote'),
        ('Mango Kulfi', 80, True, 'Desserts', 'Traditional Indian frozen milk dessert with mango'),
        ('Rabri', 70, True, 'Desserts', 'Thickened sweetened milk with cardamom and nuts'),
        ('Pastry', 100, True, 'Desserts', 'Fresh cream pastry with seasonal fruit'),
        ('Kheer', 60, True, 'Desserts', 'Slow-cooked rice pudding with saffron and nuts'),
        ('Jalebi with Rabri', 80, True, 'Desserts', 'Hot crispy jalebi served with chilled rabri'),
    ],

    'pizza': [
        ('Margherita Pizza', 200, True, 'Pizza', 'Classic tomato sauce, mozzarella and fresh basil'),
        ('Farmhouse Pizza', 280, True, 'Pizza', 'Loaded with capsicum, onion, tomato and mushroom'),
        ('Paneer Tikka Pizza', 300, True, 'Pizza', 'Tandoori paneer with onion and capsicum'),
        ('Peppy Paneer Pizza', 260, True, 'Pizza', 'Paneer, capsicum and spicy red paprika'),
        ('Cheese Burst Pizza', 320, True, 'Pizza', 'Extra cheese-filled crust with mozzarella topping'),
        ('Garlic Breadsticks', 120, True, 'Sides', 'Toasted bread sticks with garlic butter'),
        ('Pasta Alfredo', 220, True, 'Pasta', 'Penne in creamy white sauce'),
        ('Chocolate Lava Cake', 130, True, 'Desserts', 'Warm chocolate cake with molten center'),
        ('Cold Drink', 50, True, 'Beverages', 'Chilled aerated beverage'),
        ('Chicken BBQ Pizza', 340, False, 'Pizza', 'BBQ chicken with onion and jalapeno'),
    ],

    'burgers': [
        ('Classic Veg Burger', 100, True, 'Burgers', 'Potato patty with lettuce, tomato and mayo'),
        ('Paneer Burger', 130, True, 'Burgers', 'Grilled paneer patty with spicy mayo'),
        ('Chicken Burger', 150, False, 'Burgers', 'Grilled chicken patty with cheese and lettuce'),
        ('Cheese Fries', 110, True, 'Sides', 'Golden fries topped with melted cheese sauce'),
        ('Onion Rings', 90, True, 'Sides', 'Crispy battered onion rings'),
        ('Chicken Wings (6 pcs)', 200, False, 'Sides', 'Crispy fried chicken wings with dip'),
        ('Aloo Tikki Burger', 80, True, 'Burgers', 'Crispy potato patty in a sesame bun'),
        ('Milkshake', 120, True, 'Beverages', 'Thick creamy milkshake, choose your flavor'),
        ('Brownie Sundae', 150, True, 'Desserts', 'Warm brownie with vanilla ice cream'),
        ('Cold Coffee', 100, True, 'Beverages', 'Blended chilled coffee with cream'),
    ],

    'bakery': [
        ('Croissant', 80, True, 'Bakery', 'Flaky, buttery layered pastry'),
        ('Chocolate Muffin', 70, True, 'Bakery', 'Moist chocolate muffin with choco chips'),
        ('Fruit Cake Slice', 90, True, 'Bakery', 'Soft cake with mixed dried fruits'),
        ('Garlic Bread', 100, True, 'Bakery', 'Toasted bread with garlic butter and herbs'),
        ('Puff Pastry', 50, True, 'Bakery', 'Flaky pastry with vegetable filling'),
        ('Brownie', 90, True, 'Bakery', 'Dense, fudgy chocolate brownie'),
        ('Cookie (2 pcs)', 60, True, 'Bakery', 'Freshly baked butter cookies'),
        ('Cheese Toast', 70, True, 'Bakery', 'Toasted bread with melted cheese'),
        ('Banana Bread', 80, True, 'Bakery', 'Moist bread with ripe banana and walnuts'),
        ('Vanilla Cupcake', 60, True, 'Bakery', 'Soft cupcake with vanilla buttercream'),
    ],

    'ice cream': [
        ('Vanilla Scoop', 60, True, 'Ice Cream', 'Classic vanilla bean ice cream'),
        ('Chocolate Fudge', 80, True, 'Ice Cream', 'Rich chocolate ice cream with fudge swirl'),
        ('Mango Delight', 90, True, 'Ice Cream', 'Fresh Alphonso mango ice cream'),
        ('Butterscotch', 70, True, 'Ice Cream', 'Creamy butterscotch ice cream with crunchy bits'),
        ('Strawberry', 70, True, 'Ice Cream', 'Sweet strawberry ice cream'),
        ('Kesar Pista', 90, True, 'Ice Cream', 'Saffron and pistachio flavored kulfi-style ice cream'),
        ('Sundae', 120, True, 'Ice Cream', 'Ice cream with chocolate sauce, nuts and cherry'),
        ('Faluda', 100, True, 'Ice Cream', 'Rose milk with vermicelli, basil seeds and ice cream'),
        ('Sitaphal (Seasonal)', 100, True, 'Ice Cream', 'Custard apple ice cream, available in season'),
        ('Dry Fruit Sundae', 140, True, 'Ice Cream', 'Premium ice cream topped with assorted dry fruits'),
    ],

    'beverages': [
        ('Fresh Lime Soda', 40, True, 'Beverages', 'Lime juice with soda, salt or sweet'),
        ('Masala Chai', 30, True, 'Beverages', 'Indian spiced tea with ginger'),
        ('Cold Coffee', 100, True, 'Beverages', 'Chilled blended coffee with ice cream'),
        ('Mango Lassi', 80, True, 'Beverages', 'Thick mango yogurt smoothie'),
        ('Fresh Orange Juice', 90, True, 'Beverages', 'Freshly squeezed orange juice'),
        ('Oreo Milkshake', 120, True, 'Beverages', 'Thick milkshake with crushed Oreo cookies'),
        ('Hot Chocolate', 110, True, 'Beverages', 'Rich cocoa drink with steamed milk'),
        ('Iced Tea', 70, True, 'Beverages', 'Chilled lemon tea served over ice'),
        ('Watermelon Juice', 60, True, 'Beverages', 'Fresh watermelon juice with a hint of mint'),
        ('Badam Milk', 70, True, 'Beverages', 'Warm almond-flavored milk with saffron'),
    ],

    'rajasthani': [
        ('Dal Baati Churma', 220, True, 'Main Course', 'Baked wheat balls with five-lentil dal and sweet churma'),
        ('Gatte Ki Sabzi', 160, True, 'Main Course', 'Gram flour dumplings in a spiced yogurt curry'),
        ('Ker Sangri', 180, True, 'Main Course', 'Desert berries and beans cooked with yogurt and spices'),
        ('Pyaaz Kachori', 50, True, 'Snacks', 'Flaky pastry stuffed with spiced onion filling'),
        ('Bajre Ki Roti', 30, True, 'Breads', 'Pearl millet flatbread, a Rajasthani staple'),
        ('Mirchi Bada', 40, True, 'Snacks', 'Stuffed chili fritter with potato filling'),
        ('Laal Maas', 300, False, 'Main Course', 'Fiery red mutton curry from Rajasthan'),
        ('Ghewar', 80, True, 'Desserts', 'Honeycomb sweet cake soaked in sugar syrup'),
        ('Mawa Kachori', 60, True, 'Desserts', 'Sweet pastry stuffed with khoya and dry fruits'),
        ('Chaach', 30, True, 'Beverages', 'Traditional Rajasthani spiced buttermilk'),
    ],

    'thalis': [
        ('Special Thali', 200, True, 'Thali', 'Complete meal with dal, 2 vegetables, rice, roti, pickle and sweet'),
        ('Punjabi Thali', 250, True, 'Thali', 'Dal makhani, paneer, rice, naan, raita and dessert'),
        ('Gujarati Thali', 220, True, 'Thali', 'Dal, kadhi, vegetables, rotli, rice, farsan and sweet'),
        ('South Indian Thali', 200, True, 'Thali', 'Sambar, rasam, vegetables, rice, curd and payasam'),
        ('Rajasthani Thali', 280, True, 'Thali', 'Dal baati, gatte, ker sangri, bajra roti and churma'),
        ('Mini Thali', 150, True, 'Thali', 'Light meal with dal, one vegetable, rice and roti'),
        ('Kathiyawadi Thali', 250, True, 'Thali', 'Spicy regional thali with ringan, rotla and garlic chutney'),
        ('Curd Rice', 60, True, 'Sides', 'Cooling yogurt rice'),
        ('Papad', 20, True, 'Sides', 'Crispy roasted lentil wafer'),
        ('Buttermilk', 30, True, 'Beverages', 'Refreshing spiced yogurt drink'),
    ],

    'wraps': [
        ('Paneer Tikka Roll', 120, True, 'Wraps', 'Spiced paneer wrapped in a soft paratha'),
        ('Chicken Seekh Roll', 140, False, 'Wraps', 'Grilled chicken seekh kebab in a paratha wrap'),
        ('Egg Roll', 80, False, 'Wraps', 'Egg omelette wrapped in paratha with onion and chutney'),
        ('Veg Frankie', 70, True, 'Wraps', 'Mixed vegetable filling in a spiced paratha'),
        ('Aloo Tikki Roll', 60, True, 'Wraps', 'Crispy potato patty rolled in paratha'),
        ('Chicken Tikka Roll', 140, False, 'Wraps', 'Tandoori chicken pieces wrapped in paratha'),
        ('Cheese Roll', 90, True, 'Wraps', 'Melted cheese with vegetables in a paratha'),
        ('Double Egg Roll', 100, False, 'Wraps', 'Two eggs rolled in paratha with onion and sauce'),
        ('Mushroom Roll', 100, True, 'Wraps', 'Sauteed mushrooms wrapped in paratha'),
        ('Cold Drink', 40, True, 'Beverages', 'Chilled aerated beverage'),
    ],

    'sandwich': [
        ('Veg Club Sandwich', 140, True, 'Sandwiches', 'Triple-decker sandwich with vegetables and cheese'),
        ('Grilled Cheese Sandwich', 100, True, 'Sandwiches', 'Toasted bread with melted cheese'),
        ('Paneer Tikka Sandwich', 150, True, 'Sandwiches', 'Grilled sandwich with spiced paneer'),
        ('Corn Cheese Sandwich', 130, True, 'Sandwiches', 'Sweet corn and cheese in grilled bread'),
        ('Bombay Sandwich', 60, True, 'Sandwiches', 'Mumbai-style layered vegetable sandwich with chutney'),
        ('Mushroom Sandwich', 120, True, 'Sandwiches', 'Sauteed mushrooms in toasted bread'),
        ('Chocolate Sandwich', 80, True, 'Sandwiches', 'Toasted bread with chocolate spread'),
        ('Aloo Masala Sandwich', 70, True, 'Sandwiches', 'Spiced potato filling in toasted bread'),
        ('French Fries', 80, True, 'Sides', 'Crispy golden fries'),
        ('Cold Coffee', 90, True, 'Beverages', 'Chilled blended coffee'),
    ],
}


def get_menu_for_restaurant(restaurant):
    """
    Returns a list of menu item dicts appropriate for the restaurant's cuisine.
    Prioritizes the PRIMARY cuisine (first 1-2 tags) and only fills remaining
    slots with secondary cuisine items. Avoids non-veg for pure-veg restaurants.
    """
    import random

    cuisine_str = (restaurant.cuisine or '').lower()
    cuisine_tags = [t.strip() for t in cuisine_str.replace('&', ',').split(',') if t.strip()]

    # Determine if the restaurant is likely pure-veg
    veg_indicators = ['gujarati', 'sweets', 'south indian', 'jain', 'veg', 'vegetarian',
                      'bakery', 'ice cream', 'desserts', 'snacks', 'thalis']
    non_veg_indicators = ['chicken', 'fish', 'seafood', 'meat', 'kebab', 'mughlai',
                          'biryani', 'non-veg', 'non veg']

    name_lower = (restaurant.name or '').lower()

    is_likely_veg = (
        any(vi in cuisine_str for vi in veg_indicators) and
        not any(nvi in cuisine_str for nvi in non_veg_indicators)
    )

    # Check restaurant name for veg clues
    veg_name_clues = ['khaman', 'dhokla', 'sweets', 'sweet', 'mithai', 'farsan',
                      'thali', 'veg', 'pure veg', 'jain', 'saravana', 'udupi',
                      'bhavan', 'sagar', 'idli', 'dosa', 'bakery', 'cake', 'ice cream',
                      'cakes', 'dessert', 'cookie', 'pastry', 'brownie']
    if any(clue in name_lower for clue in veg_name_clues):
        is_likely_veg = True

    # Non-veg name clues override
    nonveg_name_clues = ['kfc', 'chicken', 'kebab', 'mutton', 'fish', 'seafood']
    if any(clue in name_lower for clue in nonveg_name_clues):
        is_likely_veg = False

    def match_tag(tag):
        """Find matching CUISINE_MENUS key for a given tag."""
        tag = tag.strip().lower()
        if tag in CUISINE_MENUS:
            return tag
        for key in CUISINE_MENUS:
            if key in tag or tag in key:
                return key
        return None

    # Split tags into primary (first 1-2) and secondary (rest)
    primary_tags = cuisine_tags[:2] if len(cuisine_tags) >= 2 else cuisine_tags[:]
    secondary_tags = cuisine_tags[2:] if len(cuisine_tags) > 2 else []

    # Resolve to actual menu keys
    primary_keys = []
    for tag in primary_tags:
        key = match_tag(tag)
        if key and key not in primary_keys:
            primary_keys.append(key)

    secondary_keys = []
    for tag in secondary_tags:
        key = match_tag(tag)
        if key and key not in primary_keys and key not in secondary_keys:
            secondary_keys.append(key)

    # Collect primary items (these get priority)
    primary_items = []
    for key in primary_keys:
        primary_items.extend(CUISINE_MENUS[key])

    # Collect secondary items (only used to fill gaps)
    secondary_items = []
    for key in secondary_keys:
        secondary_items.extend(CUISINE_MENUS[key])

    # If no primary match, try all tags as primary
    if not primary_items:
        for tag in cuisine_tags:
            key = match_tag(tag)
            if key:
                primary_items.extend(CUISINE_MENUS[key])

    # If still nothing, use a generic menu
    if not primary_items and not secondary_items:
        primary_items.extend(CUISINE_MENUS.get('north indian', []))

    # Filter non-veg if restaurant is pure veg
    if is_likely_veg:
        primary_items = [item for item in primary_items if item[2]]
        secondary_items = [item for item in secondary_items if item[2]]

    # Deduplicate primary items
    seen = set()
    unique_primary = []
    for item in primary_items:
        k = item[0].lower()
        if k not in seen:
            seen.add(k)
            unique_primary.append(item)

    # Deduplicate secondary items (excluding already-seen names)
    unique_secondary = []
    for item in secondary_items:
        k = item[0].lower()
        if k not in seen:
            seen.add(k)
            unique_secondary.append(item)

    # Build final menu: mostly primary, fill remaining with secondary
    TARGET = 12
    final = []

    if len(unique_primary) >= TARGET:
        final = random.sample(unique_primary, TARGET)
    else:
        final = list(unique_primary)
        remaining = TARGET - len(final)
        if remaining > 0 and unique_secondary:
            fill = min(remaining, len(unique_secondary))
            final.extend(random.sample(unique_secondary, fill))

    return [
        {
            'name': item[0],
            'price': item[1],
            'is_veg': item[2],
            'category_name': item[3],
            'description': item[4],
            'is_available': True,
        }
        for item in final
    ]

