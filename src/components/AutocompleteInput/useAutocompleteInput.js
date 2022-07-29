import { isLeaf } from '@/components/AutocompleteInput/utils';
import {
  getParameterInnerText,
  isParameter,
  TextProcessor,
} from './TextProcessor';
import { get, last, uniqueId } from 'lodash';
import { computed, markRaw, reactive, ref } from 'vue';

/**
 * @param props
 * @param emit
 * @return { {
 *  currentProcessorItem: TextProcessorItem|undefined,
 *  textProcessor: TextProcessor,
 *  isShowMenu: boolean,
 *  localModelValue: string,
 *  autocompleteInProcess: boolean,
 *  isFocused: boolean,
 *  mirrorContent: string,
 *  filter: string,
 *  filteredSelectList: {value: string}[],
 *  currentProcessorItemPath: string[],
 *  caretPosition: number,
 *  activeOptionIdx: number,
 *  id: string,
 *  popperOptions: PopperOptions,
 *  inputRef: null,
 *  mirrorCaretRef: HTMLDivElement | undefined,
 *  optionRefs: HTMLLIElement[],
 *  tooltipRef: ElTooltip,
 * } }
 */
export const useAutocompleteInputStates = (props, emit) => {
  const id = uniqueId('autocomplete');
  const localModelValue = computed({
    get: () => props.modelValue,
    set: (value) => {
      emit('update:modelValue', value);
    },
  });

  const textProcessor = markRaw(new TextProcessor(localModelValue.value));

  const caretPosition = ref(-1);

  const currentProcessorItem = computed(() => {
    const currentCursorPosition = caretPosition.value;
    const item = textProcessor.getItem((processorItem) => {
      const { start, end, value } = processorItem;

      return (
        currentCursorPosition > start &&
        (value.endsWith(TextProcessor.BRACKET_RIGHT)
          ? currentCursorPosition < end
          : currentCursorPosition <= end)
      );
    });

    return item;
  });

  const currentProcessorItemPath = computed(() =>
    getParameterInnerText(currentProcessorItem.value).split('.')
  );

  const parameterValue = computed(() => {
    const path = currentProcessorItemPath.value.slice(0, -1);
    return path.length ? get(props.tree, path) : props.tree;
  });

  const selectList = computed(() => {
    const { value } = parameterValue;
    return isLeaf(value)
      ? []
      : Object.keys(value).map((option) => ({
          value: option,
        }));
  });

  const autocompleteInProcess = computed(
    () =>
      currentProcessorItem.value !== undefined &&
      isParameter(currentProcessorItem.value)
  );

  const activeOptionIdx = ref(0);
  const isFocused = ref(false);

  const isShowMenu = computed(() => {
    if (!isFocused.value) {
      return false;
    }

    if (!autocompleteInProcess.value) {
      return false;
    }

    const possibleLeaf = get(props.tree, currentProcessorItemPath.value);

    if (possibleLeaf === undefined) {
      return true;
    }

    return !isLeaf(possibleLeaf);
  });

  const filter = computed(() => last(currentProcessorItemPath.value));
  const filteredSelectList = computed(() =>
    selectList.value.filter((selectItem) =>
      selectItem.value.includes(filter.value)
    )
  );

  const mirrorContent = computed(() =>
    localModelValue.value.slice(0, caretPosition.value)
  );

  const popperOptions = {
    modifiers: [
      {
        name: 'offset',
        options: {
          offset: [0, 0],
        },
      },
    ],
  };

  return reactive({
    id,
    localModelValue,
    caretPosition,
    currentProcessorItem,
    textProcessor,
    currentProcessorItemPath,
    autocompleteInProcess,
    activeOptionIdx,
    isFocused,
    isShowMenu,
    filter,
    filteredSelectList,
    mirrorContent,
    popperOptions,

    // refs
    inputRef: ref(null),
    tooltipRef: ref(null),
    mirrorCaretRef: ref(null),
    optionRefs: ref([]),
  });
};
