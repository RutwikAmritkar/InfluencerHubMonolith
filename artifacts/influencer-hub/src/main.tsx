import { createRoot } from 'react-dom/client';
import { setBaseUrl } from '@/api-client-react';

import App from './App';

import './i18n';
import './index.css';

const apiUrl = import.meta.env.VITE_API_URL;
if (apiUrl) {
  setBaseUrl(apiUrl);
}

createRoot(document.getElementById('root')!).render(<App />);
