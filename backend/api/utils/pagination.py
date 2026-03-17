# utils/pagination.py (or inside views.py)
def parse_pagination(request, default_size=10, max_size=100):
    try:
        page = int(request.GET.get("page", "1"))
    except:
        page = 1
    try:
        page_size = int(request.GET.get("page_size", str(default_size)))
    except:
        page_size = default_size

    if page < 1: page = 1
    if page_size < 1: page_size = default_size
    if page_size > max_size: page_size = max_size

    offset = (page - 1) * page_size
    return page, page_size, offset
 