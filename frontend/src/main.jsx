import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

const rootElement = document.getElementById('root');

if (!rootElement) {
  document.body.innerHTML = '<div style="color:red; padding:20px; font-size:20px;">CRITICAL ERROR: Root element not found in index.html</div>';
  throw new Error("Root element missing");
}

try {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
} catch (err) {
  console.error("React Mount Error:", err);
  document.body.innerHTML = `<div style="color:red; padding:20px; font-size:20px;"><h1>Startup Failed</h1><p>${err.toString()}</p></div>`;
}