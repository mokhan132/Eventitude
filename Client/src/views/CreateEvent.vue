<template>
    <div class="create-event-container">
      <h1>Create Event</h1>
      <form @submit.prevent="handleCreateEvent">
        <label for="name">Event Name:</label>
        <input id="name" v-model="name" type="text" required />
  
        <label for="description">Description:</label>
        <textarea id="description" v-model="description" required></textarea>
  
        <label for="location">Location:</label>
        <input id="location" v-model="location" type="text" required />
  
        <label for="start">Start Date and Time:</label>
        <input id="start" v-model="start" type="datetime-local" required />
  
        <label for="close_registration">Close Registration Date and Time:</label>
        <input id="close_registration" v-model="close_registration" type="datetime-local" required />
  
        <label for="max_attendees">Max Attendees:</label>
        <input id="max_attendees" v-model.number="max_attendees" type="number" min="1" required />
  
        <button type="submit">Create Event</button>
        <button type="button" @click="goBack" class="back-button">Back</button>
      </form>
  
      <!-- Display Messages -->
      <p v-if="successMessage" class="success-message">{{ successMessage }}</p>
      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
    </div>
  </template>
  
  <script>
  import axios from "axios";
  
  export default {
    name: "CreateEventPage",
    data() {
      return {
        name: "",
        description: "",
        location: "",
        start: "",
        close_registration: "",
        max_attendees: null,
        successMessage: "",
        errorMessage: "",
      };
    },
    methods: {
      async handleCreateEvent() {
        try {
          this.successMessage = "";
          this.errorMessage = "";
  
          // Convert dates to timestamps
          const startTimestamp = new Date(this.start).getTime();
          const closeRegistrationTimestamp = new Date(this.close_registration).getTime();
  
          // Send event data to backend
          const sessionToken = localStorage.getItem("sessionToken");
          const response = await axios.post(
            "http://localhost:3333/events",
            {
              name: this.name,
              description: this.description,
              location: this.location,
              start: startTimestamp,
              close_registration: closeRegistrationTimestamp,
              max_attendees: this.max_attendees,
            },
            {
              headers: {
                "X-Authorization": sessionToken,
              },
            }
          );
  
          if (response.status === 201) {
            this.successMessage = "Event created successfully!";
            this.resetForm();
          }
        } catch (error) {
          console.error("Error creating event:", error);
          this.errorMessage =
            error.response?.data?.error_message || "An error occurred while creating the event.";
        }
      },
      resetForm() {
        this.name = "";
        this.description = "";
        this.location = "";
        this.start = "";
        this.close_registration = "";
        this.max_attendees = null;
      },
      goBack() {
        this.$router.go(-1); // Navigates to the previous page in the browser's history
      },
    },
  };
  </script>
  
  <style scoped>
  .create-event-container {
    max-width: 600px;
    margin: 50px auto;
    padding: 20px;
    border: 1px solid #ddd;
    border-radius: 10px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    background-color: #f9f9f9;
    text-align: left;
  }
  
  form {
    display: flex;
    flex-direction: column;
  }
  
  label {
    margin-bottom: 5px;
    font-weight: bold;
  }
  
  input,
  textarea,
  button {
    margin-bottom: 15px;
    padding: 10px;
    font-size: 1em;
  }
  
  textarea {
    resize: vertical;
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
  
  .back-button {
    background-color: #6c757d;
  }
  
  .back-button:hover {
    background-color: #5a6268;
  }
  
  .success-message {
    color: green;
    font-weight: bold;
  }
  
  .error-message {
    color: red;
    font-weight: bold;
  }
  </style>
  