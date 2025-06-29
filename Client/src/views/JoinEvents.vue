<template>
  <div>
    <h1>Available Events</h1>
    <ul>
      <li v-for="event in events" :key="event.event_id">
        <p><strong>{{ event.name }}</strong></p>
        <p>{{ event.description }}</p>
        <button @click="attendEvent(event.event_id)">Attend</button>
        <button
          class="questions-button"
          @click="handleGoToQuestions(event.event_id)"
        >
          Go to Questions
        </button>
      </li>
    </ul>

    <!-- Success Message -->
    <div v-if="successMessage">
      <p class="success-message">{{ successMessage }}</p>    
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  data() {
    return {
      events: [], // List of all available events
      attendedEvents: [], // Events the user has attended
      successMessage: "", // Success message for attending an event
    };
  },
  async created() {
    try {
      // Fetch all events
      const allEventsResponse = await axios.get("http://localhost:3333/events");
      this.events = allEventsResponse.data;

      // Fetch attended events
      const attendedEventsResponse = await axios.get(
        "http://localhost:3333/user/attended-events",
        {
          headers: {
            "X-Authorization": localStorage.getItem("sessionToken"),
          },
        }
      );
      this.attendedEvents = attendedEventsResponse.data.map(
        (event) => event.event_id
      );
    } catch (error) {
      console.error("Error fetching events or attended events:", error);
      alert("Could not fetch events.");
    }
  },
  methods: {
    async attendEvent(eventId) {
      try {
        // Call backend to attend the event
        await axios.post(
          `http://localhost:3333/event/${eventId}`,
          {},
          {
            headers: {
              "X-Authorization": localStorage.getItem("sessionToken"),
            },
          }
        );
        // Update success message
        this.successMessage = "Successfully registered for the event!";
        this.attendedEvents.push(eventId); // Add event to attended list
        setTimeout(() => {
          this.successMessage = ""; // Clear success message after 3 seconds
        }, 3000); // Adjust timing as needed
      } catch (error) {
        console.error("Error attending event:", error);
        alert(
          error.response?.data?.error_message || "Error attending the event."
        );
      }
    },
    handleGoToQuestions(eventId) {
      if (this.attendedEvents.includes(eventId)) {
        // Navigate to the Questions page if the user has attended the event
        this.$router.push(`/event/questions/${eventId}`);
      } else {
        // Show alert if the user hasn't attended the event
        alert("Please attend the event to view or interact with the questions.");
      }
    },
  },
};
</script>

<style scoped>
.success-message {
  color: green;
  margin-top: 20px;
  font-weight: bold;
}

.questions-button {
  margin-top: 10px;
  padding: 10px 20px;
  font-size: 1em;
  color: white;
  background-color: #28a745;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.questions-button:hover {
  background-color: #218838;
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
