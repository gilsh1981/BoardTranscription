import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Dashboard() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [formatModal, setFormatModal] = useState({ open: false, file: null });
  const [discussions, setDiscussions] = useState([]);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  const decodeSafe = (value) => {
    if (!value) return "";
    try {
      return decodeURIComponent(value);
    } catch {
      try {
        return decodeURIComponent(escape(value));
      } catch {
        return value;
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    async function fetchDiscussions() {
      try {
        const listRes = await axios.get("http://localhost:3000/api/list-recordings", {
          headers: { "Accept-Charset": "utf-8" },
        });
        setDiscussions(listRes.data?.recordings || []);
      } catch (err) {
        console.error("❌ שגיאה בטעינת הדיונים:", err);
      }
    }

    fetchDiscussions();
    const interval = setInterval(fetchDiscussions, 10000);
    return () => clearInterval(interval);
  }, []);

  const getStatusClass = (status) => {
    switch (status) {
      case "ready":
        return "bg-green-500";
      case "processing":
        return "bg-orange-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-gray-400";
    }
  };

  const cleanTitle = (raw) => {
    if (!raw) return "";
    const decoded = decodeSafe(raw);
    const noExt = decoded.replace(/\.[^/.]+$/, "");
    const noId = noExt.replace(/^\d+_/, "");
    return noId;
  };

  // ✅ פתיחת קובץ לפי פורמט נבחר
  const handleFileOpen = (filename, format) => {
    if (!filename) return alert("שם קובץ חסר");

    const safeFilename = encodeURIComponent(filename);

    switch (format) {
      case "txt":
        window.open(`http://localhost:3000/transcripts/${safeFilename}.txt`, "_blank");
        break;
      case "pdf":
        window.open(`http://localhost:3000/api/download-pdf/${safeFilename}`, "_blank");
        break;
      case "docx":
        window.open(`http://localhost:3000/api/download-docx/${safeFilename}`, "_blank");
        break;
      default:
        alert("פורמט לא נתמך");
    }

    setFormatModal({ open: false, file: null });
  };

  return (
    <div dir="rtl" className="min-h-screen bg-[#f9fafc] font-[Heebo] relative">
      {/* HEADER */}
      <header
        dir="ltr"
        className="relative overflow-hidden text-white py-6 px-10 flex items-center shadow-lg"
        style={{
          background: "linear-gradient(135deg, #13002a 0%, #3b007a 45%, #ff6f00 100%)",
        }}
      >
        <div className="absolute inset-0 opacity-25 pointer-events-none animate-waveMotion">
          <svg
            viewBox="0 0 1440 320"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
            className="w-full h-full"
          >
            <path
              fill="url(#grad1)"
              fillOpacity="0.5"
              d="M0,96L48,112C96,128,192,160,288,154.7C384,149,480,107,576,96C672,85,768,107,864,112C960,117,1056,107,1152,128C1248,149,1344,203,1392,229.3L1440,256L1440,0L0,0Z"
            ></path>
            <defs>
              <linearGradient id="grad1" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ff6f00" />
                <stop offset="50%" stopColor="#b347ff" />
                <stop offset="100%" stopColor="#ffffff" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="absolute inset-0 opacity-15 pointer-events-none animate-waveMotionSlow">
          <svg
            viewBox="0 0 1440 320"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
            className="w-full h-full"
          >
            <path
              fill="url(#grad2)"
              fillOpacity="0.6"
              d="M0,160L60,165.3C120,171,240,181,360,181.3C480,181,600,171,720,149.3C840,128,960,96,1080,80C1200,64,1320,64,1380,64L1440,64L1440,0L1380,0C1320,0,1200,0,1080,0C960,0,840,0,720,0C600,0,480,0,360,0C240,0,120,0,60,0L0,0Z"
            ></path>
            <defs>
              <linearGradient id="grad2" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ffb84d" />
                <stop offset="50%" stopColor="#b347ff" />
                <stop offset="100%" stopColor="#ffffff" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <style>
          {`
          @keyframes waveMotion {
            0% { transform: translateX(0); }
            50% { transform: translateX(-50px); }
            100% { transform: translateX(0); }
          }
          .animate-waveMotion {
            animation: waveMotion 10s ease-in-out infinite;
          }
          @keyframes waveMotionSlow {
            0% { transform: translateX(0); }
            50% { transform: translateX(30px); }
            100% { transform: translateX(0); }
          }
          .animate-waveMotionSlow {
            animation: waveMotionSlow 20s ease-in-out infinite;
          }

          @keyframes pulseBar {
            0% { height: 6px; }
            25% { height: 18px; }
            50% { height: 10px; }
            75% { height: 20px; }
            100% { height: 8px; }
          }
          .amplitude-bar {
            animation: pulseBar 1.2s ease-in-out infinite;
          }
          .amplitude-bar:nth-child(2) { animation-delay: 0.2s; }
          .amplitude-bar:nth-child(3) { animation-delay: 0.4s; }
          .amplitude-bar:nth-child(4) { animation-delay: 0.6s; }
          .amplitude-bar:nth-child(5) { animation-delay: 0.8s; }
          `}
        </style>

        <div className="relative z-10 flex flex-col items-start text-left">
          <div className="flex items-center gap-3">
            <div className="flex items-end justify-center gap-[2px] w-8 h-6">
              <div className="w-[3px] bg-[#ffb84d] rounded amplitude-bar"></div>
              <div className="w-[3px] bg-[#ff6f00] rounded amplitude-bar"></div>
              <div className="w-[3px] bg-[#b347ff] rounded amplitude-bar"></div>
              <div className="w-[3px] bg-[#ff6f00] rounded amplitude-bar"></div>
              <div className="w-[3px] bg-[#ffb84d] rounded amplitude-bar"></div>
            </div>
            <span className="text-3xl font-extrabold tracking-wide drop-shadow-[0_0_12px_rgba(255,255,255,0.6)]">
              BoardTranscriber
            </span>
          </div>
          <span className="text-[#ffeedd] text-sm mt-2 font-semibold tracking-wide">
            AI Smart Board Meetings
          </span>
        </div>
      </header>

      {/* כפתור הוספת דיון חדש */}
      <div ref={menuRef} className="absolute top-[150px] right-[40px]">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="bg-gradient-to-l from-[#ff6f00] to-[#b347ff] text-white py-2 px-5 rounded-lg 
                     font-bold shadow-lg hover:scale-105 transition"
        >
          ➕ הוספת דיון חדש
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-2 bg-white text-gray-800 rounded-lg shadow-xl border min-w-[200px] text-right z-10">
            <button className="w-full px-4 py-2 hover:bg-gray-100" onClick={() => navigate("/new-discussion")}>
              🎙️ הקלט דיון
            </button>
            <button className="w-full px-4 py-2 hover:bg-gray-100" onClick={() => navigate("/recording")}>
              📁 העלאת הקלטה קיימת
            </button>
            <button className="w-full px-4 py-2 hover:bg-gray-100" onClick={() => navigate("/supervised")}>
              ✍️ הכתבה
            </button>
          </div>
        )}
      </div>

      {/* רשימת הדיונים */}
      <main className="pt-44 px-8">
        <div className="text-center text-2xl font-bold mb-8 text-gray-700">
          רשימת תמלולים ודיונים
        </div>

        <div className="w-[90%] mx-auto bg-[#f0f1f5] rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <table className="w-full border-collapse text-center text-sm text-gray-700">
            <thead className="bg-[#ececf1] text-gray-700 font-semibold">
              <tr>
                <th className="p-3">נושא הדיון</th>
                <th className="p-3">מוביל הדיון</th>
                <th className="p-3">תאריך</th>
                <th className="p-3">סטטוס</th>
                <th className="p-3">תצוגה מקדימה</th>
                <th className="p-3">קבצים</th>
              </tr>
            </thead>
            <tbody>
              {discussions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-6 text-gray-500">
                    אין דיונים עדיין
                  </td>
                </tr>
              ) : (
                discussions.map((item, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-gray-200 hover:bg-[#f8f8fb] cursor-pointer transition"
                    onClick={() =>
                      item.filename && navigate(`/discussion/${encodeURIComponent(item.filename)}`)
                    }
                  >
                    <td className="p-3 font-medium text-gray-800">
                      {cleanTitle(item.title || item.filename || item.name)}
                    </td>
                    <td className="p-3 text-gray-700">{item.leader || "לא צוין"}</td>
                    <td className="p-3">{item.date}</td>
                    <td className="p-3">
                      <span
                        className={`text-white px-3 py-1 rounded-full text-xs font-bold ${getStatusClass(item.status)}`}
                      >
                        {item.status === "processing" && "בעיבוד"}
                        {item.status === "ready" && "מוכן"}
                        {item.status === "error" && "שגיאה"}
                      </span>
                    </td>

                    <td
                      className="p-3 text-gray-600 text-sm max-w-[300px] truncate hover:text-[#b347ff]"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/discussion/${encodeURIComponent(item.filename)}`);
                      }}
                    >
                      {item.transcriptPreview
                        ? decodeSafe(item.transcriptPreview.slice(0, 100)) + "..."
                        : "—"}
                    </td>

                    <td className="p-3 text-lg flex justify-center gap-4">
                      {/* 🎧 נגן הקלטה */}
                      <span
                        title="נגן הקלטה"
                        onClick={(e) => {
                          e.stopPropagation();
                          const baseName = item.filename;
                          if (!baseName) return alert("שם קובץ לא תקין 🎧");
                          const url = `http://localhost:3001/play/${encodeURIComponent(baseName)}.wav`;
                          window.open(url, "_blank");
                        }}
                        className="cursor-pointer hover:scale-110 transition"
                      >
                        🎧
                      </span>

                      {/* 📄 פתח תמלול */}
                      <span
                        title="פתח תמלול"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFormatModal({ open: true, file: item.filename });
                        }}
                        className="cursor-pointer hover:scale-110 transition"
                      >
                        📄
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* 💠 Modal לבחירת פורמט */}
      {formatModal.open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-[300px] text-center">
            <h2 className="text-lg font-bold mb-4 text-gray-700">בחר פורמט להצגת התמלול</h2>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => handleFileOpen(formatModal.file, "txt")}
                className="bg-[#f5f5f5] hover:bg-[#b347ff] hover:text-white text-gray-700 py-2 rounded-lg font-medium transition"
              >
                📝 קובץ TXT
              </button>
              <button
                onClick={() => handleFileOpen(formatModal.file, "pdf")}
                className="bg-[#f5f5f5] hover:bg-[#ff6f00] hover:text-white text-gray-700 py-2 rounded-lg font-medium transition"
              >
                📄 קובץ PDF
              </button>
              <button
                onClick={() => handleFileOpen(formatModal.file, "docx")}
                className="bg-[#f5f5f5] hover:bg-[#0078d4] hover:text-white text-gray-700 py-2 rounded-lg font-medium transition"
              >
                📘 קובץ Word
              </button>
            </div>
            <button
              onClick={() => setFormatModal({ open: false, file: null })}
              className="mt-5 text-sm text-gray-500 hover:text-gray-700"
            >
              ביטול
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
