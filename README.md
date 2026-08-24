# Cravio — Good Food. Great Times.

A full-stack restaurant discovery, ordering, and reservation platform built for India. Customers browse restaurants, order food, and book tables. Owners manage their menus and orders. Admins oversee the platform.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 (Create React App) |
| Backend | Django 4.2 + Django REST Framework |
| Auth | JWT (SimpleJWT) + Google OAuth2 |
| Database | SQLite (dev) — swap to PostgreSQL for production |
| Email | Gmail SMTP via Django's email backend |
| Scheduling | APScheduler (reservation reminders) |
| Maps | Google Maps embed (no API key required) |
| Styling | Inline React styles + CSS variables |

---

## Project Structure

```
Cravio/
├── cravio-backend/          Django REST API
│   ├── cravio/              Project config (settings, urls, wsgi, pagination)
│   ├── users/               Custom User model, JWT auth, Google OAuth
│   ├── restaurants/         Restaurant CRUD, trending analytics, Swiggy sync
│   ├── foods/               Food items & categories
│   ├── cart/                Shopping cart
│   ├── orders/              Order placement & tracking
│   ├── reservations/        Table booking, OTP email, reminders
│   ├── reviews/             Restaurant reviews & ratings
│   ├── mealplanner/         Meal planning feature
│   ├── seed_full.py         Seeds 20 restaurants across 15 Indian states
│   └── setup.py             First-time setup (migrate + create accounts)
│
└── cravio-frontend/         React SPA
    ├── src/
    │   ├── pages/           All page components
    │   ├── components/      Shared components (Navbar, Sidebar, Cards)
    │   ├── context/         AuthContext (user state)
    │   ├── lib/             locationStore.js (persistent location state)
    │   └── api/             Axios instance with JWT interceptors
    └── public/
```

---

## User Roles

| Role | What they can do |
|---|---|
| **Customer** | Browse restaurants, add to cart, checkout, reserve tables, write reviews, wishlist |
| **Owner** | Register restaurant, manage menu, view/update orders, manage reservations |
| **Admin** | Approve/reject restaurants, view all users, see platform analytics & trending |

---

## Features

### Authentication
- **Email + Password** login and registration
- **Google Sign In** — one click, creates account automatically on first use
- JWT access tokens (12hr) + refresh tokens (7 days) stored in localStorage
- `?next=` redirect — after login, user is sent back to where they came from

### Restaurant Discovery
- Browse all approved restaurants with search, cuisine filter, city filter
- **Location-aware** — saves city/state to localStorage, shows nearby restaurants first
- Trending restaurants scored by: orders (50%) + rating (30%) + reviews (20%)
- Admin dashboard shows national trending table + per-state top restaurants

### Restaurant Detail Page
- Hero card with image, cuisine, rating badge, open/closed status, address
- **Menu tab** — food items with category filter, add to cart
- **Photos & Reviews tab** — 200×200 photo grid; click any photo → full-screen overlay with photo + review side by side (Flipkart-style)
- **Info & Map tab** — restaurant details + Google Maps embed
- User-uploaded photos saved to localStorage

### Cart & Checkout
- Cart managed via Django backend (persists across sessions)
- Checkout has structured delivery address: Pincode (auto-fills city/state via India Post API) + GPS detection
- **WELCOME20 coupon** — 20% off on first order (checks order history)
- Payment method selector: COD, UPI, Card, Net Banking
- GST (5%) calculated automatically

### Reservations
- Book a table with date, time, guests, special requests
- Restaurant auto-filled when coming from restaurant detail page
- **OTP verification** — 6-digit OTP sent to email on booking
  - 60-second resend cooldown
  - Can use a different email than account email
- **2-hour reminder** — APScheduler runs every 15 min, sends reminder email to confirmed bookings
- Confirmed reservations show "Email verified" badge

### Orders
- Customer order history with two tabs: **Current Orders** (active) and **Order History** (past)
- Status pipeline: Pending → Accepted → Preparing → Ready → Delivered / Cancelled
- Live status timeline with step indicators
- Reorder button on delivered orders
- Active order count badge on navbar icon

### Wishlist
- Heart icon on every restaurant card saves it to localStorage
- Dedicated `/wishlist` page shows all saved restaurants
- Navbar heart icon goes directly to wishlist page

### Admin Panel
- **Dashboard** — platform stats (restaurants, users, orders, revenue), trending table with score badges, state-selector for per-state top restaurants
- **Manage Restaurants** — approve/reject with optional rejection reason, filter by status
- **Manage Users** — search and filter by role

### Owner Panel
- Register restaurant (with image upload, pincode autofill)
- **Manage Menu** — add/edit/delete food items, bulk import via .txt file
- **Manage Orders** — accept/reject/track orders through pipeline
- **Manage Reservations** — view and manage table bookings

---

## Email System

Uses Gmail SMTP. Configure in `cravio-backend/cravio/settings.py`:

```python
EMAIL_HOST_USER     = 'your@gmail.com'
EMAIL_HOST_PASSWORD = 'your_16_char_app_password'  # Gmail App Password
```

**Emails sent:**
1. **OTP on reservation** — 6-digit code to verify booking
2. **2-hour reminder** — sent before the reservation time

