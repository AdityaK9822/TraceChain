from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import HTMLResponse, Response

from app.core.report_generator import render_html, render_pdf
from app.db import get_case

router = APIRouter()


@router.get("/report/{case_id}")
def get_report(case_id: str, format: str = Query(default="html", pattern="^(html|pdf)$")):
    case = get_case(case_id)
    if case is None:
        raise HTTPException(status_code=404, detail="Case not found")

    if format == "pdf":
        try:
            pdf_bytes = render_pdf(case)
            return Response(
                content=pdf_bytes,
                media_type="application/pdf",
                headers={"Content-Disposition": f'inline; filename="report-{case_id}.pdf"'},
            )
        except ImportError:
            # weasyprint not installed - fall back to HTML rather than fail the demo.
            pass

    return HTMLResponse(content=render_html(case))
