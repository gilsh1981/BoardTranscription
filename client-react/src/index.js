import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// ✅ יוצרים root רגיל בלי StrictMode כדי למנוע ריצות כפולות של useEffect
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

// אם תרצה בעתיד להחזיר מדידות ביצועים, אפשר להשאיר:
reportWebVitals();
