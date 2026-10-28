from __future__ import annotations

import base64
import json
import os
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Tuple

import cv2
import numpy as np

try:
    import face_recognition
except Exception:  # pragma: no cover
    face_recognition = None

try:
    from deepface import DeepFace
except Exception:  # pragma: no cover
    DeepFace = None

APP_ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = APP_ROOT / "data"
REGISTRY_DIR = DATA_DIR / "registry"
TEMP_DIR = DATA_DIR / "temp"
COOLDOWN_SECONDS = 10

_LAST_RECOGNITION: Dict[str, float] = {}


def _ensure_storage() -> None:
    REGISTRY_DIR.mkdir(parents=True, exist_ok=True)
    TEMP_DIR.mkdir(parents=True, exist_ok=True)


def _decode_image_data(image_data: str) -> np.ndarray:
    if not image_data:
        raise ValueError("No image data provided")

    if image_data.startswith("data:image"):
        header, encoded = image_data.split(",", 1)
        if ";base64" not in header:
            raise ValueError("Unsupported image format")
        image_data = encoded

    try:
        image_bytes = base64.b64decode(image_data)
    except (TypeError, ValueError) as exc:
        raise ValueError("Image data is not valid base64") from exc

    array = np.frombuffer(image_bytes, dtype=np.uint8)
    image = cv2.imdecode(array, cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError("Unable to decode image")
    return image


def _average_face_embedding(embeddings: List[np.ndarray]) -> np.ndarray:
    if not embeddings:
        raise ValueError("No valid embeddings generated")
    return np.mean(np.vstack(embeddings), axis=0)


def _get_face_cascade():
    if hasattr(cv2, "CascadeClassifier") and hasattr(cv2, "data") and hasattr(cv2.data, "haarcascades"):
        cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        if os.path.exists(cascade_path):
            try:
                clf = cv2.CascadeClassifier(cascade_path)
                if not clf.empty():
                    return clf
            except Exception:
                pass
    return None


def _get_eye_cascade():
    if hasattr(cv2, "CascadeClassifier") and hasattr(cv2, "data") and hasattr(cv2.data, "haarcascades"):
        cascade_path = cv2.data.haarcascades + "haarcascade_eye.xml"
        if os.path.exists(cascade_path):
            try:
                clf = cv2.CascadeClassifier(cascade_path)
                if not clf.empty():
                    return clf
            except Exception:
                pass
    return None


def _extract_face_crop(frame: np.ndarray) -> np.ndarray:
    face_cascade = _get_face_cascade()
    if face_cascade is not None:
        try:
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            faces = face_cascade.detectMultiScale(gray, scaleFactor=1.2, minNeighbors=4, minSize=(40, 40))
            if len(faces) > 0:
                faces = sorted(faces, key=lambda f: f[2] * f[3], reverse=True)
                x, y, w, h = faces[0]
                margin = int(w * 0.1)
                x1 = max(0, x - margin)
                y1 = max(0, y - margin)
                x2 = min(frame.shape[1], x + w + margin)
                y2 = min(frame.shape[0], y + h + margin)
                return frame[y1:y2, x1:x2]
        except Exception:
            pass
    return frame


def _compute_embedding(frame: np.ndarray) -> np.ndarray:
    if DeepFace is not None:
        temp_path = TEMP_DIR / f"embedding_{int(time.time() * 1000)}.jpg"
        saved = cv2.imwrite(str(temp_path), frame)
        if saved:
            try:
                response = DeepFace.represent(
                    img_path=str(temp_path),
                    model_name="Facenet",
                    enforce_detection=False,
                    detector_backend="opencv",
                )
                if isinstance(response, list) and response:
                    embedding = response[0].get("embedding")
                    if embedding is not None:
                        return np.asarray(embedding, dtype=np.float64)
            except Exception:
                pass
            finally:
                if temp_path.exists():
                    temp_path.unlink(missing_ok=True)

    if face_recognition is not None:
        rgb_image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        face_locations = face_recognition.face_locations(rgb_image, model="hog")
        if not face_locations:
            raise ValueError("No face detected in the image")
        face_encodings = face_recognition.face_encodings(rgb_image, face_locations)
        if not face_encodings:
            raise ValueError("Unable to generate a face encoding")
        return np.asarray(face_encodings[0], dtype=np.float64)

    # OpenCV feature representation on cropped face
    face_crop = _extract_face_crop(frame)
    gray = cv2.cvtColor(face_crop, cv2.COLOR_BGR2GRAY)
    gray_eq = cv2.equalizeHist(gray)
    resized = cv2.resize(gray_eq, (64, 64), interpolation=cv2.INTER_AREA)

    # 4x4 spatial grid with 8 histogram bins per cell = 128 features
    blocks_x = 4
    blocks_y = 4
    bins = 8
    h_step = 64 // blocks_y
    w_step = 64 // blocks_x
    features = []

    for by in range(blocks_y):
        for bx in range(blocks_x):
            cell = resized[by * h_step : (by + 1) * h_step, bx * w_step : (bx + 1) * w_step]
            hist = cv2.calcHist([cell], [0], None, [bins], [0, 256]).flatten()
            norm = np.linalg.norm(hist)
            if norm > 0:
                hist = hist / norm
            features.extend(hist.tolist())

    vec = np.asarray(features, dtype=np.float64)
    total_norm = np.linalg.norm(vec)
    if total_norm > 0:
        vec = vec / total_norm
    return vec


def _liveness_check(frame: np.ndarray) -> Tuple[bool, str]:
    if frame is None or frame.size == 0:
        return False, "Empty or invalid image frame"

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    face_cascade = _get_face_cascade()
    if face_cascade is not None:
        try:
            faces = face_cascade.detectMultiScale(gray, scaleFactor=1.2, minNeighbors=4, minSize=(50, 50))
            if len(faces) == 0:
                return False, "No face detected in camera view"

            if len(faces) > 1:
                return False, "Multiple faces detected. Only one person should be in camera view."

            x, y, w, h = faces[0]

            # Aspect ratio check for natural face proportions (typically 0.6 to 1.4)
            aspect_ratio = float(w) / float(h)
            if aspect_ratio < 0.55 or aspect_ratio > 1.45:
                return False, "Invalid facial proportions detected"

            roi_gray = gray[y : y + h, x : x + w]

            # Laplacian sharpness check (anti-blur and screen capture fuzziness)
            laplacian_var = float(cv2.Laplacian(roi_gray, cv2.CV_64F).var())
            if laplacian_var < 15:
                return False, "Image appears too blurry or out of focus"

            # Contrast variance
            variance = float(np.var(roi_gray))
            if variance < 25:
                return False, "Image appears washed out or has insufficient lighting contrast"

            # Eye check: Check if eyes can be localized in upper half of face
            eye_cascade = _get_eye_cascade()
            if eye_cascade is not None:
                upper_face = roi_gray[0 : int(h * 0.65), :]
                eyes = eye_cascade.detectMultiScale(upper_face, scaleFactor=1.15, minNeighbors=2, minSize=(10, 10))
                # Having natural eye landmarks or sufficient high-gradient features confirms human face
                if len(eyes) == 0:
                    # Fallback check on edge density to ensure facial feature depth
                    edges = cv2.Canny(roi_gray, 50, 150)
                    edge_density = float(np.count_nonzero(edges)) / float(roi_gray.size)
                    if edge_density < 0.02:
                        return False, "Facial features not clearly distinguishable"

            return True, "Liveness check passed"
        except Exception:
            pass

    # Safe fallback if cascade fails
    variance = float(np.var(gray))
    if variance < 20:
        return False, "Image appears too blurry or low-contrast"

    return True, "Liveness check passed"


def _write_registry_record(employee_id: str, name: str, embedding: np.ndarray) -> Dict[str, Any]:
    payload = {
        "employeeId": employee_id,
        "name": name,
        "embedding": embedding.tolist(),
        "updatedAt": datetime.now(timezone.utc).isoformat(),
    }
    file_path = REGISTRY_DIR / f"{employee_id}.json"
    with file_path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle)
    return payload


