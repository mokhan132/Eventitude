<template>
  <div class="login-container">
    <h1>Login</h1>
    <form @submit.prevent="handleLogin">
      <label for="email">Email:</label>
      <input id="email" v-model="email" type="email" required />

      <label for="password">Password:</label>
      <input id="password" v-model="password" type="password" required />

      <button type="submit">Login</button>
    </form>

    <!-- Navigation Buttons -->
    <div v-if="isLoggedIn" class="button-container">
      <button @click="navigateToCreateEvent">Create Event</button>
      <button @click="navigateToEventList">Check My Events</button>
      <button @click="navigateToJoinEvents">Join Events</button>
      <button @click="handleLogout">Logout</button>
    </div>

    <!-- Success/Error Messages -->
    <p v-if="successMessage" class="success-message">{{ successMessage }}</p>
    <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "LoginPage",
  data() {
    return {
      email: "",
      password: "",
      successMessage: "",
      errorMessage: "",
      isLoggedIn: !!localStorage.getItem("sessionToken"),
    };
  },
  methods: {
    async handleLogin() {
      try {
        this.errorMessage = "";
        this.successMessage = "";
        const response = await axios.post("http://localhost:3333/login", {
          email: this.email,
          password: this.password,
        });
        if (response.status === 200) {
          this.successMessage = "Login successful!";
          localStorage.setItem("sessionToken", response.data.session_token);
          localStorage.setItem("userId", response.data.user_id);
          this.isLoggedIn = true;
          this.$router.push("/login");
        }
      } catch (error) {
        this.errorMessage = error.response?.data?.error_message || "An error occurred.";
      }
    },
    navigateToCreateEvent() {
      this.$router.push("/create-event");
    },
    navigateToEventList() {
      this.$router.push("/events");
    },
    navigateToJoinEvents() {
      this.$router.push("/join-event");
    },
    async handleLogout() {
      try {
        const sessionToken = localStorage.getItem("sessionToken");
        await axios.post(
          "http://localhost:3333/logout",
          {},
          {
            headers: {
              "X-Authorization": sessionToken,
            },
          }
        );
        localStorage.removeItem("sessionToken");
        this.isLoggedIn = false;
        this.successMessage = "Logout successful!";
        this.$router.push("/login");
      } catch (error) {
        console.error("Error during logout:", error);
        alert("An error occurred during logout.");
      }
    },
  },
};
</script>

<style scoped>
.login-container {
  text-align: center;
  margin-top: 50px;
}

.button-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  gap: 10px;
}

button {
  padding: 10px 15px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

button:hover {
  background-color: #0056b3;
}

.success-message {
  color: green;
  margin-top: 20px;
}

.error-message {
  color: red;
  margin-top: 20px;
}
</style>

  