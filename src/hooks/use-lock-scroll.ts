import { useLayoutEffect } from 'react';

type UseLockScrollProp = {
  locked: boolean;
};

export function useLockScroll({ locked }: UseLockScrollProp) {
  useLayoutEffect(() => {
    if (locked) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
  }, [locked]);
}
