"""Streamlit entry point for the Solar PV ROI Calculator.

The calculator itself is a static HTML/CSS/JS single-page app (index.html,
styles.css, script.js). Rather than reimplementing it with Streamlit widgets,
this wrapper inlines those files into one self-contained HTML document and
renders it inside Streamlit via an embedded iframe, so all existing
functionality (Chart.js, PDF/PNG export, language switching, etc.) keeps
working unchanged.
"""

import base64
import mimetypes
import re
from pathlib import Path

import streamlit as st
import streamlit.components.v1 as components

APP_DIR = Path(__file__).parent
HTML_FILE = APP_DIR / "index.html"
CSS_FILE = APP_DIR / "styles.css"
JS_FILE = APP_DIR / "script.js"

st.set_page_config(page_title="Solar PV ROI Calculator", page_icon="☀️", layout="wide")


def _data_uri(path: Path) -> str:
    mime, _ = mimetypes.guess_type(path.name)
    mime = mime or "application/octet-stream"
    encoded = base64.b64encode(path.read_bytes()).decode("utf-8")
    return f"data:{mime};base64,{encoded}"


@st.cache_data
def build_standalone_html() -> str:
    html = HTML_FILE.read_text(encoding="utf-8")
    css = CSS_FILE.read_text(encoding="utf-8")
    js = JS_FILE.read_text(encoding="utf-8")

    # Inline the stylesheet.
    html = html.replace(
        '<link rel="stylesheet" href="styles.css">',
        f"<style>\n{css}\n</style>",
    )

    # Inline the script.
    html = html.replace(
        '<script src="script.js"></script>',
        f"<script>\n{js}\n</script>",
    )

    # Inline any local images (e.g. the logo) as data URIs so they resolve
    # inside the sandboxed iframe Streamlit renders the page in.
    def inline_image(match: re.Match) -> str:
        src = match.group(1)
        if src.startswith(("http://", "https://", "data:")):
            return match.group(0)
        img_path = APP_DIR / src
        if not img_path.exists():
            return match.group(0)
        return match.group(0).replace(src, _data_uri(img_path))

    html = re.sub(r'src="([^"]+\.(?:png|jpe?g|svg|gif|webp))"', inline_image, html)

    return html


standalone_html = build_standalone_html()
components.html(standalone_html, height=1600, scrolling=True)
