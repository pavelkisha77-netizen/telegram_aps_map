import express from 'express';
import Point from '../models/Point.js';
import { io } from '../server.js';

const router = express.Router();

function getMarkerColor(createdAt) {
  const created = new Date(createdAt).getTime();
  const now = Date.now();
  const diffMs = now - created;

  const hour = 60 * 60 * 1000;

  if (diffMs < hour) return 'red';
  if (diffMs < 2 * hour) return 'yellow';
  if (diffMs < 3 * hour) return 'blue';

  return null;
}

router.get('/', async (req, res) => {
  try {
    const now = new Date();

    const points = await Point.find({
      expiresAt: { $gt: now }
    }).sort({ createdAt: -1 });

    const preparedPoints = points
      .map((point) => {
        const markerColor = getMarkerColor(point.createdAt);

        if (!markerColor) return null;

        return {
          ...point.toObject(),
          markerColor
        };
      })
      .filter(Boolean);

    res.json(preparedPoints);
  } catch (error) {
    console.error('Failed to fetch points:', error);
    res.status(500).json({ message: 'Failed to fetch points' });
  }
});

router.post('/', async (req, res) => {
  try {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 3 * 60 * 60 * 1000);
    const deleteAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const point = await Point.create({
      ...req.body,
      expiresAt,
      deleteAt
    });

    io.emit('point:created', point);

    res.status(201).json({
      ...point.toObject(),
      markerColor: 'red'
    });
  } catch (error) {
    console.error('Failed to create point:', error);
    res.status(500).json({ message: 'Failed to create point' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const updatedPoint = await Point.findByIdAndUpdate(
      req.params.id,
      {
        title: req.body.title,
        description: req.body.description,
        location: req.body.location,
        media: req.body.media
      },
      { new: true }
    );

    if (!updatedPoint) {
      return res.status(404).json({ message: 'Point not found' });
    }

    io.emit('point:update', updatedPoint);

    const markerColor = getMarkerColor(updatedPoint.createdAt);

    res.json({
      ...updatedPoint.toObject(),
      markerColor
    });
  } catch (error) {
    console.error('Failed to update point:', error);
    res.status(500).json({ message: 'Failed to update point' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deletedPoint = await Point.findByIdAndDelete(req.params.id);

    if (!deletedPoint) {
      return res.status(404).json({ message: 'Point not found' });
    }

    io.emit('point:deleted', { _id: req.params.id });

    res.json({ success: true });
  } catch (error) {
    console.error('Failed to delete point:', error);
    res.status(500).json({ message: 'Failed to delete point' });
  }
});

export default router;
