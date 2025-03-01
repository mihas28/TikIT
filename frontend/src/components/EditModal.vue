<script setup lang="ts">
import { ref, defineProps, defineEmits } from 'vue';

const props = defineProps(['item']);
const emit = defineEmits(['close']);

const updatedItem = ref({ ...props.item });

const saveChanges = () => {
  console.log('Shranjene spremembe:', updatedItem.value);
  emit('close');
};
</script>

<template>
  <div class="modal">
    <div class="modal-content">
      <h3>Uredi podatke</h3>
      <label>Uporabniško ime:</label>
      <input type="text" v-model="updatedItem.username" />
      
      <label>Elektronski naslov:</label>
      <input type="email" v-model="updatedItem.email" />

      <label>Ime:</label>
      <input type="email" v-model="updatedItem.firstName" />

      <label>Priimek:</label>
      <input type="email" v-model="updatedItem.lastName" />

      <label>Telefonska številka:</label>
      <input type="text" v-model="updatedItem.phoneNumber" />

      <label>Vloga:</label>
      <select v-model="updatedItem.role">
        <option value="user">Uporabnik</option>
        <option value="operator">Operator</option>
        <option value="admin">Skrbnik</option>
      </select>

      <button class="bt-save" @click="saveChanges">Shrani</button>
      <button class="bt-close" @click="$emit('close')">Zapri</button>
    </div>
  </div>
</template>

<style scoped>
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 5px;
  width: 300px;
}

.bt-save {
  background-color: #4DD6AA;
  color: white;
  border: none;
  margin-top: 10px;
  padding: 10px;
  cursor: pointer;
}

button, input, form, option { border-radius: 5px;}

.bt-close {
  background-color: #F04E4E;
  color: white;
  border: none;
  padding: 10px;
  margin-top: 10px;
  cursor: pointer;
}
</style>
