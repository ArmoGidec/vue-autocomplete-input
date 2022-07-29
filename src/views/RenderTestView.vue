<template>
  <div class="block">
    Counter 1: {{ counter1 }}
    <br />
    <hr />
    <br />
    <button @click="increment1()">Inc counter1</button>
  </div>
  <div class="block">
    <button @click="toggleShow()">Toggle</button>

    <template v-if="showCounter2">
      <br />
      Counter 2: {{ counter2 }}
      <br />
      <hr />
      <br />
      <button @click="increment2()">Inc counter1</button>
    </template>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const counter1 = ref(0);
const increment1 = () => {
  counter1.value += 1;
};

const counter2 = ref(0);
const increment2 = () => {
  counter2.value += 1;
};

const showCounter2 = ref(false);
const toggleShow = () => {
  showCounter2.value = !showCounter2.value;
};
</script>

<style scoped lang="scss">
.block {
  border: 1px solid gray;
  border-radius: 8px;
  box-shadow: 0 5px 10px 2px rgba(34, 60, 80, 0.2);

  margin-bottom: 15px;
  padding: 20px;
}
</style>