**Automated reminders** — `APScheduler` starts with Django and checks every 15 minutes for upcoming reservations.

---

## Location System

Location is stored in `localStorage` under key `cravio_location`:
```json
{ "city": "Mumbai", "state": "Maharashtra", "pincode": "400001", "display": "Mumbai, Maharashtra" }
```

**Sources (priority order):**
1. Manual selection (navbar pill, trending picker, checkout)
2. GPS detection (Nominatim reverse geocode — no API key)
3. Pincode lookup (India Post API — free)
4. User profile city/state (saved to backend)

**Used for:**
- Navbar location pill
- Trending restaurants section (filters to nearby city)
- Checkout delivery address pre-fill
- Restaurant search (nearby city shown first)

---

## Seed Data

Run once after cloning:

```bash
cd cravio-backend
python setup.py          # creates accounts + runs migrations
python manage.py shell -c "exec(open('seed_full.py').read())"  # seeds restaurants
```

**Seeded data:**
- 20 restaurants across 15 Indian states (Karnataka, Maharashtra, Delhi, Tamil Nadu, Telangana, West Bengal, Rajasthan, Gujarat, Punjab, Kerala, Goa, UP, MP, Assam, and more)
- 100 food items (5 per restaurant, cuisine-matched)
- 2000+ orders, 100+ reviews, dummy reservations

**Test accounts:**

| Email | Password | Role |
|---|---|---|
| cravio.email@gmail.com | admin123 | Admin |
| owner1@cravio.app | owner123 | Owner |
| divya@gmail.com | customer123 | Customer |

---

## Running Locally

**Backend:**
```bash
cd cravio-backend
pip install -r requirements.txt
python setup.py                    # first time only
python manage.py runserver         # starts at http://127.0.0.1:8000
```

**Frontend:**
```bash
cd cravio-frontend
npm install                        # first time only
npm start                          # starts at http://localhost:3000
```

---

## API Overview

| Endpoint | Description |
|---|---|
| `POST /api/users/login/` | Email/password login → JWT tokens |
| `POST /api/users/register/` | Create account |
| `POST /api/users/auth/google/` | Google OAuth → JWT tokens |
| `GET /api/restaurants/` | List restaurants (filterable by city, cuisine, search) |
| `GET /api/restaurants/trending/` | Trending restaurants (scored, location-aware) |
| `GET /api/restaurants/trending/by-state/` | Admin: top restaurants per state |
| `GET /api/foods/?restaurant=<id>` | Menu for a restaurant |
| `GET/POST /api/cart/` | View or add to cart |
| `POST /api/orders/` | Place an order |
| `GET /api/orders/my/` | Customer's order history |
| `POST /api/reservations/` | Create reservation (triggers OTP email) |
| `POST /api/reservations/<id>/verify-otp/` | Confirm reservation with OTP |
| `POST /api/reservations/<id>/resend-otp/` | Resend OTP |
| `GET /api/reviews/?restaurant=<id>` | Reviews for a restaurant |
| `POST /api/reviews/` | Submit a review |
| `GET /api/admin/stats/` | Admin dashboard stats |

---

## Key Files

| File | Purpose |
|---|---|
| `cravio-backend/cravio/settings.py` | All config — DB, email, JWT, installed apps |
| `cravio-backend/cravio/pagination.py` | Flexible pagination (supports `?page_size=N`) |
| `cravio-backend/users/views.py` | Login, register, Google auth, profile, admin stats |
| `cravio-backend/restaurants/views.py` | Restaurant list/detail, trending, approval |
| `cravio-backend/restaurants/trending.py` | Trending score algorithm |
| `cravio-backend/reservations/email_service.py` | OTP and reminder email templates |
| `cravio-backend/reservations/scheduler.py` | APScheduler setup for reminders |
| `cravio-frontend/src/lib/locationStore.js` | Central location store (localStorage) |
| `cravio-frontend/src/context/AuthContext.js` | User auth state + JWT management |
| `cravio-frontend/src/components/Navbar.jsx` | Main navbar with location picker |
| `cravio-frontend/src/pages/RestaurantDetail.jsx` | Full restaurant page with photos/reviews/map |
| `cravio-frontend/src/pages/Checkout.jsx` | Checkout with coupon, address, payment |
| `cravio-frontend/src/pages/Reservations.jsx` | Table booking with OTP flow |

---

## Google OAuth Setup

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. APIs & Services → Credentials → Create OAuth 2.0 Client ID
3. Authorized origins: `http://localhost:3000`
4. Copy Client ID → update `cravio-frontend/src/index.js` (`GOOGLE_CLIENT_ID`)
5. Backend verifies token via Google's userinfo endpoint (no server-side secret needed)

---

## Deployment Notes

- Replace `settings.py` credentials before deploying
- Switch `DATABASE` to PostgreSQL
- Set `DEBUG = False` and configure `ALLOWED_HOSTS`
- The APScheduler starts automatically with Django — no separate worker needed
- For multiple Gunicorn workers, set `--workers=1` to avoid duplicate reminder emails
- `cravio-backend/cravio/settings.example.py` is the safe template (no real credentials)
