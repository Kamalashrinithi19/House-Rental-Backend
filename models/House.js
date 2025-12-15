const mongoose = require('mongoose');

const houseSchema = mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // House Details
  title: { type: String, required: true },
  location: { type: String, required: true },
  rent: { type: Number, required: true },
  images: [String],
  
  // New Fields Requested
  propertyType: { type: String, default: 'Apartment' }, // e.g., Apartment, Villa
  furnishing: { type: String, default: 'Unfurnished' }, // e.g., Furnished, Semi
  amenities: [String], // e.g., ["WiFi", "Parking"]

  // Status
  isBooked: { type: Boolean, default: false },

  // Current Tenant (Visible to Owner if Booked)
  currentTenant: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String },
    email: { type: String }, // Added Mail ID
    phone: { type: String },
    startDate: { type: String },
    isRentPaid: { type: Boolean, default: false }
  },

  // Booking Requests (Queue)
  requests: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    email: String,
    phone: String,
    date: Date,
    status: { type: String, default: 'pending' } // pending, accepted, rejected
  }]
}, { timestamps: true });

module.exports = mongoose.model('House', houseSchema);