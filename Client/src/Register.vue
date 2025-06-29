<template>
  <div class="register">
    <h2>Register</h2>
    <form @submit.prevent="handleRegister">
      <label>First Name:</label>
      <input type="text" v-model="firstName" required />
      <label>Last Name:</label>
      <input type="text" v-model="lastName" required />
      <label>Email:</label>
      <input type="email" v-model="email" required />
      <label>Password:</label>
      <input type="password" v-model="password" required />
      <button type="submit">Register</button>
    </form>
  </div>
</template>

<script>
export default {
  name: 'RegisterPage',
  data() {
    return {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
    };
  },
  methods: {
    handleRegister() {
      console.log('Registration attempted:', this.firstName, this.lastName, this.email);
      // Add backend integration here
    },
  },
};
</script>

<style scoped>
.register {
  margin: 50px auto;
  width: 300px;
  text-align: center;
}
form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}
button {
  margin-top: 10px;
  padding: 10px;
  font-size: 1em;
  color: white;
  background-color: #28a745;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}
button:hover {
  background-color: #218838;
}
</style>
