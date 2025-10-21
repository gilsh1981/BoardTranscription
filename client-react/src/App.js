import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Dashboard from "./Dashboard";
import DiscussionRecording from "./discussion_recording";
import UploadRecording from "./upload_recording";
import DictationPage from "./DictationPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/live" element={<DiscussionRecording />} />
        <Route path="/recording" element={<UploadRecording />} />
        <Route path="/supervised" element={<DictationPage />} />
      </Routes>
    </Router>
  );
}

export default App;

