import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import NeonAmplitudeIcon from "./components/NeonAmplitudeIcon";

// ⭐️ כוכביות מונפשות AI
function AiStarsAnimated() {
  return (
    <span className="relative w-9 h-7 ml-1 flex items-center">
      <svg viewBox="0 0 34 28" className="w-8 h-7 animate-spin-slow">
        <g>
          <circle cx="28" cy="7" r="2" fill="url(#g1)">
            <animate attributeName="opacity" values="0.8;1;0.8" dur="1.6s" repeatCount="indefinite"/>
          </circle>
          <circle cx="12" cy="24" r="1.1" fill="url(#g2)">
            <animate attributeName="opacity" values="1;0.7;1" dur="2.1s" repeatCount="indefinite"/>
          </circle>
          <path d="M17 3L18.6 8H23.9L19.65 11.1L21.2 16L17 12.75L12.8 16L14.35 11.1L10.1 8H15.4L17 3Z"
            fill="url(#g3)">
            <animateTransform attributeName="transform" attributeType="XML"
              type="scale" values="1;1.12;1" dur="2.3s" repeatCount="indefinite"/>
          </path>
          <defs>
            <linearGradient id="g1" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
              <stop stopColor="#59D8FF" />
              <stop offset="1" stopColor="#9052FF" />
            </linearGradient>
            <linearGradient id="g2" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FF6FDB" />
              <stop offset="1" stopColor="#59D8FF" />
            </linearGradient>
            <linearGradient id="g3" x1="8" y1="4" x2="20" y2="18" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FF6FDB" />
              <stop offset="0.5" stopColor="#9052FF" />
              <stop offset="1" stopColor="#59D8FF" />
            </linearGradient>
          </defs>
        </g>
      </svg>
      <style>{`
        @keyframes spin-slow {
          0% { transform: rotate(-6deg);}
          30% { transform: rotate(12deg);}
          60% { transform: rotate(-5deg);}
          100% { transform: rotate(-6deg);}
        }
        .animate-spin-slow {
          animation: spin-slow 3.5s cubic-bezier(.57,.17,.67,.95) infinite;
        }
      `}</style>
    </span>
  );
}

