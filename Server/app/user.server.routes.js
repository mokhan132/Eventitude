const express = require('express');
const router = express.Router();
const authController = require("./eventsControllers.js");
const authMiddleware = require("./auth.middleware.js");

// User routes
router.post('/users', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);

// Event routes
router.post('/events', authMiddleware, authController.createEvent);
router.get('/event/:event_id', authMiddleware, authController.getEventById);
router.get('/user/events', authMiddleware, authController.GetAuthorEvents)
router.patch('/event/:event_id', authMiddleware, authController.updateEvent);
router.post('/event/:event_id', authMiddleware, authController.registerForEvent);
router.delete('/event/:event_id', authMiddleware, authController.deleteEvent);
router.get('/events', authController.getAllEvents);
router.get('/user/attended-events', authController.getAttendees);

// Add routes for questions
router.get('/event/:event_id/questions', authMiddleware, authController.getAllQuestions);
router.post('/event/:event_id/question', authMiddleware, authController.askQuestion);
router.delete('/question/:question_id', authMiddleware, authController.deleteQuestion);
router.post('/question/:question_id/vote', authMiddleware, authController.upvoteQuestion);
router.delete('/question/:question_id/vote', authMiddleware, authController.downvoteQuestion);

module.exports = router;