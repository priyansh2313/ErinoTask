const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  phone: { type: String },
  company: { type: String },
  city: { type: String },
  state: { type: String },
  source: { type: String, enum: ['website','facebook_ads','google_ads','referral','events','other'], required: true },
  status: { type: String, enum: ['new','contacted','qualified','lost','won'], required: true },
  score: { type: Number, min: 0, max: 100, default: 0 },
  lead_value: { type: Number, default: 0 },
  last_activity_at: { type: Date },
  is_qualified: { type: Boolean, default: false },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// Ensure id in JSON responses
leadSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id?.toString();
    delete ret._id;
  },
});

module.exports = mongoose.model('Lead', leadSchema);
