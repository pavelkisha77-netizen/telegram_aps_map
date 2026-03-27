import express from 'express';
import Point from '../models/Point.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const points = await Point.find().sort({ createdAt: -1 });
    res.json(points);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch points' });
  }
});

router.post('/', async (req, res) => {
  try {
    const point = await Point.create(req.body);
    res.status(201).json(point);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create point' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const updatedPoint = await Point.findByIdAndUpdate(req.params.id, req.body, { new: true });

    res.json(updatedPoint);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update point' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Point.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete point' });
  }
});

export default router;
