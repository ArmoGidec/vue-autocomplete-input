<template>
  <div class="autocomplete-input">
    <div class="autocomplete-input__wrapper">
      <el-input
        v-model="localModelValue"
        ref="inputRef"
        :id="id"
        class="autocomplete-input__main-input"
        @keydown.down="handleDown($event)"
        @keydown.up="handleUp($event)"
        @keydown.tab="applyOption($event)"
        @keydown.enter="applyOption($event)"
        @focus="handleFocus()"
        @blur="handleBlur()"
        @input="handleInput"
        @keyup="triggerPosition()"
        @click="triggerPosition()"
      />
      <div class="autocomplete-input__mirror">
        <span class="autocomplete-input__mirror-content">
          {{ mirrorContent }}
        </span>
        <span
          ref="mirrorCaretRef"
          class="autocomplete-input__mirror-caret"
        ></span>
      </div>
    </div>
    <el-tooltip
      ref="tooltipRef"
      effect="light"
      :visible="isShowMenu"
      popper-class="autocomplete-input__popper"
      :visible-arrow="false"
      :show-arrow="false"
      virtual-triggering
      :virtual-ref="mirrorCaretRef"
      placement="bottom-start"
      :popper-options="popperOptions"
    >
      <template #content>
        <el-scrollbar
          max-height="400px"
          tag="ul"
          view-class="autocomplete-input__option-list"
          class="autocomplete-input__option-list-wrapper"
        >
          <template v-if="!isEmptyTree">
            <li v-for="(option, idx) in filteredSelectList" :key="option.value">
              <label
                :ref="(el) => (optionRefs[idx] = el)"
                :for="id"
                class="autocomplete-input__option-item"
                :class="{
                  'autocomplete-input__option-item--active':
                    idx === activeOptionIdx,
                }"
                @mousedown.stop.prevent
                @click="pickOption(idx)"
              >
                {{ option.value }}
              </label>
            </li>
          </template>
          <li v-else>
            <label
              ref="optionRefs"
              :for="id"
              class="autocomplete-input__option-item autocomplete-input__option-item--active"
            >
              No data
            </label>
          </li>
        </el-scrollbar>
      </template>
    </el-tooltip>
  </div>
</template>

<script>
import { useAutocompleteInputStates } from './useAutocompleteInput';
import { isLeaf } from './utils';
import { isParameter, TextProcessor } from './TextProcessor';
import { useCaretPosition } from './useCaretPosition';
import { useFocus } from './useFocus';
import { get } from 'lodash';
import {
  computed,
  defineComponent,
  toRefs,
  watch,
  nextTick,
  unref,
  toRaw,
  triggerRef,
} from 'vue';

