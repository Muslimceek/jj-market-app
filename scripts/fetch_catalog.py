"""Выгрузка публичного каталога JJ Market (api.jjmarket.kz) для демо-приложения покупателя.

Запуск из папки 10_JJ_Market_App:
    python3 -I scripts/fetch_catalog.py

Сохраняет public/data/catalog.json и картинки в public/data/img/ (уже скачанные не перекачивает).
"""
import json, os, sys, time, urllib.request, concurrent.futures as cf

API = "https://api.jjmarket.kz/api"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "data")
IMG = os.path.join(OUT, "img")
os.makedirs(IMG, exist_ok=True)
UA = {"User-Agent": "jj-demo-app/1.0", "Accept": "application/json"}


def get(path):
    for attempt in range(3):
        try:
            req = urllib.request.Request(API + path, headers=UA)
            with urllib.request.urlopen(req, timeout=40) as r:
                return json.load(r)
        except Exception as e:  # noqa
            if attempt == 2:
                print("  ! fail", path, e, file=sys.stderr)
                return None
            time.sleep(1.5)


def L(s):
    """Строка-JSON {"ru":..,"tr":..} → dict с fallback."""
    if s is None:
        return {}
    if isinstance(s, dict):
        return s
    try:
        v = json.loads(s)
        return v if isinstance(v, dict) else {"ru": str(v)}
    except Exception:
        return {"ru": s}


def local(url_path):
    """/uploads/products/x.webp → data/img/x.webp (+ задание на скачивание)."""
    if not url_path:
        return None
    name = url_path.rsplit("/", 1)[-1]
    JOBS.add(("https://api.jjmarket.kz" + url_path, os.path.join(IMG, name)))
    return "data/img/" + name


JOBS = set()

# ---------- категории ----------
cats_raw = (get("/category/list") or {}).get("data", [])


def cat_node(c):
    return {
        "id": c["id"], "slug": c["slug"], "name": L(c["name"]), "count": c.get("productCount", 0),
        "image": local(c.get("image")), "order": c.get("sortOrder", 0),
        "children": [cat_node(x) for x in sorted(c.get("childCategories") or [], key=lambda x: x.get("sortOrder", 0))],
    }


categories = [cat_node(c) for c in sorted(cats_raw, key=lambda x: x.get("sortOrder", 0))]

# ---------- фильтры, баннер ----------
filters = (get("/catalog/product/public/filters") or {}).get("data", {})
for g in filters.get("groups", []):
    g["name"] = L(g.get("name"))
    for v in g.get("values", []):
        v["name"] = L(v.get("name")) if str(v.get("name", "")).startswith("{") else {"ru": v.get("name"), "tr": v.get("name")}
for b in filters.get("brands", []):
    b["name"] = b.get("label")
sliders = [{"id": s["id"], "image": local(s["picture"]), "link": s.get("linkUrl")} for s in (get("/slider/active") or {}).get("data", [])]

# ---------- товары: список + карточки ----------
items = []
for page in range(1, 6):
    d = get(f"/catalog/product/public?page={page}&dataCount=300")
    if not d or not d.get("data"):
        break
    items += d["data"]
print("list:", len(items))


CACHE = os.path.join(ROOT, "scripts", ".cache")
os.makedirs(CACHE, exist_ok=True)


def detail(slug):
    f = os.path.join(CACHE, slug + ".json")
    if os.path.exists(f):
        return json.load(open(f))
    d = (get("/catalog/product/public/" + slug) or {}).get("data")
    if d:
        json.dump(d, open(f, "w"), ensure_ascii=False)
    return d


slugs = []
seen = set()
for x in items:
    s = x["product"]["slug"]
    if s not in seen:
        seen.add(s)
        slugs.append((s, x))
with cf.ThreadPoolExecutor(4) as ex:
    details = list(ex.map(lambda t: detail(t[0]), slugs))


def money(p, key):
    o = ((p or {}).get(key) or {}).get("converted") or {}
    return o.get("amount") or 0


