import React, { useState } from 'react';

export default function NewDiscussionSetup() {
  const [discussionType, setDiscussionType] = useState('');
  const [topic, setTopic] = useState('');
  const [purpose, setPurpose] = useState('');
  const [language, setLanguage] = useState('עברית');
  const [leaderName, setLeaderName] = useState('');
  const [leaderEmail, setLeaderEmail] = useState('');

  const discussionTypes = ['ישיבה', 'ועדה', 'שיחת רבעון', 'פרוטוקול', 'אחר'];

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 flex flex-col p-10">
      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-semibold text-gray-800">הגדרת דיון חדש</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Right side - Participants */}
        <div className="bg-white rounded-2xl shadow p-8 border border-gray-200 flex flex-col justify-between order-2 md:order-2">
          <div>
            <h2 className="text-xl font-bold mb-6 text-gray-700">הוסף משתתפים</h2>

            <div className="grid gap-5">
              <div className="border rounded-xl p-5 hover:border-pink-400 cursor-pointer transition-all">
                <h3 className="font-semibold text-gray-800 mb-2">מהארגון שלי 👥</h3>
                <p className="text-gray-500 text-sm">בחר משתתפים מרשימת הארגון שלך בקלות.</p>
              </div>

              <div className="border rounded-xl p-5 hover:border-pink-400 cursor-pointer transition-all">
                <h3 className="font-semibold text-gray-800 mb-2">ייבוא רשימה 📋</h3>
                <p className="text-gray-500 text-sm">העלה קובץ CSV או הדבק רשימה קיימת.</p>
              </div>

              <div className="border rounded-xl p-5 hover:border-pink-400 cursor-pointer transition-all">
                <h3 className="font-semibold text-gray-800 mb-2">הזמנה בקישור 🔗</h3>
                <p className="text-gray-500 text-sm">צור קישור חכם לשליחה למשתתפים, הם יתווספו אוטומטית לאחר אישורם.</p>
              </div>
            </div>
          </div>

          <button className="mt-8 py-3 bg-gradient-to-r from-pink-500 to-orange-400 text-white font-bold rounded-xl shadow hover:opacity-90 transition-all">
            המשך
          </button>
        </div>

        {/* Left side - Discussion details */}
        <div className="bg-white rounded-2xl shadow p-8 border border-gray-200 order-1 md:order-1">
          <h2 className="text-xl font-bold mb-6 text-gray-700">פרטי הדיון</h2>

          <label className="block mb-3 text-gray-600">סוג הדיון</label>
          <select
            value={discussionType}
            onChange={(e) => setDiscussionType(e.target.value)}
            className="w-full mb-5 border rounded-lg p-3 focus:ring-2 focus:ring-pink-400 focus:outline-none"
          >
            <option value="">בחר סוג דיון</option>
            {discussionTypes.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>

          <label className="block mb-3 text-gray-600">נושא הדיון</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="לדוגמה: ישיבת הנהלה חודשית"
            className="w-full mb-5 border rounded-lg p-3 focus:ring-2 focus:ring-pink-400 focus:outline-none"
          />

          <label className="block mb-3 text-gray-600">מטרת הדיון</label>
          <textarea
            rows="3"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="סיכום נושאים עיקריים, קבלת החלטות, תכנון המשך..."
            className="w-full mb-5 border rounded-lg p-3 focus:ring-2 focus:ring-pink-400 focus:outline-none"
          />

          <label className="block mb-3 text-gray-600">שפת הדיון</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full mb-5 border rounded-lg p-3 focus:ring-2 focus:ring-pink-400 focus:outline-none"
          >
            <option>עברית</option>
            <option>אנגלית</option>
          </select>

          <label className="block mb-3 text-gray-600">מוביל הדיון</label>
          <input
            type="text"
            value={leaderName}
            onChange={(e) => setLeaderName(e.target.value)}
            placeholder="שם מלא"
            className="w-full mb-3 border rounded-lg p-3 focus:ring-2 focus:ring-pink-400 focus:outline-none"
          />

          <input
            type="email"
            value={leaderEmail}
            onChange={(e) => setLeaderEmail(e.target.value)}
            placeholder="אימייל מוביל הדיון"
            className="w-full mb-5 border rounded-lg p-3 focus:ring-2 focus:ring-pink-400 focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}
