const PARAMETER_TYPE = 'PARAMETER_TYPE';
const TEXT_TYPE = 'TEXT_TYPE';

/**
 * @typedef { {
 *   type: string,
 *   value: string,
 *   start: number,
 *   length: number,
 *   end: number,
 * } } TextProcessorItem
 */

export class TextProcessor {
  static BRACKET_LEFT = '{';
  static BRACKET_RIGHT = '}';
  static PARAMETER_DELIMITER = '.';

  constructor(text) {
    if (text) {
      this.text = text;
    }
  }

  #text = '';

  /**
   * @type { TextProcessorItem[] }
   */
  #state = [];

  get text() {
    return this.#text;
  }

  set text(value) {
    if (this.text === value) {
      return;
    }

    this.#text = value;
    this.#processText();
  }

  #processText() {
    const state = [];

    let value = '';
    let position = 0;
    let variableInProcess = false;

    const addToState = (type) => {
      if (!value) {
        return;
      }

      const length = value.length;

      state.push({
        type,
        value,
        start: position,
        length,
        end: position + length,
      });
    };

    this.text.split('').forEach((char, idx) => {
      if (char === TextProcessor.BRACKET_LEFT) {
        addToState(TEXT_TYPE);

        variableInProcess = true;

        value = '{';
        position = idx;
        return;
      }

      value += char;

      if (char === TextProcessor.BRACKET_RIGHT && variableInProcess) {
        addToState(PARAMETER_TYPE);

        variableInProcess = false;

        value = '';
        position = idx;
      }
    });

    if (value) {
      addToState(variableInProcess ? PARAMETER_TYPE : TEXT_TYPE);
    }

    this.#state = state;
  }

  /**
   * @param { (item: TextProcessorItem, idx: number) => boolean } predicate
   * @return TextProcessorItem | undefined
   */
  getItem(predicate = () => {}) {
    return this.#state.find((item, idx) => predicate(item, idx));
  }

  /**
   * @param { TextProcessorItem } textProcessorItem
   * @param { string } text
   */
  replaceInnerText(textProcessorItem, text) {
    textProcessorItem.value = isText(textProcessorItem)
      ? text
      : `${TextProcessor.BRACKET_LEFT}${text}${
          textProcessorItem.value.endsWith(TextProcessor.BRACKET_RIGHT) &&
          !text.endsWith(TextProcessor.BRACKET_RIGHT)
            ? TextProcessor.BRACKET_RIGHT
            : ''
        }`;
    this.#updateTextByState();

    return this;
  }

  #updateTextByState() {
    this.text = this.#state.map((item) => item.value).join('');
  }
}

/**
 * @param { TextProcessorItem } processorItem
 * @return { boolean }
 */
export const isText = (processorItem) => processorItem.type === TEXT_TYPE;

/**
 * @param { TextProcessorItem } processorItem
 * @return { boolean }
 */
export const isParameter = (processorItem) =>
  processorItem.type === PARAMETER_TYPE;

/**
 * @param { TextProcessorItem } processorItem
 * @return { string }
 */
export const getParameterInnerText = (processorItem) => {
  if (!processorItem) {
    return '';
  }

  const { value } = processorItem;
  if (!isParameter(processorItem)) {
    return value;
  }

  return value.endsWith(TextProcessor.BRACKET_RIGHT)
    ? value.slice(1, -1)
    : value.slice(1);
};
