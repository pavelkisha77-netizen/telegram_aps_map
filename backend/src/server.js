import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import pointsRoutes from './routes/points.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import mediaRoutes from './routes/media.routes.js';
import { cleanupExpiredPoints } from './utils/cleanupExpiredPoints.js';

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/points', pointsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/media', mediaRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port - http://localhost:${PORT}`));
setInterval(
  () => {
    cleanupExpiredPoints();
  },
  60 * 60 * 1000
);
