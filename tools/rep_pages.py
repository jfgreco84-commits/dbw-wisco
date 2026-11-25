"""Give every rep their own address and their own link thumbnail.

  <phone-name>/index.html   a tiny page that forwards to the store with that rep attached
  brand/share/<phone-name>.jpg   the picture a phone shows when the link is texted

Reads the roster from config.js. Run by assemble.py; safe to run by hand.
"""
import os, re, html, json
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SITE = ROOT   # the site is the repository root
BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
RESERVED = {"brand", "img", "share", "team", "tools"}


def roster():
    src = open(os.path.join(SITE, "config.js"), encoding="utf8").read()
    block = src[src.index("reps: ["):]
    out = []
    for m in re.finditer(r'\{\s*name:\s*"([^"]+)",[^{}]*?photo:\s*"([^"]*)".*?aka:\s*\[([^\]]*)\]', block):
        aka = re.findall(r'"([^"]+)"', m.group(3))
        em = re.search(r'email:\s*"([^"]*)"', m.group(0)); ce = re.search(r'cell:\s*"([^"]*)"', m.group(0))
        so = re.search(r'solo:\s*true', m.group(0))
        ti = re.search(r'title:\s*"([^"]*)"', m.group(0)); na = re.search(r'national:\s*true', m.group(0))
        if aka and aka[0] not in RESERVED: out.append(dict(solo=bool(so), title=ti.group(1) if ti else "", national=bool(na), name=m.group(1), photo=m.group(2), slug=aka[0], also=[x for x in aka[1:] if x not in RESERVED], email=em.group(1) if em else "", cell=ce.group(1) if ce else ""))
    return out


def font(size):
    try: return ImageFont.truetype(BOLD, size)
    except OSError: return ImageFont.load_default()


def share_image(rep, dest):
    base = Image.open(os.path.join(SITE, "brand", "share.jpg")).convert("RGB")
    d = ImageDraw.Draw(base)
    d.rectangle([0, 40, 700, 600], fill=(9, 22, 58))
    y = 70
    pic = os.path.join(SITE, "brand", "reps", rep["photo"]) if rep["photo"] else ""
    if pic and os.path.exists(pic):
        av = Image.open(pic).convert("RGB").resize((230, 230), Image.LANCZOS)
        mask = Image.new("L", (230, 230), 0); ImageDraw.Draw(mask).ellipse([0, 0, 229, 229], fill=255)
        d.ellipse([56, y - 4, 56 + 237, y + 233], fill=(255, 255, 255))
        base.paste(av, (60, y), mask)
    else:
        ini = "".join(w[0] for w in rep["name"].split()[:2]).upper()
        d.ellipse([56, y - 4, 56 + 237, y + 233], fill=(255, 255, 255)); d.ellipse([60, y, 289, y + 229], fill=(29, 78, 216))
        d.text((175, y + 115), ini, fill="white", font=font(96), anchor="mm")
    name = rep["name"].replace("“", '"').replace("”", '"')
    size = 62
    while size > 30 and d.textlength(name, font=font(size)) > 600: size -= 2
    d.text((60, 330), name, fill="white", font=font(size))
    d.text((60, 410), (rep.get("title") or "YOUR BLADE GUY").upper(), fill=(255, 196, 37), font=font(40 if not rep.get("title") else 36))
    d.text((60, 480), "Reorder diamond blades in 60 seconds.", fill=(214, 224, 255), font=font(27))
    d.text((60, 530), "Diamond Blade Warehouse" if rep.get("national") else "DBW WISCO", fill=(255, 255, 255), font=font(27))
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    base.save(dest, quality=84)


def short_name(name):
    """What shows under the icon on a phone's home screen: first and last name, no nickname in quotes."""
    n = re.sub(r'[“"].*?[”"]\s*', "", name).strip()
    return "Big Frank" if n.startswith("Big Frank") else n


