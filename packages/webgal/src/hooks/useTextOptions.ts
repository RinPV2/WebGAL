import { playSpeed } from '@/store/userDataInterface';

export function useTextDelay(type: playSpeed) {
  switch (type) {
    case playSpeed.slow:
      return 100;
    case playSpeed.normal:
      return 50;
    case playSpeed.fast:
      return 3;
  }
}

export function useTextAnimationDuration(type: playSpeed) {
  switch (type) {
    case playSpeed.slow:
      return 800;
    case playSpeed.normal:
      return 350;
    case playSpeed.fast:
      return 200;
  }
}
