const db = require("./database.js");
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { dbGet, dbRun, dbAll } = require(".dbHelpers.js");

exports.register = async (req, res) => {
    const { first_name, last_name, email, password } = req.body;

    // Step 1: Validate Required Fields
    if (!first_name || !last_name || !email || !password) {
        return res.status(400).json({ error_message: 'All fields are required' });
    }

    // Step 2: Check for Extra Fields
    const allowedFields = ['first_name', 'last_name', 'email', 'password'];
    const extraFields = Object.keys(req.body).filter(field => !allowedFields.includes(field));
    if (extraFields.length > 0) {
        return res.status(400).json({ error_message: `Unexpected field(s): ${extraFields.join(', ')}` });
    }

    // Step 3: Validate Email Format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error_message: 'Invalid email format' });
    }

    try {
        // Step 4: Check if User Already Exists
        const existingUser = await dbGet('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser) {
            return res.status(400).json({ error_message: 'Email already taken' });
        }

        // Step 5: Hash Password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Step 6: Insert User into Database
        const newUserId = await dbRun(
            'INSERT INTO users (first_name, last_name, email, password) VALUES (?, ?, ?, ?)',
            [first_name, last_name, email, hashedPassword]
        );

        // Step 7: Respond with Success
        res.status(201).json({ user_id: newUserId });
    } catch (error) {
        console.error('Database error during registration:', error);
        res.status(500).json({ error_message: 'Internal server error' });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    // Step 1: Validate Input Fields
    if (!email || !password) {
        return res.status(400).json({ error_message: 'Email and password are required' });
    }

    try {
        // Step 2: Retrieve the User from the Database
        const user = await dbGet('SELECT * FROM users WHERE email = ?', [email]);
        if (!user) {
            return res.status(400).json({ error_message: 'Invalid email or password' });
        }

        // Step 3: Compare Passwords
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error_message: 'Invalid email or password' });
        }

        // Step 4: Generate a JWT Session Token with Extended Expiration
        const sessionToken = jwt.sign({ id: user.user_id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });

        // Step 5: Store the Session Token in the Database
        await dbRun('UPDATE users SET session_token = ? WHERE user_id = ?', [sessionToken, user.user_id]);

        // Step 6: Send a Successful Response
        res.status(200).json({ user_id: user.user_id, session_token: sessionToken });
    } catch (error) {
        console.error('Error during login:', error.message);
        res.status(500).json({ error_message: 'Internal server error' });
    }
};