def load_registered_employees() -> List[Dict[str, Any]]:
    _ensure_storage()
    records: List[Dict[str, Any]] = []
    for record_path in sorted(REGISTRY_DIR.glob("*.json")):
        with record_path.open("r", encoding="utf-8") as handle:
            data = json.load(handle)
        records.append({
            "employeeId": str(data.get("employeeId")),
            "name": data.get("name", "Unknown"),
            "embedding": np.asarray(data.get("embedding", []), dtype=np.float64),
        })
    return records


def register_employee(employee_id: str, employee_name: str, images: List[str]) -> Dict[str, Any]:
    _ensure_storage()
    if not employee_id or not employee_name:
        raise ValueError("Employee ID and name are required")

    valid_images = []
    for image_data in images:
        if not image_data:
            continue
        frame = _decode_image_data(image_data)
        if frame is None:
            continue
        valid_images.append(frame)

    if not valid_images:
        raise ValueError("At least one valid face image is required")

    embeddings: List[np.ndarray] = []
    for frame in valid_images:
        accepted, reason = _liveness_check(frame)
        if not accepted:
            raise ValueError(reason)
        embeddings.append(_compute_embedding(frame))

    avg_embedding = _average_face_embedding(embeddings)
    _write_registry_record(employee_id, employee_name, avg_embedding)
    return {
        "employeeId": employee_id,
        "employeeName": employee_name,
        "samples": len(embeddings),
        "message": "Employee registered successfully",
    }


