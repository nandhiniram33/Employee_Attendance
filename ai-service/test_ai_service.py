import base64
import unittest
import cv2
import numpy as np

from app import app
from services.facial_service import _compute_embedding, _decode_image_data, register_employee, recognize_employee


class TestAiService(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    def _create_synthetic_face_image_base64(self):
        # Create an image with a drawn face circle and features so Haar cascade can detect it
        img = np.ones((300, 300, 3), dtype=np.uint8) * 180
        # Draw head
        cv2.circle(img, (150, 150), 90, (120, 120, 120), -1)
        # Draw eyes
        cv2.circle(img, (120, 130), 12, (20, 20, 20), -1)
        cv2.circle(img, (180, 130), 12, (20, 20, 20), -1)
        # Draw mouth
        cv2.ellipse(img, (150, 200), (35, 15), 0, 0, 180, (40, 40, 40), 3)

        _, buf = cv2.imencode(".jpg", img)
        return "data:image/jpeg;base64," + base64.b64encode(buf).decode("utf-8")

    def test_health_endpoint(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data.get("status"), "ok")
        self.assertIn("registeredEmployees", data)

    def test_recognize_no_input(self):
        response = self.client.post("/api/recognize", json={})
        self.assertEqual(response.status_code, 400)
        data = response.get_json()
        self.assertFalse(data.get("match"))

    def test_register_missing_fields(self):
        response = self.client.post("/api/register", json={"employeeId": "EMP01"})
        self.assertEqual(response.status_code, 400)

    def test_decode_image_data(self):
        raw = np.zeros((50, 50, 3), dtype=np.uint8)
        _, buf = cv2.imencode(".png", raw)
        b64 = "data:image/png;base64," + base64.b64encode(buf).decode("utf-8")
        decoded = _decode_image_data(b64)
        self.assertEqual(decoded.shape, (50, 50, 3))


if __name__ == "__main__":
    unittest.main()