export default function Dashboard() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [formatModal, setFormatModal] = useState({ open: false, file: null });
  const [discussions, setDiscussions] = useState([]);
  const [expandedRows, setExpandedRows] = useState([]);
  const [showDeleteAll, setShowDeleteAll] = useState(false);
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

  const getTypeLabel = (type) => {
    switch (type) {
      case "recorded":
        return "🎙️ הקלטה";
      case "uploaded":
        return "🎵 העלאה";
      case "dictated":
        return "✍️ הכתבה";
      default:
        return "—";
    }
  };

  const cleanTitle = (raw) => {
    if (!raw) return "";
    const decoded = decodeSafe(raw);
    const noExt = decoded.replace(/\.[^/.]+$/, "");
    const noId = noExt.replace(/^\d+_/, "");
    return noId;
  };

  const handleDeleteAll = async () => {
    try {
      setDiscussions([]);
      setShowDeleteAll(false);
    } catch (e) {
      alert("שגיאה במחיקת דיונים");
    }
  };

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

  const toggleRow = (idx) => {
    setExpandedRows((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const handleDeleteOne = async (idx) => {
    if (!window.confirm("האם למחוק את הדיון?")) return;
    const newArr = [...discussions];
    newArr.splice(idx, 1);
    setDiscussions(newArr);
  };

  return (
    <div dir="rtl" className="min-h-screen bg-[#f9fafc] font-[Heebo] relative">
      {/* HEADER */}
      <header
        dir="ltr"
        className="relative overflow-hidden text-white py-6 px-10 flex items-center shadow-lg"
        style={{
          background:
            "linear-gradient(135deg, #06060a 0%, #0b0a18 40%, #151036 70%, #1f1450 100%)",
        }}
      >
        <div className="absolute inset-0 bg-black/25 pointer-events-none" />

        <div className="absolute inset-0 opacity-20 pointer-events-none animate-waveMotion">
          <svg viewBox="0 0 1440 320" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-full">
            <path
              fill="url(#grad1)"
              fillOpacity="0.5"
              d="M0,96L48,112C96,128,192,160,288,154.7C384,149,480,107,576,96C672,85,768,107,864,112C960,117,1056,107,1152,128C1248,149,1344,203,1392,229.3L1440,256L1440,0L0,0Z"
            />
            <defs>
              <linearGradient id="grad1" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#2b1a5a" />
                <stop offset="50%" stopColor="#4c2493" />
                <stop offset="100%" stopColor="#6a3cb8" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="absolute inset-0 opacity-12 pointer-events-none animate-waveMotionSlow">
          <svg viewBox="0 0 1440 320" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-full">
            <path
              fill="url(#grad2)"
              fillOpacity="0.6"
              d="M0,160L60,165.3C120,171,240,181,360,181.3C480,181,600,171,720,149.3C840,128,960,96,1080,80C1200,64,1320,64,1380,64L1440,64L1440,0L1380,0C1320,0,1200,0,1080,0C960,0,840,0,720,0C600,0,480,0,360,0C240,0,120,0,60,0L0,0Z"
            />
            <defs>
              <linearGradient id="grad2" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#1d123e" />
                <stop offset="50%" stopColor="#3a1b78" />
                <stop offset="100%" stopColor="#5b2aa1" />
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
          .animate-waveMotion { animation: waveMotion 10s ease-in-out infinite; }
          @keyframes waveMotionSlow {
            0% { transform: translateX(0); }
            50% { transform: translateX(30px); }
            100% { transform: translateX(0); }
          }
          .animate-waveMotionSlow { animation: waveMotionSlow 20s ease-in-out infinite; }
          .animate-slideDown { animation: slideDown 0.35s ease; }
          @keyframes slideDown {
            from { opacity: 0; transform: translateY(-10px);}
            to { opacity: 1; transform: translateY(0);}
          }
          `}
        </style>

        <div className="relative z-10 flex flex-col items-start text-left">
          <div className="flex items-center gap-3">
            <div className="w-[72px] h-[36px]">
              <NeonAmplitudeIcon width={72} height={36} />
            </div>
            <span className="text-3xl font-extrabold tracking-wide drop-shadow-[0_0_12px_rgba(255,255,255,0.6)]">
              BoardTranscriber
            </span>
          </div>
          <span className="text-[#e6e1f5] text-sm mt-2 font-semibold tracking-wide">
            AI Smart Board Meetings
          </span>
        </div>
      </header>

      {/* כפתור הוספת דיון חדש - top מונמך */}
      <div ref={menuRef} className="absolute top-[150px] left-auto right-[55px] z-20">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="bg-gradient-to-l from-[#5b2aa1] to-[#8a3ffc] text-white py-2 px-5 rounded-lg font-bold shadow-lg hover:scale-105 transition"
        >
          ➕ הוספת דיון חדש
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-2 bg-white text-gray-800 rounded-lg shadow-xl border min-w-[200px] text-right z-10">
            <button className="w-full px-4 py-2 hover:bg-gray-100" onClick={() => navigate("/new-discussion")}>
              🎙️ הקלט דיון
            </button>
            <button className="w-full px-4 py-2 hover:bg-gray-100" onClick={() => navigate("/recording")}>
              🎵 העלאת הקלטה קיימת
            </button>
            <button className="w-full px-4 py-2 hover:bg-gray-100" onClick={() => navigate("/supervised")}>
              ✍️ הכתבה
            </button>
          </div>
        )}
      </div>

      {/* כותרת חכמה במרכז + כוכביות מונפשות */}
      <div className="flex flex-col items-center mt-10 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-gray-700 font-extrabold text-xl tracking-tight flex items-center gap-1">
            רשימת דיונים חכמים
            <AiStarsAnimated />
          </span>
        </div>
      </div>

      {/* רשימת הדיונים */}
      <main>
        <div className="w-[90%] mx-auto mt-10 bg-[#f0f1f5] rounded-xl shadow-md border border-gray-200 overflow-hidden transition-all duration-200">
          <table className="w-full border-collapse text-center text-sm text-gray-700">
            <thead className="bg-[#ececf1] text-gray-700 font-semibold">
              <tr>
                <th className="p-3 w-12 align-middle">
                  <input
                    type="checkbox"
                    onChange={() => setShowDeleteAll(true)}
                    className="w-5 h-5 accent-[#8a3ffc] cursor-pointer"
                    title="סמן למחיקת כל הדיונים"
                  />
                </th>
                <th className="p-3 w-10"></th>
                <th className="p-3">סוג</th>
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
                  <td colSpan="9" className="p-6 text-gray-500">אין דיונים עדיין</td>
                </tr>
              ) : (
                discussions.map((item, idx) => (
                  <React.Fragment key={idx}>
                    <tr
                      className="border-b border-gray-200 hover:bg-[#f8f8fb] cursor-pointer transition"
                      onClick={() => {
                        setExpandedRows((prev) =>
                          prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
                        );
                      }}
                    >
                      <td className="p-3 w-12"></td>
                      <td
                        className="p-3 w-10 align-middle"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleRow(idx);
                        }}
                      >
                        <span
                          className={`cursor-pointer transition text-2xl select-none ${expandedRows.includes(idx) ? "text-[#8a3ffc]" : "text-gray-500"}`}
                          title={expandedRows.includes(idx) ? "סגור" : "הצג דיון"}
                        >
                          {expandedRows.includes(idx) ? "−" : "+"}
                        </span>
                      </td>
                      <td className="p-3">{getTypeLabel(item.type)}</td>
                      <td className="p-3 font-medium text-gray-800">
                        {cleanTitle(item.title || item.filename || item.name)}
                      </td>
                      <td className="p-3 text-gray-700">{item.leader || "לא צוין"}</td>
                      <td className="p-3">{item.date}</td>
                      <td className="p-3">
                        <span className={`text-white px-3 py-1 rounded-full text-xs font-bold ${getStatusClass(item.status)}`}>
                          {item.status === "processing" && "בעיבוד"}
                          {item.status === "ready" && "מוכן"}
                          {item.status === "error" && "שגיאה"}
                        </span>
                      </td>
                      <td
                        className="p-3 text-gray-600 text-sm max-w-[300px] truncate hover:text-[#8a3ffc]"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/discussion/${encodeURIComponent(item.filename)}`);
                        }}
                      >
                        {item.transcriptPreview ? decodeSafe(item.transcriptPreview.slice(0, 100)) + "..." : "—"}
                      </td>
                      <td className="p-3 text-lg flex justify-center gap-4">
                        <span
                          title="נגן הקלטה"
                          onClick={(e) => {
                            e.stopPropagation();
                            const baseName = item.filename;
                            if (!baseName) return alert("שם קובץ לא תקין 🎧");
                            window.open(
                              `http://localhost:3001/play/${encodeURIComponent(baseName)}.wav`,
                              "_blank"
                            );
                          }}
                          className="cursor-pointer hover:scale-110 transition"
                        >
                          🎧
                        </span>
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

                    {expandedRows.includes(idx) && (
                      <tr>
                        <td colSpan={9} className="bg-[#f4ecfb] border-b-2 border-[#8a3ffc] p-4 text-right animate-slideDown">
                          <div className="flex flex-col gap-2">
                            <div className="font-bold text-[#8a3ffc] text-lg mb-2">תוכן הדיון:</div>
                            <div className="text-gray-700 text-sm mb-2 whitespace-pre-line">
                              <b>שם:</b> {cleanTitle(item.title || item.filename || item.name)}<br />
                              <b>מוביל:</b> {item.leader || "לא צוין"}<br />
                              <b>תאריך:</b> {item.date}<br />
                              <b>סטטוס:</b> {item.status}<br />
                              <b>קבצים:</b>
                              <div className="flex gap-4 items-center mt-2">
                                {(item.files || []).map((f, i) => (
                                  <a
                                    key={i}
                                    href={`http://localhost:3001/play/${encodeURIComponent(f)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[#8a3ffc] hover:underline text-lg"
                                  >
                                    🎧 {f}
                                  </a>
                                ))}
                                {(item.attachments || []).map((f, i) => (
                                  <a
                                    key={i}
                                    href={`http://localhost:3000/transcripts/${encodeURIComponent(f)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[#5b2aa1] hover:underline text-lg"
                                  >
                                    📄 {f}
                                  </a>
                                ))}
                              </div>
                              <div style={{ marginTop: "1em" }}>
                                <b>תמלול מלא:</b>
                                <div>{item.transcriptFull ? decodeSafe(item.transcriptFull) : "אין תוכן מלא"}</div>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteOne(idx)}
                              className="bg-red-500 text-white font-bold py-2 px-4 rounded-lg w-fit mt-4 hover:bg-red-700"
                            >
                              מחק דיון זה
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {showDeleteAll && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl text-center">
            <div className="text-xl font-bold mb-4 text-[#8a3ffc]">
              האם אתה בטוח שברצונך למחוק את כל הדיונים מהטבלה?
            </div>
            <div className="flex gap-6 justify-center mt-4">
              <button
                className="bg-red-500 text-white py-2 px-8 rounded-lg font-bold hover:bg-red-700"
                onClick={handleDeleteAll}
              >
                כן, מחק הכל
              </button>
              <button
                className="bg-gray-200 py-2 px-8 rounded-lg font-bold hover:bg-gray-400"
                onClick={() => setShowDeleteAll(false)}
              >
                לא
              </button>
            </div>
          </div>
        </div>
      )}

      {formatModal.open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-[300px] text-center">
            <h2 className="text-lg font-bold mb-4 text-gray-700">בחר פורמט להצגת התמלול</h2>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => handleFileOpen(formatModal.file, "txt")}
                className="bg-[#f5f5f5] hover:bg-[#8a3ffc] hover:text-white text-gray-700 py-2 rounded-lg font-medium transition"
              >
                📝 קובץ TXT
              </button>
              <button
                onClick={() => handleFileOpen(formatModal.file, "pdf")}
                className="bg-[#f5f5f5] hover:bg-[#5b2aa1] hover:text-white text-gray-700 py-2 rounded-lg font-medium transition"
              >
                📄 קובץ PDF
              </button>
              <button
                onClick={() => handleFileOpen(formatModal.file, "docx")}
                className="bg-[#f5f5f5] hover:bg-[#3a3aff] hover:text-white text-gray-700 py-2 rounded-lg font-medium transition"
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
