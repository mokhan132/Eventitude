<template>
  <div>
    <h1>Your Events</h1>
    <div v-for="event in events" :key="event.event_id" class="event-item">
      <h2>{{ event.name }}</h2>
      <p>{{ event.description }}</p>
      <p><strong>Location:</strong> {{ event.location }}</p>
      <p><strong>Start Date:</strong> {{ new Date(event.start_date).toLocaleString() }}</p>
      <p><strong>Close Registration:</strong> {{ new Date(event.close_registration).toLocaleString() }}</p>
      <button @click="deleteEvent(event.event_id)">Delete Event</button>
      <button @click="editEvent(event)">Update Event</button>
    </div>

    <!-- Update Form -->
    <div v-if="currentEvent" class="update-form">
      <h2>Update Event</h2>
      <form @submit.prevent="updateEvent">
        <label for="name">Name:</label>
        <input id="name" v-model="currentEvent.name" type="text" required />

        <label for="description">Description:</label>
        <textarea id="description" v-model="currentEvent.description" required></textarea>

        <label for="location">Location:</label>
        <input id="location" v-model="currentEvent.location" type="text" required />

        <label for="start_date">Start Date:</label>
        <input id="start_date" v-model="currentEvent.start_date" type="datetime-local" required />

        <label for="close_registration">Close Registration:</label>
        <input id="close_registration" v-model="currentEvent.close_registration" type="datetime-local" required />

        <button type="submit">Save Changes</button>
        <button type="button" @click="cancelEdit">Cancel</button>
      </form>
    </div>

    <p v-if="message">{{ message }}</p>
    <button @click="navigateBack">Back</button>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "EventList",
  data() {
    return {
      events: [], // Stores user's events
      currentEvent: null, // Event being edited
      message: "", // Feedback message
    };
  },
  async created() {
    // Fetch user's events when the component is created
    try {
      const sessionToken = localStorage.getItem("sessionToken");
      const response = await axios.get("http://localhost:3333/user/events", {
        headers: { "x-authorization": sessionToken },
      });
      this.events = response.data;
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  },
  methods: {
    async deleteEvent(eventId) {
      // Handle event deletion
      try {
        const sessionToken = localStorage.getItem("sessionToken");
        const response = await axios.delete(`http://localhost:3333/event/${eventId}`, {
          headers: { "x-authorization": sessionToken },
        });

        if (response.status === 200) {
          this.message = "Event deleted successfully!";
          this.events = this.events.filter((event) => event.event_id !== eventId); // Update UI
        }
      } catch (error) {
        console.error("Error deleting event:", error);
        this.message = error.response?.data?.error_message || "An error occurred.";
      }
    },
    editEvent(event) {
      // Open the update form with selected event details
      this.currentEvent = { ...event }; // Clone the event to avoid direct mutation
    },
    async updateEvent() {
      // Handle event update
      try {
        const sessionToken = localStorage.getItem("sessionToken");
        const response = await axios.patch(
          `http://localhost:3333/event/${this.currentEvent.event_id}`,
          this.currentEvent,
          {
            headers: { "x-authorization": sessionToken },
          }
        );

        if (response.status === 200) {
          this.message = "Event updated successfully!";
          // Update the event in the UI
          const index = this.events.findIndex(
            (event) => event.event_id === this.currentEvent.event_id
          );
          if (index !== -1) {
            this.events[index] = { ...this.currentEvent };
          }
          this.currentEvent = null; // Close the update form
        }
      } catch (error) {
        console.error("Error updating event:", error);
        this.message = error.response?.data?.error_message || "An error occurred.";
      }
    },
    cancelEdit() {
      // Close the update form without saving
      this.currentEvent = null;
    },
    navigateBack() {
      // Navigate back to the login page
      this.$router.push("/login");
    },
  },
};
</script>

<style scoped>
.event-item {
  border: 1px solid #ccc;
  padding: 15px;
  margin-bottom: 10px;
  border-radius: 5px;
}

.update-form {
  border: 1px solid #007bff;
  padding: 15px;
  margin-top: 20px;
  border-radius: 5px;
  background-color: #f9f9f9;
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

button[type="submit"] {
  background-color: #28a745;
}

button[type="submit"]:hover {
  background-color: #218838;
}

button[type="button"] {
  background-color: #ff4d4d;
}

button[type="button"]:hover {
  background-color: #cc0000;
}
</style>


