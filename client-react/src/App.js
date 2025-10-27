import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Dashboard from "./Dashboard";
import DiscussionRecording from "./discussion_recording";
import UploadRecording from "./upload_recording";
import DictationPage from "./DictationPage";
import NewDiscussionSetup from "./NewDiscussionSetup";
import DiscussionView from "./DiscussionView";
import PlayRecording from "./PlayRecording"; // ✅ נוודא שהנתיב תואם בדיוק לשם הקובץ

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/discussion-recording" element={<DiscussionRecording />} />
        <Route path="/new-discussion" element={<NewDiscussionSetup />} />
        <Route path="/recording" element={<UploadRecording />} />
        <Route path="/supervised" element={<DictationPage />} />
        <Route path="/discussion/:filename" element={<DiscussionView />} />

        {/* ✅ עמוד השמעת הקלטה המעוצב */}
        <Route path="/play/:filename" element={<PlayRecording />} />
      </Routes>
    </Router>
  );
}

export default App;
