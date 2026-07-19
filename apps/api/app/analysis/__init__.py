"""Deterministic image-analysis pipeline.

Modules in this package are pure and framework-free: same input + same
classifier configuration ⇒ same output. No FastAPI imports, no database
access, no logging of image content. Every tunable number comes from the
versioned classifier configuration (packages/colour-engine/config).
"""
