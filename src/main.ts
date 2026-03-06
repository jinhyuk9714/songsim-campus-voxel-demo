import './style.css';
import { loadBootstrapInto } from './boot';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('Missing #app container.');
}

void loadBootstrapInto(app);
