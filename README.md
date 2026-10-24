# CorrosionGuard — Hackathon Prototype

## What this is
A browser-based prototype for a low-cost reinforcement corrosion early-warning workflow.

It demonstrates:
- multi-parameter corrosion-risk screening
- live-looking sensor dashboard
- risk trend chart
- transparent factor breakdown
- inspection queue
- local historical readings
- sensor/device registry
- report generation / print-to-PDF
- optional ESP32 JSON endpoint integration
- responsive layout for laptop/tablet/mobile

## Run in VS Code

1. Create/open this folder in VS Code.
2. Open `index.html`.
3. Recommended: install the **Live Server** extension in VS Code.
4. Right-click `index.html` → **Open with Live Server**.
5. The dashboard starts in demo mode automatically.

No npm, backend, or database is required for the prototype.

## ESP32 integration

The frontend can consume a JSON endpoint such as:

GET /api/sensor/latest

Example response:
```json
{
  "moisture": 12.5,
  "resistivity": 48.2,
  "potential": -120,
  "temperature": 28,
  "humidity": 65
}
```

Use the **Devices → Test configured endpoint** button.

For a real ESP32 implementation, the board can operate as a Wi-Fi station or access point and serve HTTP data. The current frontend is intentionally separated from the hardware layer so the demo works without hardware.

## Important engineering limitation

The risk calculation in `app.js` is a hackathon demonstration model, not an ASTM/ACI acceptance criterion and not a structural-safety calculation.

ASTM C876-22/22b describes corrosion-potential testing of uncoated reinforcing steel in concrete and notes that measurements need appropriate interpretation and may need complementary information such as chloride content, carbonation depth, delamination, corrosion-rate data and environmental exposure. Do not present the demo score as a measured probability of corrosion or as proof of structural safety.

## Suggested hackathon demo

1. Start on Dashboard.
2. Show the live-looking trend and current sensor values.
3. Open Scan & Assess.
4. Load the high-risk demo case.
5. Run the calculation and show how the risk indicator changes.
6. Open History to show traceability.
7. Open Devices to explain the ESP32/IoT layer.
8. Open Report and use Print / Save as PDF.
