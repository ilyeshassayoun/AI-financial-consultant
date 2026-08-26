import hmac
import os
from typing import Optional
from fastapi import Header, HTTPException, Depends


def require_llm_access(x_api_key: Optional[str] = Header(default=None)) -> None:
    """Require a deployment secret for paid LLM routes when configured."""
    expected = os.environ.get("LLM_ACCESS_KEY", "")
    if expected and (not x_api_key or not hmac.compare_digest(x_api_key, expected)):
        raise HTTPException(status_code=401, detail="Valid X-API-Key required for AI routes")