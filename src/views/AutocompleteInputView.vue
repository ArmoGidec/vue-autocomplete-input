<template>
  <el-card>
    <el-form
      ref="formRef"
      :model="{ text }"
      label-position="top"
      @submit.prevent.stop
    >
      <el-form-item prop="text" label="Значение текста">
        <autocomplete-input v-model="text" :tree="tree" />
      </el-form-item>
    </el-form>
  </el-card>

  <el-card>
    <el-form
      ref="formRef"
      :model="{ text }"
      label-position="top"
      @submit.prevent.stop
    >
      <el-form-item prop="text" label="Значение дерева">
        <el-input v-model="treeText" autosize type="textarea" />

        <template v-if="hasErrors">
          <span style="color: var(--el-color-danger)">
            Есть ошибки в структуре дерева
          </span>
        </template>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup>
import { ref, watch } from 'vue';
import { AutocompleteInput } from '@/components/AutocompleteInput';

const text = ref('');

const treeText = ref(
  JSON.stringify(
    {
      session: {
        name: 'string',
      },
      dialog: {
        order: {
          number: 'string',
          status: 'string',
        },
        phone: 'string',
      },
      message: {
        code: 'string',
        name: 'string',
        name2: 'string',
        name3: 'string',
        name4: 'string',
        name5: 'string',
        name6: 'string',
        name7: 'string',
        name8: 'string',
        name9: 'string',
        name10: 'string',
        name11: 'string',
        name12: 'string',
        name13: 'string',
        name14: 'string',
        name15: 'string',
        name16: 'string',
      },
    },
    null,
    2
  )
);

const tree = ref(JSON.parse(treeText.value));
const hasErrors = ref(false);

watch(treeText, () => {
  try {
    hasErrors.value = false;
    tree.value = JSON.parse(treeText.value);
  } catch {
    hasErrors.value = true;
    tree.value = {};
  }
});
</script>
