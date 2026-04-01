import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import { connectDB } from './config/db.js';
import pointsRoutes from './routes/points.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import mediaRoutes from './routes/media.routes.js';
import { cleanupExpiredPoints } from './utils/cleanupExpiredPoints.js';

dotenv.config();
connectDB();

const app = express();
app.use(
  cors({
    origin: '*',
    credentials: true
  })
);
app.use(express.json());

const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

app.use('/api/points', pointsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/media', mediaRoutes);

const PORT = process.env.PORT;

server.listen(PORT, () => {
  console.log(`Server started on port - http://localhost:${PORT}`);
});

setInterval(
  () => {
    cleanupExpiredPoints();
  },
  60 * 60 * 1000
);
