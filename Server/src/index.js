import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './routes/user.js';
import donorListRoutes from './routes/donorList.js';
import donorRoutes from './routes/donor.js';
import eventRoutes from './routes/event.js';
import progressRoutes from './routes/progress.js';

// 加载环境变量
dotenv.config();

const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 路由
app.use('/api/user', userRoutes);
app.use('/api/lists', donorListRoutes);
app.use('/api/donors', donorRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/progress', progressRoutes);

// 添加健康检查路由
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

// Only start the server if this file is run directly
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3000;
  console.log('Environment variables:', {
    PORT: process.env.PORT,
    NODE_ENV: process.env.NODE_ENV
  });
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Server is listening on all network interfaces`);
  });
}

export default app; 