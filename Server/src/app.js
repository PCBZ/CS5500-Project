import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './routes/user.js';
import donorRoutes from './routes/donor.js';
import eventRoutes from './routes/event.js';


// load environment variables
dotenv.config();

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// routes
app.use('/api/user', userRoutes);
app.use('/api/donor', donorRoutes);
app.use('/api/events', eventRoutes);

// error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something broke!' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 