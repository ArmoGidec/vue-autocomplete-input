import { debounce } from 'lodash';
import { unref } from 'vue';

/**
 * @param { { caretPosition: Ref<number> } } states
 * @param { Ref<HTMLInputElement> | HTMLInputElement } input
 * @return { {
 *    caretPosition: Ref<number>,
 *    triggerPosition: () => void,
 *    resetPosition: () => void,
 *    setPosition: (position: number) => void
 * } }
 */
export const useCaretPosition = (states, input) => {
  const getCursorPosition = () => {
    return unref(input)?.selectionStart;
  };

  const triggerPosition = debounce(() => {
    states.caretPosition = getCursorPosition();
  });

  const setPosition = debounce((position) => {
    states.caretPosition = position;
    const el = unref(input);
    el.setSelectionRange(position, position);
  });

  return {
    setPosition,
    triggerPosition,
  };
};