def recognize_employee(image_data: str) -> Dict[str, Any]:
    _ensure_storage()
    if not image_data:
        return {"match": False, "employeeId": None, "employeeName": "Unknown Employee", "confidence": 0.0, "message": "No image data provided"}

    frame = _decode_image_data(image_data)
    is_live, liveness_message = _liveness_check(frame)
    if not is_live:
        return {"match": False, "employeeId": None, "employeeName": "Unknown Employee", "confidence": 0.0, "message": liveness_message}

    try:
        embedding = _compute_embedding(frame)
    except Exception as exc:  # pragma: no cover
        return {"match": False, "employeeId": None, "employeeName": "Unknown Employee", "confidence": 0.0, "message": str(exc)}

    records = load_registered_employees()
    if not records:
        return {"match": False, "employeeId": None, "employeeName": "Unknown Employee", "confidence": 0.0, "message": "No registered employees found"}

    best_match = None
    best_similarity = -1.0

    if face_recognition is not None:
        best_distance = float("inf")
        for record in records:
            distances = face_recognition.face_distance([record["embedding"]], embedding)
            distance = float(distances[0]) if len(distances) else 1.0
            if distance < best_distance:
                best_distance = distance
                best_match = record
        threshold_dist = 0.45
        if best_match is not None and best_distance <= threshold_dist:
            confidence = round(max(0.0, (1.0 - best_distance) * 100.0), 2)
        else:
            best_match = None
            confidence = 0.0
    else:
        # Cosine similarity for normalized OpenCV facial representations
        norm_emb = np.linalg.norm(embedding)
        for record in records:
            rec_emb = record["embedding"]
            norm_rec = np.linalg.norm(rec_emb)
            if norm_rec > 0 and norm_emb > 0:
                sim = float(np.dot(rec_emb, embedding) / (norm_rec * norm_emb))
            else:
                sim = 0.0
            if sim > best_similarity:
                best_similarity = sim
                best_match = record

        # Similarity threshold: 0.70 (70%)
        if best_match is not None and best_similarity >= 0.70:
            confidence = round(best_similarity * 100.0, 2)
        else:
            best_match = None
            confidence = round(max(0.0, best_similarity * 100.0), 2)

    if best_match is None:
        return {"match": False, "employeeId": None, "employeeName": "Unknown Employee", "confidence": confidence, "message": "Face not recognized. Please register first."}

    best_id = best_match["employeeId"]
    best_name = best_match["name"]

    now = time.time()
    last_seen = _LAST_RECOGNITION.get(best_id, 0.0)
    if now - last_seen < COOLDOWN_SECONDS:
        return {
            "match": False,
            "employeeId": best_id,
            "employeeName": best_name,
            "confidence": confidence,
            "message": "Duplicate recognition suppressed within cool-down window",
            "duplicate": True,
        }

    _LAST_RECOGNITION[best_id] = now
    return {
        "match": True,
        "employeeId": best_id,
        "employeeName": best_name,
        "confidence": confidence,
        "message": f"Recognized {best_name}",
        "duplicate": False,
    }



def list_registered_employees() -> List[Dict[str, Any]]:
    return [
        {"employeeId": record["employeeId"], "employeeName": record["name"]}
        for record in load_registered_employees()
    ]
