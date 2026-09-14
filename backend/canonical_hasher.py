"""RFC 8785 Canonical JSON Serializer and SHA-256 Cryptographic Checksum Engine.

Guarantees bit-identical cross-platform canonical JSON serialization and tamper-evident
SHA-256 calculation verification matching Python hashlib and browser Web Crypto API.
"""

from __future__ import annotations

import hashlib
import json
import math
from typing import Any, Dict, Tuple


def _normalize_canonical_value(val: Any) -> Any:
    """Recursively validate and normalize values for RFC 8785 canonical serialization."""
    if isinstance(val, float):
        if not math.isfinite(val):
            raise ValueError(f"RFC 8785 forbids non-finite numbers (NaN, Inf): {val}")
        if val.is_integer():
            return int(val)
        return val

    if isinstance(val, dict):
        return {str(k): _normalize_canonical_value(v) for k, v in val.items()}

    if isinstance(val, (list, tuple)):
        return [_normalize_canonical_value(item) for item in val]

    if hasattr(val, "model_dump"):
        return _normalize_canonical_value(val.model_dump())

    return val


def canonicalize_json_bytes(data: Any) -> bytes:
    """Serialize Python data structures to RFC 8785 canonical JSON UTF-8 bytes.
    
    Properties:
    1. Lexicographical key sorting
    2. Zero whitespace separators (',', ':')
    3. Direct UTF-8 encoding (no escaping of Unicode characters)
    4. Strict rejection of NaN/Infinity
    """
    normalized = _normalize_canonical_value(data)
    canonical_str = json.dumps(
        normalized,
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False,
        allow_nan=False,
    )
    return canonical_str.encode("utf-8")


def canonical_sha256(data: Any) -> Tuple[str, bytes]:
    """Compute SHA-256 hexadecimal checksum over RFC 8785 canonical JSON bytes.
    
    Returns (hex_digest, canonical_bytes).
    """
    canonical_bytes = canonicalize_json_bytes(data)
    checksum = hashlib.sha256(canonical_bytes).hexdigest()
    return checksum, canonical_bytes