products = []
for (slug, x), d in zip(slugs, details):
    p = x["product"]
    v0 = x["offerVariants"][0]
    pr = v0.get("pricing") or {}
    sale, pay = money(pr, "salePrice"), money(pr, "payablePrice")
    disc = money(pr, "discountPrice")
    pics = sorted((d or p).get("pictures") or [], key=lambda q: q.get("order", 0))[:6]
    offer = ((d or {}).get("offers") or [{}])[0]
    axes = []
    for a in (d or {}).get("variantAxes") or []:
        axes.append({"slug": a["slug"], "kind": a.get("kind"), "name": L(a.get("name")),
                     "values": [{"id": v["id"], "slug": v["slug"], "name": L(v["name"]) if isinstance(v["name"], (str, dict)) else {}} for v in a.get("values", [])]})
    variants = []
    for ov in offer.get("offerVariants") or []:
        vals = [vv.get("id") for vv in ((ov.get("productVariant") or {}).get("variants") or [])]
        variants.append({"id": ov["id"], "values": vals, "stock": (ov.get("stock") or {}).get("available", ov.get("availableStock", 0)),
                         "price": money(ov.get("pricing"), "payablePrice"), "old": money(ov.get("pricing"), "salePrice") if money(ov.get("pricing"), "discountPrice") else 0})
    feats = [{"name": L(f["extraFeature"]["name"]), "value": L(f.get("valueI18n")) or {"ru": f.get("value")}, "slug": f["extraFeature"].get("slug")}
             for f in sorted((d or {}).get("extraFeatures") or [], key=lambda f: f.get("order", 0)) if f.get("extraFeature")]
    products.append({
        "id": p["id"], "slug": slug, "name": L(p["name"]), "brand": L((p.get("brand") or {}).get("name")).get("ru", ""),
        "seller": (x.get("companyDetail") or {}).get("name", "").strip(),
        "price": pay or sale, "old": sale if disc else 0, "pct": round(100 * disc / sale) if disc and sale else 0,
        "stock": sum(v["stock"] or 0 for v in variants) if variants else v0.get("stockCount", 0),
        "rating": float(p.get("reviewAvg") or 0), "reviews": p.get("reviewCount", 0),
        "badges": [{"slug": b["slug"], "name": L(b["name"]), "color": b.get("color")} for b in p.get("badges") or []],
        "hasVideo": bool(p.get("hasVideo")),
        "images": [local(q["picture"]) for q in pics],
        "categories": [{"id": c["id"], "slug": c["slug"], "name": L(c["name"])} for c in (d or {}).get("categories") or []],
        "desc": L(((d or {}).get("detail") or {}).get("detail")),
        "fit": (d or {}).get("fitType"),
        "features": feats, "axes": axes, "variants": variants,
        "minQty": offer.get("minOrderCount", 1), "maxQty": offer.get("maxOrderCount") or 10,
        "created": x.get("createdAt"),
    })

data = {"source": "api.jjmarket.kz (public)", "fetched": time.strftime("%Y-%m-%d %H:%M"),
        "categories": categories, "filters": filters, "sliders": sliders, "products": products}
json.dump(data, open(os.path.join(OUT, "catalog.json"), "w"), ensure_ascii=False)
print("products:", len(products), "categories:", len(categories), "images to fetch:", len(JOBS))


def dl(job):
    u, f = job
    if os.path.exists(f) and os.path.getsize(f) > 0:
        return 0
    try:
        req = urllib.request.Request(u, headers={"User-Agent": UA["User-Agent"]})
        with urllib.request.urlopen(req, timeout=60) as r, open(f, "wb") as o:
            o.write(r.read())
        return 1
    except Exception as e:  # noqa
        return str(e)


with cf.ThreadPoolExecutor(6) as ex:
    res = list(ex.map(dl, sorted(JOBS)))
print("downloaded:", sum(1 for r in res if r == 1), "errors:", [r for r in res if isinstance(r, str)][:3])
