<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>BoardTranscriber — תמלול לא מקוון</title>
  <style>
    body { font-family: "Heebo", Arial, sans-serif; background: #f5f5f5; text-align: center; direction: rtl; padding-top: 60px; }
    h1 { color: #222; margin-bottom: 20px; }
    input, button { margin: 10px; font-size: 16px; }
    button { background: #d61e5b; color: #fff; border: none; border-radius: 6px; padding: 10px 20px; cursor: pointer; }
    button:disabled { background: #aaa; }
    #status { margin-top: 15px; font-weight: bold; }
    #transcript { margin: 25px auto; width: 80%; max-width: 700px; height: 300px; background: white; border: 1px solid #ccc; padding: 10px; overflow-y: auto; white-space: pre-wrap; }
  </style>
</head>
<body>
  <h1>BoardTranscriber — תמלול לא מקוון</h1>
  <input type="file" id="audioFile" accept="audio/*">
  <button id="uploadBtn">העלה ותרגם</button>
  <div id="status">בחר קובץ שמע (.wav / .mp3 / .m4a)</div>
  <div id="transcript">כאן יופיע התמלול...</div>

  <script>
    const uploadBtn = document.getElementById("uploadBtn");
    const status = document.getElementById("status");
    const transcriptBox = document.getElementById("transcript");

    uploadBtn.onclick = async () => {
      const fileInput = document.getElementById("audioFile");
      const file = fileInput.files[0];
      if (!file) {
        alert("אנא בחר קובץ שמע תחילה.");
        return;
      }

      const formData = new FormData();
      formData.append("file", file);

      status.textContent = "מעלה קובץ... אנא המתן.";

      try {
        const res = await fetch("http://localhost:3000/api/transcribe/recording", {
          method: "POST",
          body: formData
        });
        const data = await res.json();
        if (data.status === "ok") {
          status.textContent = "✅ התמלול הושלם בהצלחה.";
          transcriptBox.textContent = data.transcriptPreview || "לא התקבל טקסט.";
        } else {
          status.textContent = "שגיאה במהלך התמלול.";
          console.error(data);
        }
      } catch (err) {
        status.textContent = "שגיאה בהעלאת הקובץ.";
        console.error(err);
      }
    };
  </script>
</body>
</html>

