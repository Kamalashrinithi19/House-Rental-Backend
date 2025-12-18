const express = require('express');
const router = express.Router();

// 1. Import ALL controller functions (including vacateHouse)
const { 
  addHouse, 
  getMyHouses, 
  getAllHouses, 
  requestBooking, 
  acceptRequest, 
  declineRequest, 
  toggleRent, 
  deleteHouse, 
  updateTenantDetails,
  vacateHouse // <--- Added this to the list
} = require('../controllers/houseController');

// 2. Import the security middleware
const { protect } = require('../middleware/authMiddleware'); 

// --- Public Route ---
router.get('/', getAllHouses);

// --- Protected Routes ---
router.post('/', protect, addHouse); 
router.get('/my-houses', protect, getMyHouses);
router.put('/:id/request', protect, requestBooking);
router.put('/:id/accept', protect, acceptRequest);
router.put('/:id/decline', protect, declineRequest);
router.put('/:id/rent', protect, toggleRent);
router.delete('/:id', protect, deleteHouse);
router.put('/:id/tenant-details', protect, updateTenantDetails);

// 3. The Fixed Vacate Route
// We use 'protect' (not requireAuth) and 'vacateHouse' directly
router.put('/:id/vacate', protect, vacateHouse);

module.exports = router;