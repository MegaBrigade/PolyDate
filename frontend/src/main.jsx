import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './css/registration.css';   
import './css/test.css';           
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);