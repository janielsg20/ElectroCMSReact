import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import './styles.css';
import './app/workspace/workspace-responsive.css';
import './app/editor/canvas/canvas.css';
import './app/editor/canvas/canvas-interactions.css';
import './app/ui/ui-foundation.css';
import './app/studio/studio.css';
import './app/editor/builder-v2.css';
import './app/editor/builder-v2-polish.css';
import './app/ui/bento-high-density.css';
import './app/ui/bento-modern-polish.css';
import './app/ui/reference-builder-layout.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('ElectroCMS root element was not found.');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
