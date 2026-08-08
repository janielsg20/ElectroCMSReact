import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import './styles.css';
import './app/workspace/workspace-responsive.css';
import './app/editor/canvas/canvas.css';
import './app/editor/canvas/canvas-interactions.css';
import './app/studio/studio.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('ElectroCMS root element was not found.');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
