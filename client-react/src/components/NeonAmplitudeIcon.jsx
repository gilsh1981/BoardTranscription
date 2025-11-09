import React, { useRef, useEffect } from "react";

/**
 * NeonAmplitudeIcon – גרסת “תמונה ראשונה” (תלת ממד + קו אדום),
 * עם צורה אורגנית מבוססת Perlin noise כדי שלא ייראה כמו סינוס חוזר.
 */
export default function NeonAmplitudeIcon({ width = 160, height = 54 }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext("2d", { alpha: true });

    // תמיכה ב־HiDPI כדי שהקוים יהיו חדים
    const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px}`;
    ctx.scale(dpr, dpr);

    // -------- Perlin 1D (ללא ספריות חיצוניות) --------
    // seed קבוע כדי שתהיה יציבות בין רענונים אבל תנועה בזמן
    let seed = 1337;
    const rand = () => {
      // xorshift
      seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
      return (seed >>> 0) / 4294967295;
    };
    const p = new Uint8Array(512);
    const perm = new Uint8Array(256);
    for (let i = 0; i < 256; i++) perm[i] = i;
    for (let i = 255; i >= 0; i--) { // shuffle
      const j = Math.floor(rand() * (i + 1));
      const t = perm[i]; perm[i] = perm[j]; perm[j] = t;
    }
    for (let i = 0; i < 512; i++) p[i] = perm[i & 255];

    const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
    const lerp = (a, b, t) => a + t * (b - a);
    const grad = (hash, x) => ((hash & 1) === 0 ? x : -x);

    const noise1D = (x) => {
      const X = Math.floor(x) & 255;
      const xf = x - Math.floor(x);
      const u = fade(xf);
      const a = p[X], b = p[X + 1];
      return lerp(grad(a, xf), grad(b, xf - 1), u); // טווח ~[-1,1]
    };

    // multi-octave – כדי לקבל “חיים” אמיתיים (fractal brownian motion)
    const fbm = (x, oct = 4) => {
      let value = 0, amp = 1, freq = 1, norm = 0;
      for (let i = 0; i < oct; i++) {
        value += noise1D(x * freq) * amp;
        norm += amp;
        amp *= 0.5;
        freq *= 2.0;
      }
      return value / norm; // ~[-1,1]
    };

    let t = 0;

    function draw() {
      ctx.clearRect(0, 0, width, height);

      // קו אנרגיה אדום באמצע
      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = "rgba(255,40,40,0.85)";
      ctx.lineWidth = 1.2;
      ctx.shadowColor = "rgba(255,60,60,0.8)";
      ctx.shadowBlur = 6;
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();
      ctx.restore();

      // גרדיאנט צבעוני על צורת האמפליטודה
      const grad = ctx.createLinearGradient(0, 0, width, 0);
      grad.addColorStop(0.0, "#6ad1ff");   // תכלת
      grad.addColorStop(0.35, "#b27bff"); // סגול
      grad.addColorStop(0.65, "#ff4fa8"); // ורוד
      grad.addColorStop(1.0, "#7af7ff");  // טורקיז

      // מעטפת לריכוך הקצוות (שלא יהיו שטוחים)
      const envelope = (xNorm) =>
        Math.pow(Math.sin(Math.PI * xNorm), 0.7); // 0..1

      // שכבה אחורית: מילוי רך עם glow (יוצר “עומק” כמו בתמונה)
      ctx.save();
      ctx.beginPath();
      const baseY = height / 2;
      ctx.moveTo(0, baseY);
      const samples = Math.max(60, Math.floor(width * 0.9));
      for (let i = 0; i <= samples; i++) {
        const x = (i / samples) * width;
        const xn = i / samples; // 0..1
        const n =
          fbm(x * 0.05 + t * 0.6, 5) * 0.9 + // noise עיקרי
          fbm(x * 0.15 - t * 0.3, 3) * 0.4;   // טקסטורה דקה
        const amp = 18 * envelope(xn);        // מעטפת
        const y = baseY + n * amp;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(width, baseY);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.globalAlpha = 0.55;
      ctx.shadowColor = "rgba(180,100,255,0.9)";
      ctx.shadowBlur = 20;
      ctx.fill();
      ctx.restore();

      // שכבת קו חיצונית חדה (edge) להדגשה
      ctx.save();
      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.strokeStyle = grad;
      ctx.shadowColor = "rgba(255,150,255,0.8)";
      ctx.shadowBlur = 10;
      for (let i = 0; i <= samples; i++) {
        const x = (i / samples) * width;
        const xn = i / samples;
        const n =
          fbm(x * 0.05 + t * 0.6, 5) * 0.9 +
          fbm(x * 0.15 - t * 0.3, 3) * 0.4;
        const amp = 18 * envelope(xn);
        const y = baseY + n * amp;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();

      t += 0.015; // מהירות עדינה
      requestAnimationFrame(draw);
    }

    draw();
  }, [width, height]);

  return (
    <canvas
      ref={ref}
      style={{
        display: "block",
        // מעט glow חיצוני נוסף
        filter: "drop-shadow(0 0 7px rgba(200,120,255,0.7))",
      }}
    />
  );
}
