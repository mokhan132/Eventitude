<template>
    <div>
      <h1>Questions for Event {{ eventId }}</h1>
  
      <!-- Question Bar at the Top -->
      <form @submit.prevent="askQuestion">
        <input
          v-model="newQuestion"
          type="text"
          placeholder="Ask a question..."
          required
        />
        <button type="submit">Submit</button>
      </form>
  
      <!-- Questions List -->
      <ul>
        <li v-for="question in questions" :key="question.question_id">
          <p><strong>{{ question.question }}</strong></p>
          <p>Asked by: {{ question.asked_by.first_name || 'Unknown' }}</p>
          <p>Votes: {{ question.votes }}</p>
  
          <button @click="upvoteQuestion(question.question_id)">Upvote</button>
          <button @click="downvoteQuestion(question.question_id)">Downvote</button>
  
          <!-- Delete Button -->
          <button
            v-if="question.asked_by.user_id === parseInt(userId)"
            @click="deleteQuestion(question.question_id)"
          >
            Delete
          </button>
        </li>
      </ul>
    </div>
  </template>
  
  <script>
  import axios from "axios";
  
  export default {
    name: "QuestionsPage",
    data() {
      return {
        eventId: this.$route.params.eventId,
        questions: [],
        newQuestion: "",
        userId: localStorage.getItem("userId"), // Retrieve userId from localStorage
      };
    },
    async created() {
      try {
        const response = await axios.get(
          `http://localhost:3333/event/${this.eventId}/questions`
        );
        this.questions = response.data;
      } catch (error) {
        console.error("Error fetching questions:", error);
        alert("Failed to load questions for the event.");
      }
    },
    methods: {
    async askQuestion() {
        try {
            await axios.post(
            `http://localhost:3333/event/${this.eventId}/question`,
            { question: this.newQuestion },
            {
                headers: { "X-Authorization": localStorage.getItem("sessionToken") },
            }
            );

            // Re-fetch questions
            const questionsResponse = await axios.get(
            `http://localhost:3333/event/${this.eventId}/questions`,
            {
                headers: { "X-Authorization": localStorage.getItem("sessionToken") },
            }
            );

            this.questions = questionsResponse.data;
            this.newQuestion = "";
            alert("Question submitted!");
        } catch (error) {
            alert(
            error.response?.data?.error_message || "Failed to submit the question."
            );
        }
    },


      async upvoteQuestion(questionId) {
        try {
          await axios.post(
            `http://localhost:3333/question/${questionId}/vote`,
            {},
            {
              headers: { "X-Authorization": localStorage.getItem("sessionToken") },
            }
          );
          alert("Question upvoted!");
        } catch (error) {
          alert("Failed to upvote question.");
        }
      },
      async downvoteQuestion(questionId) {
        try {
          await axios.delete(
            `http://localhost:3333/question/${questionId}/vote`,
            {
              headers: { "X-Authorization": localStorage.getItem("sessionToken") },
            }
          );
          alert("Question downvoted!");
        } catch (error) {
          alert("Failed to downvote question.");
        }
      },
      async deleteQuestion(questionId) {
        try {
          await axios.delete(`http://localhost:3333/question/${questionId}`, {
            headers: { "X-Authorization": localStorage.getItem("sessionToken") },
          });
          alert("Question deleted!");
          this.questions = this.questions.filter(
            (q) => q.question_id !== questionId
          );
        } catch (error) {
          alert(
            error.response?.data?.error_message || "Failed to delete question."
          );
        }
      },
    },
  };
  </script>
  
  