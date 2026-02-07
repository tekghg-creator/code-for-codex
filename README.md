# Face Changer – Echtzeit

Eine kleine Browser-App, die das Kamerabild in Echtzeit mit einem femininen Soft-Filter versieht. Die Verarbeitung passiert lokal im Browser.

## Start (Browser)

```bash
python -m http.server 8000
```

Dann `http://localhost:8000` öffnen.

## Start als Desktop-App

```bash
npm install
npm run start
```

## Windows-Exe bauen

```bash
npm install
npm run build:win
```

Die fertige `.exe` liegt danach in `dist/`.

## Hinweise

- Funktioniert am besten in Chromium-basierten Browsern mit FaceDetector-API.
- Falls FaceDetector nicht verfügbar ist, greift ein globaler Filter.
