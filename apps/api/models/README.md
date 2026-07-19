# Vendored models

## `face_landmarker.task` (3.7 MB)

- **What:** MediaPipe Tasks Face Landmarker bundle (face detection + 478 facial landmarks + facial transformation matrix).
- **Source:** `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`
- **Licence:** Apache License 2.0 (Google, MediaPipe). See https://github.com/google-ai-edge/mediapipe/blob/master/LICENSE
- **Why vendored:** hermetic CI and Docker builds — no network fetch at build/test time; identical model bytes across environments keeps the pipeline deterministic.
- **Used by:** `app/analysis/face_detection/` (loaded lazily as a process-wide singleton). Path override: `FACE_LANDMARKER_MODEL_PATH`.

The model performs face landmark detection only. It is **not** used for identity recognition, and no biometric templates are stored.
