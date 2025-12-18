const express = require('express');
const router = express.Router();
const { 
  addHouse, getMyHouses, getAllHouses, 
  requestBooking, acceptRequest, declineRequest, 
  toggleRent, deleteHouse, updateTenantDetails
} = require('../controllers/houseController');

// IMPORT THE SECURITY GUARD
const { protect } = require('../middleware/authMiddleware'); 

// Public Route (Anyone can see houses)
router.get('/', getAllHouses);

// Protected Routes (Must be logged in)
// Note the 'protect' argument before the controller function
router.post('/', protect, addHouse); 
router.get('/my-houses', protect, getMyHouses);
router.put('/:id/request', protect, requestBooking);
router.put('/:id/accept', protect, acceptRequest);
router.put('/:id/decline', protect, declineRequest);
router.put('/:id/rent', protect, toggleRent);
router.delete('/:id', protect, deleteHouse);
router.put('/:id/tenant-details', protect, updateTenantDetails);
router.put('/:id/vacate', requireAuth, houseController.vacateHouse);

module.exports = router;