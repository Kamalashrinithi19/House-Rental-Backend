const express = require('express');
const router = express.Router();
const Maintenance = require('../models/Maintenance');
const { protect } = require('../middleware/authMiddleware');

// 1. Create Ticket (Renter)
router.post('/', protect, async (req, res) => {
  try {
    const { houseId, title, description, priority } = req.body;
    
    const ticket = await Maintenance.create({
      houseId,
      tenantId: req.user._id,
      title,
      description,
      priority
    });
    
    res.status(201).json(ticket);
  } catch (error) {
    console.error("Create Ticket Error:", error);
    res.status(500).json({ message: error.message });
  }
});

// 2. Get My Tickets (Renter)
router.get('/my-tickets', protect, async (req, res) => {
  try {
    const tickets = await Maintenance.find({ tenantId: req.user._id });
    res.json(tickets);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// 3. Get House Tickets (Owner)
router.get('/house/:houseId', protect, async (req, res) => {
  try {
    const tickets = await Maintenance.find({ houseId: req.params.houseId }).populate('tenantId', 'name');
    res.json(tickets);
  } catch (error) { res.status(500).json({ message: error.message }); }
});

// 4. Update Status (Owner)
router.put('/:id', protect, async (req, res) => {
  try {
    const ticket = await Maintenance.findById(req.params.id);
    if(ticket) {
        ticket.status = req.body.status || ticket.status;
        await ticket.save();
        res.json(ticket);
    } else {
        res.status(404).json({ message: 'Ticket not found' });
    }
  } catch (error) { res.status(500).json({ message: error.message }); }
});

module.exports = router;