"""Shared PIN check for the legacy port and the alarm command."""

from __future__ import annotations

import hashlib
import hmac


def access_token(entry_id: str, pin: str) -> str:
    """Return the cookie or comparison token for a PIN."""
    return hashlib.sha256(f"{entry_id}:{pin}".encode()).hexdigest()


def pin_matches(entry_id: str, expected: str, submitted: str) -> bool:
    """Return True when the submitted PIN matches the one stored on the entry."""
    if not expected:
        return False
    given = access_token(entry_id, submitted.strip())
    current = access_token(entry_id, expected)
    if len(given) != len(current):
        return False
    return hmac.compare_digest(given, current)
