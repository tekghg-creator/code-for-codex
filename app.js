const video = document.getElementById("video");
const canvas = document.getElementById("output");
const statusBadge = document.getElementById("status");
const strengthInput = document.getElementById("strength");
const softnessInput = document.getElementById("softness");
const blushInput = document.getElementById("blush");
const lipsInput = document.getElementById("lips");
const mirrorInput = document.getElementById("mirror");

const ctx = canvas.getContext("2d");
let detector = null;
let lastFace = null;
let processing = false;

if ("FaceDetector" in window) {
  detector = new FaceDetector({
    fastMode: true,
    maxDetectedFaces: 1,
  });
}

const updateStatus = (message) => {
  statusBadge.textContent = message;
};

const startCamera = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: "user",
      },
      audio: false,
    });
    video.srcObject = stream;
    await video.play();
    resizeCanvas();
    updateStatus(detector ? "FaceDetector aktiv" : "Fallback-Filter aktiv");
    requestAnimationFrame(renderLoop);
  } catch (error) {
    updateStatus("Kamerazugriff fehlgeschlagen");
    console.error(error);
  }
};

const resizeCanvas = () => {
  canvas.width = video.videoWidth || 1280;
  canvas.height = video.videoHeight || 720;
};

const applyFaceEffects = (face, strength, softness, blush, lips) => {
  const { width, height, x, y } = face.boundingBox;
  const centerX = x + width / 2;
  const centerY = y + height / 2;

  const glowStrength = 0.05 + strength * 0.005;
  const blurValue = Math.max(0, softness * 0.7);
  const saturation = 1 + strength * 0.006;
  const brightness = 1 + strength * 0.004;

  ctx.save();
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, width * 0.58, height * 0.62, 0, 0, Math.PI * 2);
  ctx.clip();
  ctx.filter = `blur(${blurValue}px) saturate(${saturation}) brightness(${brightness})`;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = `rgba(255, 190, 220, ${glowStrength})`;
  ctx.beginPath();
  ctx.ellipse(centerX, centerY - height * 0.05, width * 0.6, height * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const blushAlpha = blush * 0.004;
  const cheekOffsetX = width * 0.2;
  const cheekOffsetY = height * 0.1;
  const cheekRadius = width * 0.12;

  ctx.save();
  ctx.fillStyle = `rgba(255, 110, 165, ${blushAlpha})`;
  ctx.beginPath();
  ctx.ellipse(centerX - cheekOffsetX, centerY + cheekOffsetY, cheekRadius, cheekRadius * 0.75, 0, 0, Math.PI * 2);
  ctx.ellipse(centerX + cheekOffsetX, centerY + cheekOffsetY, cheekRadius, cheekRadius * 0.75, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.fillStyle = `rgba(255, 90, 140, ${0.1 + blush * 0.002})`;
  ctx.beginPath();
  ctx.ellipse(centerX, centerY + height * 0.22, width * 0.18, height * 0.06, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const lipAlpha = lips * 0.005;
  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = `rgba(188, 40, 95, ${lipAlpha})`;
  ctx.beginPath();
  ctx.ellipse(centerX, centerY + height * 0.26, width * 0.2, height * 0.05, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

const applyGlobalEffects = (strength, softness, blush, lips) => {
  const blurValue = Math.max(0, softness * 0.6);
  const saturation = 1 + strength * 0.004;
  const brightness = 1 + strength * 0.003;
  const tintAlpha = 0.08 + blush * 0.003;
  const lipTint = 0.03 + lips * 0.002;

  ctx.save();
  ctx.filter = `blur(${blurValue}px) saturate(${saturation}) brightness(${brightness})`;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = `rgba(255, 180, 210, ${tintAlpha})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = `rgba(188, 40, 95, ${lipTint})`;
  ctx.fillRect(0, canvas.height * 0.6, canvas.width, canvas.height * 0.4);
  ctx.restore();
};

const renderLoop = async () => {
  if (video.readyState < 2) {
    requestAnimationFrame(renderLoop);
    return;
  }

  if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
    resizeCanvas();
  }

  const strength = Number(strengthInput.value);
  const softness = Number(softnessInput.value);
  const blush = Number(blushInput.value);
  const lips = Number(lipsInput.value);
  const mirror = mirrorInput.checked;

  ctx.save();
  if (mirror) {
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
  }

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  if (detector) {
    if (!processing) {
      processing = true;
      try {
        const faces = await detector.detect(video);
        lastFace = faces[0] || null;
      } catch (error) {
        detector = null;
        updateStatus("FaceDetector nicht verfügbar");
      } finally {
        processing = false;
      }
    }

    if (lastFace) {
      applyFaceEffects(lastFace, strength, softness, blush, lips);
    } else {
      applyGlobalEffects(strength * 0.6, softness, blush * 0.6, lips * 0.6);
    }
  } else {
    applyGlobalEffects(strength, softness, blush, lips);
  }

  ctx.restore();
  requestAnimationFrame(renderLoop);
};

window.addEventListener("resize", resizeCanvas);
startCamera();
