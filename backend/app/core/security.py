"""Security implementation is intentionally deferred to the approved auth stage.

No authentication endpoint is mounted by this foundation. Password hashing,
token issuance, refresh rotation, and authorization must be implemented and
tested before private API routes are added.
"""
