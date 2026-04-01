import Point from '../models/Point.js';
import cloudinary from '../config/cloudinary.js';

export async function cleanupExpiredPoints() {
  try {
    const now = new Date();

    const expiredPoints = await Point.find({
      deleteAt: { $lte: now }
    });

    for (const point of expiredPoints) {
      for (const media of point.media || []) {
        if (!media.public_id) continue;

        try {
          await cloudinary.uploader.destroy(media.public_id, {
            resource_type: media.type === 'video' ? 'video' : 'image'
          });
        } catch (error) {
          console.error('Cloudinary delete failed:', media.public_id, error);
        }
      }

      await Point.findByIdAndDelete(point._id);
    }

    if (expiredPoints.length > 0) {
      console.log(`Cleanup: deleted ${expiredPoints.length} expired points`);
    }
  } catch (error) {
    console.error('Cleanup job failed:', error);
  }
}
