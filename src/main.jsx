import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.jsx';
import { UserProvider } from './context/UserContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import './styles/global.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ToastProvider>
      <UserProvider>
        <App />
      </UserProvider>
    </ToastProvider>
  </StrictMode>,
);
