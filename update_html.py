import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Replace SVG with img
svg_pattern = r'<svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">.*?</svg>'
img_tag = '<img src="logo.png" style="height:26px;width:auto;border-radius:4px;" alt="Colsubsidio">'
html = re.sub(svg_pattern, img_tag, html, flags=re.DOTALL)

# Add favicon
title_pattern = '<title>'
favicon_tag = '<link rel="icon" type="image/png" href="favicon.png"> <title>'
html = html.replace(title_pattern, favicon_tag)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
