// ===============================================
// BoardTranscription Client API helper
// ===============================================

import axios from "axios";

// כתובת הבקאנד שלך (Node.js)
const API_BASE = "http://localhost:3000";

// פונקציות עיקריות ל־frontend
export const api = {
  // רשימת תמלולים
  async listTranscripts() {
    const res = await axios.get(`${API_BASE}/api/list-transcripts`);
    return res.data.transcripts || [];
  },

  // העלאת קובץ אודיו
  async uploadAudio(formData) {
    const res = await axios.post(`${API_BASE}/api/upload-audio`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  // קבלת טקסט תמלול
  async getTranscript(filename) {
    const res = await axios.get(`${API_BASE}/api/transcript/${filename}`);
    return res.data;
  },

  // בדיקת מצב תמלול
  async checkTranscript(file) {
    const res = await axios.get(`${API_BASE}/api/check-transcript?file=${file}`);
    return res.data;
  },

  // רשימת הקלטות
  async listRecordings() {
    const res = await axios.get(`${API_BASE}/api/list-recordings`);
    return res.data.recordings || [];
  },
};

export default api;
