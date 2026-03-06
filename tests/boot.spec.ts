import { describe, expect, it, vi } from 'vitest';
import { ERROR_MESSAGE, LOADING_MESSAGE, loadBootstrapInto } from '../src/boot';

function createContainer(): HTMLElement {
  return ({
    textContent: null
  } as unknown) as HTMLElement;
}

describe('boot loader', () => {
  it('shows a loading message, clears it, and boots the app module', async () => {
    const container = createContainer();
    const bootstrap = vi.fn();

    const result = await loadBootstrapInto(container, async () => {
      expect(container.textContent).toBe(LOADING_MESSAGE);
      return { bootstrap };
    });

    expect(result).toBe(true);
    expect(container.textContent).toBe('');
    expect(bootstrap).toHaveBeenCalledWith(container);
  });

  it('shows a failure message when the bootstrap module cannot be imported', async () => {
    const container = createContainer();

    const result = await loadBootstrapInto(container, async () => {
      throw new Error('network failure');
    });

    expect(result).toBe(false);
    expect(container.textContent).toBe(ERROR_MESSAGE);
  });
});