export default defineComponent({
  name: 'AutocompleteInput',

  props: {
    modelValue: {
      type: String,
      default: '',
    },
    tree: {
      type: Object,
      default: () => ({}),
    },
  },

  emits: ['update:modelValue'],

  setup(props, { emit }) {
    const states = useAutocompleteInputStates(props, emit);

    const { triggerPosition, setPosition } = useCaretPosition(
      states,
      computed(() => states.inputRef.ref)
    );

    const handleInput = () => {
      triggerPosition();
    };

    /**
     * @param { (ev?: KeyboardEvent) => void } cb
     * @return { (ev?: KeyboardEvent) => void }
     */
    const createHandler = (cb) => (ev) => {
      if (!states.autocompleteInProcess) {
        return;
      }

      ev?.preventDefault();
      ev?.stopPropagation();
      cb(ev);
    };

    const handleUp = createHandler(() => {
      states.activeOptionIdx = Math.max(states.activeOptionIdx - 1, 0);
    });

    const handleDown = createHandler(() => {
      states.activeOptionIdx = Math.min(
        states.activeOptionIdx + 1,
        states.filteredSelectList.length - 1
      );
    });

    const { handleBlur, handleFocus } = useFocus(states);

    const applyOption = createHandler(async () => {
      const option = states.filteredSelectList[states.activeOptionIdx];

      if (!option) {
        return;
      }

      const { value } = option;
      const { end, value: currentProcessorItemValue } =
        states.currentProcessorItem;
      const fromPosition = currentProcessorItemValue.endsWith(
        TextProcessor.BRACKET_RIGHT
      )
        ? end - 1
        : end;
      const path = states.currentProcessorItemPath.slice(0, -1);
      path.push(value);

      const possibleLeaf = get(props.tree, path);

      const text = `${path.join('.')}${
        isLeaf(possibleLeaf) ? TextProcessor.BRACKET_RIGHT : '.'
      }`;

      states.textProcessor.replaceInnerText(states.currentProcessorItem, text);
      states.localModelValue = states.textProcessor.text;

      setPosition(
        fromPosition /* от начала позиции */ -
          states.filter
            .length /* вычитаем длину введенного значения (фильтра) */ +
          value.length /* прибавляем длину выбранного значения */ +
          1 /* и сдвигаем на 1 символ (точка/закрывающая скобка) */
      );
    });

    const pickOption = (idx) => {
      activeOptionIdx.value = idx;
      applyOption();
    };

    watch(
      () => states.localModelValue,
      (text) => {
        states.textProcessor.text = text;
      }
    );

    watch([() => states.isShowMenu, () => states.filteredSelectList], () => {
      states.activeOptionIdx = 0;
    });

    watch(
      () => states.activeOptionIdx,
      (idx) => {
        if (!states.isShowMenu) {
          return;
        }
        const el = states.optionRefs[idx];
        el?.scrollIntoView({
          block: 'nearest',
        });
      }
    );

    watch(
      () => states.mirrorContent,
      async () => {
        await nextTick();
        unref(states.tooltipRef)?.updatePopper();
      },
      {
        flush: 'post',
      }
    );

    watch(
      () => states.isFocused,
      (isFocused) => {
        if (isFocused) {
          triggerPosition();
        }
      }
    );

    watch(
      () => states.currentProcessorItem,
      () => {
        const { currentProcessorItem } = states;
        if (
          !currentProcessorItem ||
          !isParameter(currentProcessorItem) ||
          currentProcessorItem.value.endsWith(TextProcessor.BRACKET_RIGHT)
        ) {
          return;
        }

        const cachePosition = states.caretPosition;
        states.textProcessor.replaceInnerText(
          currentProcessorItem,
          `${currentProcessorItem.value.slice(1)}${TextProcessor.BRACKET_RIGHT}`
        );
        states.localModelValue = states.textProcessor.text;

        setPosition(cachePosition);
        triggerRef(toRaw(states).caretPosition);
      }
    );

    const {
      id,
      localModelValue,
      activeOptionIdx,
      isShowMenu,
      isEmptyTree,
      filteredSelectList,
      mirrorContent,
      popperOptions,

      inputRef,
      mirrorCaretRef,
      tooltipRef,
      optionRefs,
    } = toRefs(states);

    return {
      // variables
      localModelValue,
      id,
      mirrorContent,
      isShowMenu,
      popperOptions,
      isEmptyTree,
      filteredSelectList,
      activeOptionIdx,

      // component/element refs
      inputRef,
      mirrorCaretRef,
      tooltipRef,
      optionRefs,

      // functions/methods
      handleDown,
      handleUp,
      applyOption,
      handleFocus,
      handleBlur,
      triggerPosition,
      pickOption,
      handleInput,
    };
  },
});
</script>

<style lang="scss">
.autocomplete-input {
  position: relative;
  width: 100%;

  &__main-input,
  &__second-input {
    width: 100%;
  }

  &__main-input {
    --el-input-bg-color: transparent;
    position: relative;
    z-index: 2;
  }

  &__option {
    &-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    &-item {
      display: block;
      padding: 9px 14px;
      width: 45ch;
      cursor: pointer;
      overflow: hidden;
      text-overflow: ellipsis;

      &:hover,
      &--active {
        background-color: var(--el-fill-color);
      }
    }
  }

  &__popper {
    --el-popper-border-radius: 0;
    padding: 0;
  }

  &__mirror {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 1px 11px;
    display: inline-flex;
    overflow: hidden;
    opacity: 0;

    &-caret {
      height: 100%;
      width: 1px;
      display: inline-block;
    }

    &-content {
      display: inline-block;
      max-width: 100%;
      font-family: Arial, serif;
    }
  }
}
</style>
