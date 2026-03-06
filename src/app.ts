import { SongsimExperience } from './scene/SongsimExperience';

export function bootstrap(container: HTMLElement): SongsimExperience {
  const experience = new SongsimExperience(container);
  experience.start();
  return experience;
}
