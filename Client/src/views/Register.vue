<template>
  <div class="register-container">
    <h1>Register</h1>
    <form @submit.prevent="handleRegister">
      <label for="first_name">First Name:</label>
      <input id="first_name" v-model="first_name" type="text" required />

      <label for="last_name">Last Name:</label>
      <input id="last_name" v-model="last_name" type="text" required />

      <label for="email">Email:</label>
      <input id="email" v-model="email" type="email" required />

      <label for="password">Password:</label>
      <input id="password" v-model="password" type="password" required />

      <button type="submit">Register</button>
    </form>

    <!-- Display messages -->
    <p v-if="successMessage" class="success-message">{{ successMessage }}</p>
    <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "RegisterPage",
  data() {
    return {
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      successMessage: "",
      errorMessage: "",
    };
  },
  methods: {
    async handleRegister() {
      try {
        this.successMessage = ""; // Clear any previous messages
        this.errorMessage = "";

        const response = await axios.post("http://localhost:3333/users", {
          first_name: this.first_name,
          last_name: this.last_name,
          email: this.email,
          password: this.password,
        });

        // If successful, show success message
        if (response.status === 201) {
          this.successMessage = "Registered successfully, please login.";
          this.first_name = "";
          this.last_name = "";
          this.email = "";
          this.password = "";
        }
      } catch (error) {
        console.error("Error during registration:", error);
        this.errorMessage = error.response?.data?.error_message || "An error occurred during registration.";
      }
    },
  },
};
</script>

<style scoped>
.success-message {
  color: green;
  margin-top: 10px;
}

.error-message {
  color: red;
  margin-top: 10px;
}
</style>
