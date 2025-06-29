<template>
  <div class="home">
    <h1>Welcome to Eventitude</h1>
    <div class="button-container">
      <router-link to="/register"><button>Register</button></router-link>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HomePage',
};
</script>

<style scoped>
.home {
  text-align: center;
  margin-top: 50px;
}
.button-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  gap: 15px;
}
button {
  padding: 10px 20px;
  font-size: 1em;
  color: white;
  background-color: #007bff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}
button:hover {
  background-color: #0056b3;
}
</style>
