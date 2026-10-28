const registrationVideo = document.getElementById('registrationVideo');
const recognitionVideo = document.getElementById('recognitionVideo');
const captureStatus = document.getElementById('captureStatus');
const recognitionResult = document.getElementById('recognitionResult');
const resultText = document.getElementById('resultText');
const resultMeta = document.getElementById('resultMeta');

const capturedSamples = [];
let registrationStream = null;
let recognitionStream = null;

const toBase64 = (videoEl) => {
  const canvas = document.createElement('canvas');
  canvas.width = videoEl.videoWidth || 640;
  canvas.height = videoEl.videoHeight || 480;
  const context = canvas.getContext('2d');
  context.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.9);
};

const initializeCamera = async (videoElement, streamKey) => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert('Webcam access is required for face registration and recognition.');
    return null;
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'user' },
    audio: false,
  });

  videoElement.srcObject = stream;
  if (streamKey === 'registration') registrationStream = stream;
  if (streamKey === 'recognition') recognitionStream = stream;
  return stream;
};

document.getElementById('startCamBtn').addEventListener('click', async () => {
  await initializeCamera(registrationVideo, 'registration');
  await initializeCamera(recognitionVideo, 'recognition');
  captureStatus.textContent = 'Cameras are live. Capture multiple samples for the employee.';
  captureStatus.className = 'status-box success';
});

document.getElementById('captureBtn').addEventListener('click', () => {
  if (!registrationVideo.srcObject) {
    captureStatus.textContent = 'Start the camera before capturing samples.';
    captureStatus.className = 'status-box error';
    return;
  }

  const image = toBase64(registrationVideo);
  capturedSamples.push(image);
  captureStatus.textContent = `Captured sample ${capturedSamples.length}. Add more or register the employee.`;
  captureStatus.className = 'status-box success';
});

document.getElementById('registerBtn').addEventListener('click', async () => {
  const employeeId = document.getElementById('employeeId').value.trim();
  const employeeName = document.getElementById('employeeName').value.trim();

  if (!employeeId || !employeeName || capturedSamples.length === 0) {
    captureStatus.textContent = 'Enter employee details and capture at least one sample.';
    captureStatus.className = 'status-box error';
    return;
  }

  const response = await fetch('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeId, employeeName, images: capturedSamples }),
  });

  const result = await response.json();
  captureStatus.textContent = result.message || 'Registration request completed.';
  captureStatus.className = response.ok ? 'status-box success' : 'status-box error';

  if (response.ok) {
    capturedSamples.length = 0;
  }
});

document.getElementById('recognizeBtn').addEventListener('click', async () => {
  if (!recognitionVideo.srcObject) {
    resultText.textContent = 'Start the camera before recognition';
    resultMeta.textContent = '0%';
    recognitionResult.className = 'result-panel warn';
    return;
  }

  const image = toBase64(recognitionVideo);
  const response = await fetch('/api/recognize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageData: image }),
  });

  const result = await response.json();
  const recognized = result.match === true;

  resultText.textContent = recognized ? result.employeeName : 'Unknown Employee';
  resultMeta.textContent = `Confidence: ${result.confidence ?? 0}%`;
  recognitionResult.className = recognized ? 'result-panel success' : 'result-panel danger';

  if (result.message) {
    console.log(result.message);
  }
});
