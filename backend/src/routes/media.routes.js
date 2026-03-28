import express from 'express';
import cloudinary from '../config/cloudinary.js';

const router = express.Router();

router.post('/delete', async (req, res) => {
  try {
    const { public_id, resource_type } = req.body;

    if (!public_id) {
      return res.status(400).json({ message: 'public_id is required' });
    }

    const result = await cloudinary.uploader.destroy(public_id, {
      resource_type: resource_type || 'image'
    });

    res.json({ success: true, result });
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    res.status(500).json({ message: 'Failed to delete media' });
  }
});

export default router;
