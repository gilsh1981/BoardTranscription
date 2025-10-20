import React, { useState, useEffect, useRef } from "react";

export default function Dashboard() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  const discussions = [
    { title: "דיון אסטרטגי", type: "ישיבת הנהלה", date: "20.10.2025", duration: "00:02:15", participants: "דניאל, רחם, גלעד", status: "processing", files: "🎧" },
    { title: "זיהוי רבעון 4", type: "שיחת רבעון", date: "19.10.2025", duration: "00:05:42", participants: "מיכל, נועם, דנה", status: "ready", files: "📄 🎧" },
    { title: "דיון בטיחות", type: "ישיבת צוות", date: "18.10.2025", duration: "00:03:27", participants: "טל, דינה, רוני", status: "error", files: "📄 🎧" },
  ];

  const getStatusClass = (status) => {
    switch (status) {
      case "ready":
        return "bg-green-500";
      case "processing":
        return "bg-orange-500";
      case "error":
        return "bg-red-500";
      default:
        return "";
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-white font-[Heebo]">
      {/* Header */}
      <header className="bg-gradient-to-l from-[#ff6f00] to-[#b347ff] text-white py-4 px-6 flex items-center justify-between">
        {/* Title on the LEFT */}
        <div className="flex flex-col items-start text-left">
          <span className="text-2xl font-bold">BoardTranscriber</span>
          <div className="flex items-center gap-2 text-[#ffeedd] text-sm mt-1">
            <span>In every conversation</span>
            <div className="flex items-center justify-center w-7 h-7 font-bold text-white bg-[radial-gradient(circle_at_30%_30%,#ffb84d,#ff6f00_60%,#b347ff)] shadow-[0_0_10px_rgba(255,111,0,0.8)] rounded-full">AI</div>
          </div>
        </div>

        {/* Button on the RIGHT (in white background zone) */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="bg-gradient-to-l from-[#ff6f00] to-[#b347ff] text-white py-2 px-5 rounded-lg font-bold shadow hover:opacity-90 transition"
          >
            ➕ הוספת דיון חדש
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 bg-white text-gray-800 rounded-lg shadow-lg border min-w-[200px] text-right">
              <button className="w-full px-4 py-2 hover:bg-gray-100">🎙️ הקלט דיון</button>
              <button className="w-full px-4 py-2 hover:bg-gray-100">📁 העלאת הקלטה קיימת</button>
              <button className="w-full px-4 py-2 hover:bg-gray-100">✍️ הכתבה</button>
            </div>
          )}
        </div>
      </header>

      {/* Centered Title */}
      <div className="text-center text-sm font-bold mt-6 text-gray-700">רשימת תמלולים ודיונים</div>

      {/* Search */}
      <div className="flex justify-center my-8">
        <input
          type="text"
          placeholder="🔍 חפש דיון, משתתף או כותרת..."
          className="w-72 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#b347ff]"
        />
      </div>

      {/* Table */}
      <table className="w-[90%] mx-auto border-collapse shadow text-center text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-3">נושא הדיון</th>
            <th className="p-3">סוג האירוע</th>
            <th className="p-3">תאריך</th>
            <th className="p-3">משך</th>
            <th className="p-3">משתתפים</th>
            <th className="p-3">סטטוס</th>
            <th className="p-3">קבצים</th>
          </tr>
        </thead>
        <tbody>
          {discussions.map((item, idx) => (
            <tr key={idx} className="border-b hover:bg-gray-50">
              <td className="p-3">{item.title}</td>
              <td className="p-3">{item.type}</td>
              <td className="p-3">{item.date}</td>
              <td className="p-3">{item.duration}</td>
              <td className="p-3">{item.participants}</td>
              <td className="p-3">
                <span className={`text-white px-3 py-1 rounded-full text-xs font-bold ${getStatusClass(item.status)}`}>
                  {item.status === "processing" && "בעיבוד"}
                  {item.status === "ready" && "מוכן"}
                  {item.status === "error" && "שגיאה"}
                </span>
              </td>
              <td className="p-3">{item.files}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
