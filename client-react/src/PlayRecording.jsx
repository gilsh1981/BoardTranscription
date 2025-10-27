import React from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function PlayRecording() {
  const { filename } = useParams();
  const navigate = useNavigate();

  const encodedFile = encodeURIComponent(filename);
  const audioUrl = `http://localhost:3000/uploads/${encodedFile}`;
  const downloadUrl = `http://localhost:3000/uploads/${encodedFile}`;

  return (
    <div
      style={{
        background: `
          radial-gradient(circle at center, rgba(0,0,0,0.6), rgba(0,0,0,0.95)),
          url('/assets/amplitude-bg-3d.png') center/cover no-repeat
        `,
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        color: "white",
        textAlign: "center",
        backdropFilter: "blur(2px)",
      }}
    >
      {/* כותרת ראשית */}
      <h1
        style={{
          fontSize: "38px",
          fontWeight: "bold",
          background:
            "linear-gradient(90deg, #00c2ff, #a24de0, #ff8c00, #ffffff)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          textShadow: "0 0 20px rgba(255,255,255,0.2)",
          marginBottom: "10px",
        }}
      >
        BoardTranscriber Playback
      </h1>

      {/* כיתוב משנה עם אייקון */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          color: "rgba(255,255,255,0.7)",
          fontSize: "16px",
          letterSpacing: "0.5px",
          marginBottom: "28px",
          animation: "fadein 2s ease-in-out",
        }}
      >
        <span
          style={{
            fontSize: "20px",
            color: "#a24de0",
            textShadow: "0 0 10px rgba(162,77,224,0.8)",
            animation: "pulseIcon 2.5s ease-in-out infinite",
          }}
        >
          🎧
        </span>
        <span>AI Smart Audio Player</span>
      </div>

      {/* נגן השמע */}
      <audio
        controls
        src={audioUrl}
        style={{
          width: "400px",
          marginTop: "10px",
          borderRadius: "10px",
          boxShadow: "0 0 25px rgba(255,255,255,0.3)",
        }}
      >
        הדפדפן שלך לא תומך בנגן הזה.
      </audio>

      {/* כפתורים */}
      <div style={{ marginTop: "30px" }}>
        <button
          onClick={() => {
            const a = document.createElement("a");
            a.href = downloadUrl;
            a.download = filename || "recording.wav";
            document.body.appendChild(a);
            a.click();
            a.remove();
          }}
          style={{
            background: "linear-gradient(90deg, #00c2ff, #a24de0, #ff8c00)",
            border: "none",
            borderRadius: "8px",
            padding: "10px 22px",
            color: "white",
            fontWeight: "bold",
            cursor: "pointer",
            marginRight: "10px",
            boxShadow: "0 0 15px rgba(255,255,255,0.4)",
            transition: "0.3s ease",
          }}
        >
          הורד הקלטה ⬇
        </button>

        <button
          onClick={() => navigate("/")}
          style={{
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: "8px",
            padding: "10px 22px",
            color: "white",
            fontWeight: "bold",
            cursor: "pointer",
            transition: "0.3s ease",
          }}
        >
          חזור ⬅
        </button>
      </div>

      {/* אנימציות עדינות */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.85; transform: scale(1.02); }
        }
        h1 {
          animation: pulse 6s ease-in-out infinite;
        }

        @keyframes fadein {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes pulseIcon {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.2); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
