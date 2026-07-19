# Production image for the ColourSense API.
# Build from the REPOSITORY ROOT so the classifier config can be copied:
#   docker build -f apps/api/Dockerfile -t coloursense-api .

# --- Builder: resolve and install dependencies with uv -----------------------
FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim AS builder

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PYTHON_DOWNLOADS=never

WORKDIR /app

COPY apps/api/pyproject.toml apps/api/uv.lock ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-install-project --no-dev

COPY apps/api/app ./app
COPY apps/api/models ./models
COPY packages/colour-engine/config ./config

# --- Runtime ------------------------------------------------------------------
FROM python:3.12-slim-bookworm

# OpenCV(headless) and MediaPipe native libraries.
RUN apt-get update \
    && apt-get install -y --no-install-recommends libgl1 libglib2.0-0 curl \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --create-home --uid 10001 appuser

WORKDIR /app
COPY --from=builder --chown=appuser:appuser /app /app

ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    CLASSIFIER_CONFIG_PATH=/app/config/classifier-v1.json \
    FACE_LANDMARKER_MODEL_PATH=/app/models/face_landmarker.task

USER appuser
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD curl -fsS http://127.0.0.1:8000/api/v1/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--no-access-log"]
