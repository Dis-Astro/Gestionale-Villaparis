"""
Proxy: Emergent routing → porta 8001 → Next.js porta 3000
Il Kubernetes ingress instrada /api/* → porta 8001 (potrebbe o meno strippare il prefisso /api)
"""
import httpx
from fastapi import FastAPI, Request
from fastapi.responses import Response
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("proxy")

app = FastAPI()
TARGET = "http://localhost:3000"

@app.api_route("/{path:path}", methods=["GET","POST","PUT","DELETE","PATCH","HEAD","OPTIONS"])
async def proxy(request: Request, path: str):
    # Ricostruisce URL completo per Next.js
    full_path = f"/api/{path}" if not path.startswith("api/") else f"/{path}"
    qs = request.url.query
    url = f"{TARGET}{full_path}"
    if qs:
        url += f"?{qs}"
    
    logger.info(f"{request.method} received path=/{path} → forwarding to {url}")
    
    headers = {k: v for k, v in request.headers.items() if k.lower() not in ("host", "content-length")}
    body = await request.body()
    
    async with httpx.AsyncClient(follow_redirects=False, timeout=60.0) as client:
        r = await client.request(
            method=request.method,
            url=url,
            headers=headers,
            content=body
        )
    
    logger.info(f"Response: {r.status_code} for {url}")
    return Response(
        content=r.content,
        status_code=r.status_code,
        headers=dict(r.headers),
        media_type=r.headers.get("content-type")
    )
