import { createRoot } from 'react-dom/client';
import '@/styles/popup.css';
import { App } from '@/popup/App';

const container = document.getElementById('root');
if (container) createRoot(container).render(<App />);
