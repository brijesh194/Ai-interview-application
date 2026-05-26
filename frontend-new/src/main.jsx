import { StrictMode } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
