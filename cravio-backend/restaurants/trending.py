"""
Trending restaurants logic.

Trending score = weighted combination of:
  - orders in last 30 days  (weight 0.5)
  - average rating           (weight 0.3)
  - total reviews            (weight 0.2)

All normalised to 0-100 then summed to give a single score.
"""
from django.db.models import Count, Sum, Avg, Q
from django.utils import timezone
from datetime import timedelta
from .models import Restaurant
from orders.models import Order


def get_trending_queryset(city: str = None, state: str = None, limit: int = 10):
    """
    Returns a list of dicts with restaurant data + trending_score, sorted descending.
    If city or state is provided, filters to that location first.
    Falls back to national trending when no location match is found.
    """
    since = timezone.now() - timedelta(days=30)

    qs = Restaurant.objects.filter(status='approved', is_active=True)

    # Location filter
    location_filtered = False
    if city:
        city_qs = qs.filter(
            Q(city__iexact=city) |
            Q(city__icontains=city) |
            Q(state__iexact=city)   # handle state typed in city field
        )
        if city_qs.exists():
            qs = city_qs
            location_filtered = True
    if not location_filtered and state:
        state_qs = qs.filter(state__iexact=state)
        if state_qs.exists():
            qs = state_qs
            location_filtered = True

    # Annotate with recent order count
    qs = qs.annotate(
        recent_orders=Count(
            'orders',
            filter=Q(orders__created_at__gte=since),
            distinct=True,
        )
    )

    restaurants = list(qs)
    if not restaurants:
        return [], location_filtered

    # Normalise each metric to 0–100
    max_orders  = max((r.recent_orders for r in restaurants), default=1) or 1
    max_rating  = 5.0
    max_reviews = max((r.total_reviews for r in restaurants), default=1) or 1

    for r in restaurants:
        score_orders  = (r.recent_orders / max_orders) * 100
        score_rating  = (r.average_rating / max_rating) * 100
        score_reviews = (r.total_reviews  / max_reviews) * 100
        r.trending_score = round(
            score_orders  * 0.50 +
            score_rating  * 0.30 +
            score_reviews * 0.20,
            2,
        )

    restaurants.sort(key=lambda r: r.trending_score, reverse=True)
    return restaurants[:limit], location_filtered


def trending_by_state(limit_per_state: int = 3):
    """
    Returns top restaurants grouped by state — used in admin analytics.
    """
    from django.db.models.functions import Lower

    since = timezone.now() - timedelta(days=30)

    qs = (
        Restaurant.objects
        .filter(status='approved', is_active=True)
        .annotate(
            recent_orders=Count(
                'orders',
                filter=Q(orders__created_at__gte=since),
                distinct=True,
            )
        )
    )

    # Group by state
    state_map = {}
    for r in qs:
        state = r.state or 'Unknown'
        if state not in state_map:
            state_map[state] = []
        state_map[state].append(r)

    result = {}
    for state, rests in state_map.items():
        max_orders  = max((r.recent_orders for r in rests), default=1) or 1
        max_rating  = 5.0
        max_reviews = max((r.total_reviews for r in rests), default=1) or 1
        for r in rests:
            r.trending_score = round(
                (r.recent_orders / max_orders) * 50 +
                (r.average_rating / max_rating) * 30 +
                (r.total_reviews  / max_reviews) * 20,
                2,
            )
        rests.sort(key=lambda r: r.trending_score, reverse=True)
        result[state] = rests[:limit_per_state]

    return result