exports.createEvent = async (req, res) => {
    const sessionToken = req.headers['x-authorization'];

    if (!sessionToken) {
        return res.status(401).json({ error_message: 'Unauthorized: Session token is required' });
    }

    try {
        const user = await dbGet('SELECT * FROM users WHERE session_token = ?', [sessionToken]);
        if (!user) {
            return res.status(401).json({ error_message: 'Unauthorized: Invalid session token' });
        }

        const { name, description, location, start, close_registration, max_attendees } = req.body;

        const requiredFields = ['name', 'description', 'location', 'start', 'close_registration', 'max_attendees'];
        const missingFields = requiredFields.filter(field => !req.body[field] || String(req.body[field]).trim() === '');
        if (missingFields.length > 0) {
            return res.status(400).json({ error_message: `Missing or blank field(s): ${missingFields.join(', ')}` });
        }

        const startDate = new Date(parseInt(start, 10));
        const closeRegistrationDate = new Date(parseInt(close_registration, 10));
        if (isNaN(startDate.getTime()) || startDate < new Date()) {
            return res.status(400).json({ error_message: 'Start date must be a valid future date' });
        }
        if (isNaN(closeRegistrationDate.getTime()) || closeRegistrationDate >= startDate) {
            return res.status(400).json({ error_message: 'Close registration must be before the start date' });
        }

        if (!Number.isInteger(max_attendees) || max_attendees <= 0) {
            return res.status(400).json({ error_message: 'Max attendees must be a positive integer' });
        }

        const newEventId = await dbRun(
            `INSERT INTO events (name, description, location, start_date, close_registration, max_attendees, creator_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [name, description, location, start, close_registration, max_attendees, user.user_id]
        );

        res.status(201).json({ event_id: newEventId });
    } catch (error) {
        res.status(500).json({ error_message: 'Internal server error' });
    }
};

exports.updateEvent = async (req, res) => {
    const sessionToken = req.headers['x-authorization'];
    const eventId = req.params.event_id;

    if (!sessionToken) {
        return res.status(401).json({ error_message: 'Unauthorized: Session token is required' });
    }

    try {
        const user = await dbGet('SELECT * FROM users WHERE session_token = ?', [sessionToken]);
        if (!user) {
            return res.status(401).json({ error_message: 'Unauthorized: Invalid session token' });
        }

        const event = await dbGet('SELECT * FROM events WHERE event_id = ?', [eventId]);
        if (!event) {
            return res.status(404).json({ error_message: 'Event not found' });
        }

        if (event.creator_id !== user.user_id) {
            return res.status(403).json({ error_message: 'Forbidden: You do not have permission to update this event' });
        }

        const allowedFields = ['name', 'description', 'location', 'start_date', 'close_registration', 'max_attendees'];
        const updateFields = {};
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined && req.body[field] !== '') {
                updateFields[field] = req.body[field];
            }
        });

        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({ error_message: 'No valid fields to update' });
        }

        const updateQuery = Object.keys(updateFields)
            .map(field => `${field} = ?`)
            .join(', ');
        const updateValues = [...Object.values(updateFields), eventId];

        await dbRun(`UPDATE events SET ${updateQuery} WHERE event_id = ?`, updateValues);

        res.status(200).json({ message: 'Event updated successfully' });
    } catch (error) {
        res.status(500).json({ error_message: 'Internal server error' });
    }
};

exports.registerForEvent = async (req, res) => {
    const sessionToken = req.headers['x-authorization'];
    const eventId = req.params.event_id;

    if (!sessionToken) {
        return res.status(401).json({ error_message: 'Unauthorized: Session token is required' });
    }

    try {
        const user = await dbGet('SELECT * FROM users WHERE session_token = ?', [sessionToken]);
        if (!user) {
            return res.status(401).json({ error_message: 'Unauthorized: Invalid session token' });
        }

        const event = await dbGet('SELECT * FROM events WHERE event_id = ?', [eventId]);
        if (!event) {
            return res.status(404).json({ error_message: 'Event not found' });
        }

        if (event.creator_id === user.user_id) {
            return res.status(403).json({ error_message: 'You cannot register for an event you created' });
        }

        const registration = await dbGet(
            'SELECT * FROM attendees WHERE event_id = ? AND user_id = ?',
            [eventId, user.user_id]
        );
        if (registration) {
            return res.status(403).json({ error_message: 'You are already registered' });
        }

        if (event.close_registration === -1) {
            return res.status(403).json({ error_message: 'Registration is closed' });
        }

        const attendeeCount = await dbGet('SELECT COUNT(*) AS count FROM attendees WHERE event_id = ?', [eventId]);
        if (attendeeCount.count >= event.max_attendees) {
            return res.status(403).json({ error_message: 'Event is at capacity' });
        }

        await dbRun(
            'INSERT INTO attendees (event_id, user_id) VALUES (?, ?)',
            [eventId, user.user_id]
        );

        res.status(200).json({ message: 'Registration successful' });
    } catch (error) {
        res.status(500).json({ error_message: 'Internal server error' });
    }
};

exports.askQuestion = async (req, res) => {
    const sessionToken = req.headers['x-authorization'];
    const eventId = req.params.event_id;
    const { question } = req.body;

    if (!sessionToken) {
        return res.status(401).json({ error_message: 'Unauthorized: Session token is required' });
    }

    try {
        const user = await dbGet('SELECT * FROM users WHERE session_token = ?', [sessionToken]);
        if (!user) {
            return res.status(401).json({ error_message: 'Unauthorized: Invalid session token' });
        }

        if (!question || question.trim() === '') {
            return res.status(400).json({ error_message: 'Invalid question: Question cannot be blank' });
        }

        const attendee = await dbGet('SELECT * FROM attendees WHERE event_id = ? AND user_id = ?', [eventId, user.user_id]);
        if (!attendee) {
            return res.status(403).json({ error_message: 'You must be registered for the event to ask a question' });
        }

        const event = await dbGet('SELECT * FROM events WHERE event_id = ?', [eventId]);
        if (!event) {
            return res.status(404).json({ error_message: 'Event not found' });
        }

        if (event.creator_id === user.user_id) {
            return res.status(403).json({ error_message: 'Event creators cannot ask questions on their own events' });
        }

        const questionId = await dbRun(
            'INSERT INTO questions (question, asked_by, event_id, votes) VALUES (?, ?, ?, ?)',
            [question, user.user_id, eventId, 0]
        );

        res.status(201).json({ question_id: questionId });
    } catch (error) {
        res.status(500).json({ error_message: 'Internal server error' });
    }
};

exports.deleteQuestion = async (req, res) => {
    const sessionToken = req.headers['x-authorization'];
    const questionId = req.params.question_id;

    if (!sessionToken) {
        return res.status(401).json({ error_message: 'Unauthorized: Session token is required' });
    }

    try {
        const user = await dbGet('SELECT * FROM users WHERE session_token = ?', [sessionToken]);
        if (!user) {
            return res.status(401).json({ error_message: 'Unauthorized: Invalid session token' });
        }

        const question = await dbGet('SELECT * FROM questions WHERE question_id = ?', [questionId]);
        if (!question) {
            return res.status(404).json({ error_message: 'Question not found' });
        }

        const event = await dbGet('SELECT * FROM events WHERE event_id = ?', [question.event_id]);
        if (question.asked_by !== user.user_id && event.creator_id !== user.user_id) {
            return res.status(403).json({ error_message: 'You do not have permission to delete this question' });
        }

        await dbRun('DELETE FROM questions WHERE question_id = ?', [questionId]);
        res.status(200).json({ message: 'Question deleted successfully' });
    } catch (error) {
        res.status(500).json({ error_message: 'Internal server error' });
    }
};

exports.upvoteQuestion = async (req, res) => {
    console.log("[Upvote Question] Request received:", { sessionToken: req.headers['x-authorization'], questionId: req.params.question_id });

    const sessionToken = req.headers['x-authorization'];
    const questionId = req.params.question_id;

    if (!sessionToken) {
        console.log("[Upvote Question] No session token provided");
        return res.status(401).json({ error_message: 'Unauthorized: Session token is required' });
    }

    try {
        const user = await dbGet('SELECT * FROM users WHERE session_token = ?', [sessionToken]);
        if (!user) {
            console.log("[Upvote Question] Invalid session token");
            return res.status(401).json({ error_message: 'Unauthorized: Invalid session token' });
        }

        const question = await dbGet('SELECT * FROM questions WHERE question_id = ?', [questionId]);
        if (!question) {
            console.log("[Upvote Question] Question not found:", questionId);
            return res.status(404).json({ error_message: 'Question not found' });
        }

        const existingVote = await dbGet('SELECT * FROM votes WHERE question_id = ? AND voter_id = ?', [questionId, user.user_id]);
        if (existingVote) {
            console.log("[Upvote Question] User already voted:", user.user_id);
            return res.status(403).json({ error_message: 'You have already voted on this question' });
        }

        await dbRun('INSERT INTO votes (question_id, voter_id) VALUES (?, ?)', [questionId, user.user_id]);
        await dbRun('UPDATE questions SET votes = votes + 1 WHERE question_id = ?', [questionId]);

        console.log("[Upvote Question] Question upvoted successfully:", questionId);
        res.status(200).json({ message: 'Question upvoted successfully' });
    } catch (error) {
        console.error("[Upvote Question] Error:", error);
        res.status(500).json({ error_message: 'Internal server error' });
    }
};

exports.downvoteQuestion = async (req, res) => {
    console.log("[Downvote Question] Request received:", { sessionToken: req.headers['x-authorization'], questionId: req.params.question_id });

    const sessionToken = req.headers['x-authorization'];
    const questionId = req.params.question_id;

    if (!sessionToken) {
        return res.status(401).json({ error_message: 'Unauthorized: Session token is required' });
    }

    try {
        const user = await dbGet('SELECT * FROM users WHERE session_token = ?', [sessionToken]);
        if (!user) {
            return res.status(401).json({ error_message: 'Unauthorized: Invalid session token' });
        }

        const question = await dbGet('SELECT * FROM questions WHERE question_id = ?', [questionId]);
        if (!question) {
            return res.status(404).json({ error_message: 'Question not found' });
        }

        const existingVote = await dbGet('SELECT * FROM votes WHERE question_id = ? AND voter_id = ?', [questionId, user.user_id]);
        if (!existingVote) {
            await dbRun('INSERT INTO votes (question_id, voter_id) VALUES (?, ?)', [questionId, user.user_id]);
        }

        await dbRun('UPDATE questions SET votes = votes - 1 WHERE question_id = ?', [questionId]);
        res.status(200).json({ message: 'Question downvoted successfully' });
    } catch (error) {
        res.status(500).json({ error_message: 'Internal server error' });
    }
};

// Helper function to retrieve event questions with details
async function getEventQuestions(eventId) {
    const questions = await dbAll(
        `SELECT q.question_id, q.question, q.votes, u.user_id AS asked_by_user_id, u.first_name AS asked_by_first_name
         FROM questions q
         JOIN users u ON q.asked_by = u.user_id
         WHERE q.event_id = ?
         ORDER BY q.votes DESC, q.question_id DESC`,
        [eventId]
    );

    return questions.map(q => ({
        question_id: q.question_id,
        question: q.question,
        votes: q.votes,
        asked_by: {
            user_id: q.asked_by_user_id,
            first_name: q.asked_by_first_name,
        },
    }));
}

exports.getEventById = async (req, res) => {
    const sessionToken = req.headers['x-authorization'];
    const eventId = req.params.event_id;

    try {
        const user = sessionToken
            ? await dbGet('SELECT * FROM users WHERE session_token = ?', [sessionToken])
            : null;

        const event = await dbGet('SELECT * FROM events WHERE event_id = ?', [eventId]);
        if (!event) {
            return res.status(404).json({ error_message: 'Event not found' });
        }

        const response = {
            event_id: event.event_id,
            creator: {
                creator_id: event.creator_id,
                first_name: event.creator_first_name,
                last_name: event.creator_last_name,
                email: event.creator_email
            },
            name: event.name,
            description: event.description,
            location: event.location,
            start: event.start_date,
            close_registration: event.close_registration,
            max_attendees: event.max_attendees,
            number_attending: event.attendees_count
        };

        if (user && user.user_id === event.creator_id) {
            const attendees = await dbAll(
                'SELECT user_id, first_name, last_name, email FROM attendees INNER JOIN users ON attendees.user_id = users.user_id WHERE event_id = ?',
                [eventId]
            );
            response.attendees = attendees;
        }

        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ error_message: 'Internal server error' });
    }
};

exports.getAllEvents = async (req, res) => {
    try {
        // Fetch all events from the database
        const events = await dbAll('SELECT * FROM events');

        // If no events exist, return an empty array
        if (!events.length) {
            return res.status(200).json([]);
        }

        // Transform events to include readable date formats (optional)
        const formattedEvents = events.map(event => ({
            event_id: event.event_id,
            name: event.name,
            description: event.description,
            location: event.location,
            start: new Date(event.start_date).toISOString(),
            close_registration: new Date(event.close_registration).toISOString(),
            max_attendees: event.max_attendees,
            creator_id: event.creator_id,
        }));

        // Return the events
        res.status(200).json(formattedEvents);
    } catch (error) {
        console.error('Error fetching all events:', error);
        res.status(500).json({ error_message: 'Internal server error' });
    }
};

exports.GetAuthorEvents = async (req, res) => {
    const sessionToken = req.headers['x-authorization'];
    if (!sessionToken) {
        return res.status(401).json({ error_message: 'Unauthorized' });
    }
    try {
        const user = await dbGet('SELECT * FROM users WHERE session_token = ?', [sessionToken]);
        if (!user) {
            return res.status(401).json({ error_message: 'Invalid session token' });
        }
        const events = await dbAll('SELECT * FROM events WHERE creator_id = ?', [user.user_id]);
        res.status(200).json(events);
    } catch (error) {
        console.error('Error fetching user events:', error);
        res.status(500).json({ error_message: 'Internal server error' });
    }
};

exports.getAttendees = async (req, res) => {
    const sessionToken = req.headers['x-authorization'];
  
    if (!sessionToken) {
      return res.status(401).json({ error_message: 'Unauthorized: Session token is required' });
    }
  
    try {
      const user = await dbGet('SELECT * FROM users WHERE session_token = ?', [sessionToken]);
      if (!user) {
        return res.status(401).json({ error_message: 'Unauthorized: Invalid session token' });
      }
  
      const attendedEvents = await dbAll(
        `SELECT e.event_id, e.name, e.description, e.start_date, e.close_registration, e.max_attendees
         FROM attendees a
         INNER JOIN events e ON a.event_id = e.event_id
         WHERE a.user_id = ?`,
        [user.user_id]
      );
  
      res.status(200).json(attendedEvents);
    } catch (error) {
      console.error('Error fetching attended events:', error);
      res.status(500).json({ error_message: 'Internal server error' });
    }
};

exports.getAllQuestions = async (req, res) => {
    const eventId = req.params.event_id;
  
    try {
      const questions = await dbAll(
        `SELECT q.question_id, q.question, q.votes, u.user_id AS asked_by_user_id, u.first_name AS asked_by_first_name
         FROM questions q
         JOIN users u ON q.asked_by = u.user_id
         WHERE q.event_id = ?
         ORDER BY q.votes DESC, q.question_id DESC`,
        [eventId]
      );
  
      res.status(200).json(
        questions.map((q) => ({
          question_id: q.question_id,
          question: q.question,
          votes: q.votes,
          asked_by: {
            user_id: q.asked_by_user_id,
            first_name: q.asked_by_first_name,
          },
        }))
      );
    } catch (error) {
      console.error("Error fetching questions:", error);
      res.status(500).json({ error_message: "Internal server error" });
    }
};
  
exports.deleteEvent = async (req, res) => {
    const sessionToken = req.headers['x-authorization'];
    const eventId = req.params.event_id;

    if (!sessionToken) {
        return res.status(401).json({ error_message: 'Unauthorized: Session token is required' });
    }

    try {
        const user = await dbGet('SELECT * FROM users WHERE session_token = ?', [sessionToken]);
        if (!user) {
            return res.status(401).json({ error_message: 'Unauthorized: Invalid session token' });
        }

        const event = await dbGet('SELECT * FROM events WHERE event_id = ?', [eventId]);
        if (!event) {
            return res.status(404).json({ error_message: 'Event not found' });
        }

        if (event.creator_id !== user.user_id) {
            return res.status(403).json({ error_message: 'Forbidden: You do not have permission to delete this event' });
        }

        await dbRun('UPDATE events SET close_registration = -1 WHERE event_id = ?', [eventId]);
        res.status(200).json({ message: 'Event archived successfully' });
    } catch (error) {
        res.status(500).json({ error_message: 'Internal server error' });
    }
};

exports.logout = async (req, res) => {
    const sessionToken = req.headers['x-authorization'];

    if (!sessionToken) {
        return res.status(401).json({ error_message: 'Session token is required' });
    }

    try {
        const user = await dbGet('SELECT * FROM users WHERE session_token = ?', [sessionToken]);
        if (!user) {
            return res.status(401).json({ error_message: 'Invalid session token' });
        }

        await dbRun('UPDATE users SET session_token = NULL WHERE user_id = ?', [user.user_id]);
        res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
        console.error('Error during logout:', error);
        res.status(500).json({ error_message: 'Internal server error' });
    }
};

