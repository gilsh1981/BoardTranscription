import React, { useRef, useEffect } from "react";

// AI 3D Amplitude – דינמי, שכבות צבעים, Glow, קו אדום
export default function Ai3dAmplitude({
  width = 420, height = 80, layers = 12
}) {
  const ref = useRef();

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    let frame = 0;

    // Simple Perlin-like noise for wave variation
    function noise(x, phase) {
      return (
        Math.sin(x * 0.021 + phase) * 0.6 +
        Math.sin(x * 0.034 + phase * 1.3) * 0.3 +
        Math.cos(x * 0.012 + phase * 2.3) * 0.2
      );
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);

      // Draw layers (3D effect)
      for (let l = 0; l < layers; l++) {
        const yMid = height / 2;
        const spread = 13 + l * 2.6;
        const alpha = 0.09 + l * 0.06;
        const phase = frame * 0.018 + l * 0.8;
        ctx.save();
        ctx.beginPath();
        for (let x = 0; x <= width; x += 2) {
          const y =
            yMid +
            noise(x, phase) * (spread + l * 1.1) +
            Math.cos((x / width) * Math.PI * 2 + phase) * 2;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        // שכבת צבע משתנה לכל לייר
        let grad = ctx.createLinearGradient(0, 0, width, 0);
        grad.addColorStop(0.1, "#16ffe3");
        grad.addColorStop(0.3, "#a069ff");
        grad.addColorStop(0.45 + l * 0.015, "#f43fff");
        grad.addColorStop(0.62 + l * 0.008, "#28a7fa");
        grad.addColorStop(0.85, "#ff2567");
        grad.addColorStop(1.0, "#ff6f00");
        ctx.strokeStyle = grad;

        ctx.globalAlpha = alpha;
        ctx.shadowColor = l % 2 === 0 ? "#ff008e" : "#41fff8";
        ctx.shadowBlur = 10 + l * 2.5;
        ctx.lineWidth = 5.5 - l * 0.25;

        ctx.stroke();
        ctx.restore();
      }

      // קו אדום זוהר במרכז
      ctx.save();
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.strokeStyle = "#ff2356";
      ctx.shadowColor = "#ff2356";
      ctx.shadowBlur = 24;
      ctx.lineWidth = 2.7;
      ctx.stroke();
      ctx.restore();

      frame++;
      requestAnimationFrame(draw);
    }

    draw();
    return () => { /* אין ביטול כי animationFrame רץ על draw */ };
  }, [width, height, layers]);

  return (
    <canvas
      ref={ref}
      width={width}
      height={height}
      style={{
        width: width,
        height: height,
        display: "block",
        background: "transparent",
        borderRadius: 18,
        boxShadow: "0 0 12px #23013e60",
      }}
    />
  );
}
