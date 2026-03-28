import mongoose from 'mongoose';

const MediaSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['image', 'video'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    public_id: {
      type: String,
      required: true
    }
  },
  { _id: false }
);

const PointSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      default: '',
      trim: true
    },
    location: {
      lat: {
        type: Number,
        required: true
      },
      lng: {
        type: Number,
        required: true
      }
    },
    media: {
      type: [MediaSchema],
      default: []
    },
    expiresAt: {
      type: Date,
      required: true
    },
    deleteAt: {
      type: Date,
      required: true
    }
  },
  {
    timestamps: true
  }
);

const Point = mongoose.model('Point', PointSchema);

export default Point;
