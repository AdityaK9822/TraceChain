"""Renders an investigation report from a case record.

HTML is the primary output (always available). PDF is produced via
weasyprint if it's installed; otherwise callers should fall back to HTML.
"""

from datetime import datetime, timezone
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape

TEMPLATES_DIR = Path(__file__).resolve().parent.parent / "templates"

_env = Environment(
    loader=FileSystemLoader(TEMPLATES_DIR),
    autoescape=select_autoescape(["html"]),
)


def render_html(case: dict) -> str:
    template = _env.get_template("report.html")
    return template.render(
        case=case,
        generated_at=datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
    )


def render_pdf(case: dict) -> bytes:
    """Raises ImportError if weasyprint isn't installed - caller should catch
    and fall back to `render_html`."""
    from weasyprint import HTML  # noqa: PLC0415 (optional dependency)

    html = render_html(case)
    return HTML(string=html).write_pdf()