def home_icons(rep):
    """Square icons for 'Add to Home Screen', made from the rep's picture."""
    d = os.path.join(SITE, "brand", "repicon"); os.makedirs(d, exist_ok=True)
    pic = os.path.join(SITE, "brand", "reps", rep["photo"]) if rep["photo"] else ""
    for size in (180, 512):
        if pic and os.path.exists(pic):
            im = Image.open(pic).convert("RGB").resize((size, size), Image.LANCZOS)
        else:
            im = Image.new("RGB", (size, size), (9, 22, 58)); dr = ImageDraw.Draw(im)
            dr.text((size // 2, size // 2), "".join(w[0] for w in rep["name"].split()[:2]).upper(), fill="white", font=font(size // 2), anchor="mm")
        im.quantize(colors=255, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.FLOYDSTEINBERG).save(os.path.join(d, "%s-%d.png" % (rep["slug"], size)), optimize=True)


def build(site_url, full=None):
    """full = the finished index.html. Each rep gets a real copy of the store at /<phone-name>/ with their own
    title, thumbnail, home-screen icon and name, so it can be saved to a phone and always opens as theirs."""
    made = []
    for r in roster():
        slug = r["slug"]
        share_image(r, os.path.join(SITE, "brand", "share", slug + ".jpg")); home_icons(r)
        tagline = (", %s, Diamond Blade Warehouse" % r["title"]) if r.get("title") else ", your blade guy at DBW WISCO"
        name = html.escape(r["name"], quote=True); tagline = html.escape(tagline, quote=True); short = html.escape(short_name(r["name"]), quote=True)
        d = os.path.join(SITE, slug); os.makedirs(d, exist_ok=True)
        json.dump({"name": short_name(r["name"]) + (" · Diamond Blade Warehouse" if r.get("national") else " · DBW WISCO"), "short_name": short_name(r["name"]), "start_url": "./", "scope": "./", "display": "standalone",
                   "background_color": "#071433", "theme_color": "#071433",
                   "icons": [{"src": "../brand/repicon/%s-%d.png" % (slug, z), "sizes": "%dx%d" % (z, z), "type": "image/png"} for z in (180, 512)]},
                  open(os.path.join(d, "manifest.webmanifest"), "w", encoding="utf8"), ensure_ascii=False, indent=1)
        page = full
        def sub(pattern, repl):
            nonlocal page
            page, n = re.subn(pattern, lambda m: repl, page, count=1); assert n == 1, pattern
        sub(r"<head>", '<head>\n<base href="../">')
        # Before the script runs (or where it never does), the page already names the rep, not the owner.
        digits = re.sub(r"\D", "", r.get("cell", ""))[-10:]
        if r.get("email") and len(digits) == 10 and "frank" not in slug:
            pretty = "(%s) %s-%s" % (digits[:3], digits[3:6], digits[6:]); first = html.escape(short_name(r["name"]).split(" ")[0], quote=True)
            page = page.replace("text (414) 213-0084 or email fgreco@diamondbladewarehouse.com", "text %s or email %s" % (pretty, html.escape(r["email"])))
            for a, b in (("Text Frank", "Text " + first), ("Call Frank", "Call " + first), ("Email Frank", "Email " + first), ("Ask Frank", "Ask " + first), ("Big Frank says", first + " says"), ("Hide Big Frank", "Hide " + first)):
                page = page.replace(">" + a + "<", ">" + b + "<").replace('"' + a + '"', '"' + b + '"')
            if r.get("photo"): page = page.replace('src="brand/reps/frank.webp" alt="" width="64" height="64" class="repface" data-askimg', 'src="brand/reps/%s" alt="" width="64" height="64" class="repface" data-askimg' % r["photo"])
        if r.get("national"):   # the United States logo and the full company name, already in place before the script runs
            page = page.replace('src="brand/logo.webp"', 'src="brand/logo-usa.webp"')
            page = page.replace('<span><b>DBW WISCO</b><small>A division of Diamond Blade Warehouse, LLC</small></span>', '<span><b>Diamond Blade <br>Warehouse</b><small><i class="nm">%s · </i>%s</small></span>' % (name, html.escape(r["title"])))
            page = page.replace('aria-label="DBW WISCO home"', 'aria-label="Diamond Blade Warehouse home"').replace('alt="DBW WISCO"', 'alt="Diamond Blade Warehouse"').replace('<b class="footname">DBW WISCO</b>', '<b class="footname">Diamond Blade Warehouse</b>')
            for a, b in (('<span>★ A division of Diamond Blade Warehouse, LLC</span>', '<span data-orig="★ A division of Diamond Blade Warehouse, LLC">★ In business since 1987</span>'),
                         ('<span class="footsub">A division of Diamond Blade Warehouse, LLC. In business since 1987.</span>', '<span class="footsub" data-orig="A division of Diamond Blade Warehouse, LLC. In business since 1987.">Diamond Blade Warehouse, LLC. In business since 1987.</span>')):
                assert page.count(a) == 1, a; page = page.replace(a, b)
            page = page.replace('<html lang="en">', '<html lang="en" class="natl">', 1); assert 'class="natl"' in page and "logo-usa" in page
        if r.get("solo"): page = page.replace(">Text it to Frank<", ">Text it to %s<" % html.escape(short_name(r["name"]).split(" ")[0]))
        sub(r"<title>.*?</title>", "<title>%s%s</title>" % (name, tagline))
        sub(r'<meta name="description" content="[^"]*">', '<meta name="description" content="Reorder diamond blades in 60 seconds. Your order goes straight to %s.">' % name)
        sub(r'<meta property="og:title" content="[^"]*">', '<meta property="og:title" content="%s%s">' % (name, tagline))
        sub(r'<meta property="og:description" content="[^"]*">', '<meta property="og:description" content="Reorder diamond blades in 60 seconds. Your order goes straight to %s.">' % name)
        sub(r'<meta property="og:url" content="[^"]*">', '<meta property="og:url" content="%s%s/">' % (site_url, slug))
        sub(r'<link rel="canonical" href="[^"]*">', '<link rel="canonical" href="%s%s/">' % (site_url, slug))
        sub(r'<meta property="og:image" content="[^"]*">', '<meta property="og:image" content="%sbrand/share/%s.jpg">' % (site_url, slug))
        sub(r'<link rel="icon" href="[^"]*">', '<link rel="icon" href="brand/repicon/%s-180.png">' % slug)
        sub(r'<link rel="apple-touch-icon" href="[^"]*">', '<link rel="apple-touch-icon" href="brand/repicon/%s-180.png">' % slug)
        sub(r'<link rel="manifest" href="[^"]*">', '<link rel="manifest" href="%s/manifest.webmanifest">' % slug)
        sub(r'<meta name="apple-mobile-web-app-title" content="[^"]*">', '<meta name="apple-mobile-web-app-title" content="%s">' % short)
        sub(r'<script>window\.WISCO_VER=', '<script>window.WISCO_REP="%s";</script>\n<script>window.WISCO_VER=' % slug)
        open(os.path.join(d, "index.html"), "w", encoding="utf8").write(page)
        # every other name they go by forwards to their page
        for nm in r.get("also", []):
            ad = os.path.join(SITE, nm); os.makedirs(ad, exist_ok=True)
            open(os.path.join(ad, "index.html"), "w", encoding="utf8").write(
                '<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
                '<title>%s%s</title><meta property="og:title" content="%s%s">'
                '<meta property="og:image" content="%sbrand/share/%s.jpg"><meta name="twitter:card" content="summary_large_image">'
                '<link rel="canonical" href="%s%s/"><meta http-equiv="refresh" content="0; url=../%s/">'
                '<script>location.replace("../%s/" + location.search);</script></head>'
                '<body style="font:16px system-ui;background:#071433;color:#fff;padding:24px"><a style="color:#fff" href="../%s/">Open DBW WISCO with %s</a></body></html>\n'
                % (name, tagline, name, tagline, site_url, slug, site_url, slug, slug, slug, slug, name))
        made.append(slug)
    # The rep tools are not linked anywhere on the site. Reps reach them at <site>/team/.
    d = os.path.join(SITE, "team"); os.makedirs(d, exist_ok=True)
    open(os.path.join(d, "index.html"), "w", encoding="utf8").write(
        '<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex">'
        '<meta name="viewport" content="width=device-width, initial-scale=1"><title>DBW WISCO rep tools</title>'
        '<meta http-equiv="refresh" content="0; url=../?tools=1"><script>location.replace("../?tools=1");</script>'
        '</head><body><a href="../?tools=1">Open the rep tools</a></body></html>\n')
    return made


if __name__ == "__main__":
    import assemble  # noqa: F401  (assemble calls build())
