interface BootstrapModule {
  bootstrap(container: HTMLElement): unknown;
}

type BootstrapLoader = () => Promise<BootstrapModule>;

export const LOADING_MESSAGE = 'Songsim Campus is loading...';
export const ERROR_MESSAGE = 'Failed to load Songsim Campus. Please refresh and try again.';

const defaultLoader: BootstrapLoader = () => import('./app');

export async function loadBootstrapInto(
  container: HTMLElement,
  loader: BootstrapLoader = defaultLoader
): Promise<boolean> {
  container.textContent = LOADING_MESSAGE;

  try {
    const { bootstrap } = await loader();
    container.textContent = '';
    bootstrap(container);
    return true;
  } catch {
    container.textContent = ERROR_MESSAGE;
    return false;
  }
}
