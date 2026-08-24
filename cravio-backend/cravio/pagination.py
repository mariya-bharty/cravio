from rest_framework.pagination import PageNumberPagination


class FlexiblePagination(PageNumberPagination):
    """Allows clients to request up to 500 items via ?page_size=N."""
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 500
