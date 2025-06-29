import { createRouter, createWebHistory } from "vue-router";
import Login from "./views/Login.vue";
import Register from "./views/Register.vue";
import CreateEvent from "./views/CreateEvent.vue";
import Home from "./views/Home.vue";
import Eventlist from "./views/Eventlist.vue";
import JoinEvents from "./views/JoinEvents.vue";
import Questions from "./views/Questions.vue";

const routes = [
  { path: "/", name: "HomePage", component: Home },
  { path: "/register", name:"RegisterPage",component: Register },
  { path: "/create-event", component: CreateEvent },
  { path: "/login", name: "LoginPage", component: Login},
  { path: "/events", component: Eventlist},
  { path: "/event/questions/:eventId", name: "QuestionsPage", component: Questions },
  { path: "/join-event", component: JoinEvents}
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;

