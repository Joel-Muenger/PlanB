import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import './styles.css';
import App from './App';
import { adoptParentHistoryState, BASE_PATH } from './lib/viewMode';

adoptParentHistoryState();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename={BASE_PATH || undefined}>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
