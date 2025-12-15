const House = require('../models/House');

// 1. Add House
const addHouse = async (req, res) => {
  try {
    const { 
      title, location, rent, images, 
      propertyType, furnishing, amenities,
      isBooked, tenant 
    } = req.body;
    
    // Safety: Ensure Owner ID is valid
    if (!req.user || !req.user._id) {
        return res.status(401).json({ message: "Unauthorized: No Owner ID found" });
    }

    const newHouseData = {
      ownerId: req.user._id, // <--- THIS IS CRITICAL
      title, location, rent, images,
      propertyType, furnishing, amenities,
      isBooked: isBooked || false
    };

    if (isBooked && tenant) {
        newHouseData.currentTenant = tenant;
    }
    
    const house = await House.create(newHouseData);
    res.status(201).json(house);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// 2. Get All Houses (Public Search) - POPULATE OWNER
const getAllHouses = async (req, res) => {
  try {
    const { query } = req.query;
    const filter = query ? {
       $or: [
         { title: { $regex: query, $options: 'i' } },
         { location: { $regex: query, $options: 'i' } }
       ]
    } : {};
    
    // .populate('ownerId') ensures we get the Name for the UI
    const houses = await House.find(filter).populate('ownerId', 'name email');
    res.json(houses);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// 3. Request Booking (Renter)
const requestBooking = async (req, res) => {
  try {
    const house = await House.findById(req.params.id);
    if (!house) return res.status(404).json({ message: 'House not found' });
    if (house.isBooked) return res.status(400).json({ message: 'House is already occupied' });

    // Check duplicate
    const existing = house.requests.find(r => r.userId.toString() === req.user._id.toString());
    if (existing) return res.status(400).json({ message: 'Request already sent' });

    house.requests.push({
      userId: req.user._id,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
      date: new Date(),
      status: 'pending'
    });
    
    await house.save();
    res.json(house);
  } catch (error) { res.status(500).json({ message: error.message }); }
};
// ... existing imports

// NEW: Update Tenant Details (Name, Email, Phone, Date)
const updateTenantDetails = async (req, res) => {
  try {
    const { name, email, phone, startDate } = req.body;
    const house = await House.findById(req.params.id);

    if (!house) return res.status(404).json({ message: 'House not found' });
    
    // Ensure house is actually occupied before editing tenant
    if (!house.isBooked || !house.currentTenant) {
        return res.status(400).json({ message: 'No tenant to edit' });
    }

    // Merge new details with existing ones (keep userId and rent status)
    house.currentTenant.name = name || house.currentTenant.name;
    house.currentTenant.email = email || house.currentTenant.email;
    house.currentTenant.phone = phone || house.currentTenant.phone;
    house.currentTenant.startDate = startDate || house.currentTenant.startDate;

    await house.save();
    res.json(house);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// ... (Keep getMyHouses, acceptRequest, declineRequest, toggleRent, deleteHouse as is) ...
const getMyHouses = async (req, res) => {
    try {
      const houses = await House.find({ ownerId: req.user._id });
      res.json(houses);
    } catch (error) { res.status(500).json({ message: error.message }); }
};
const acceptRequest = async (req, res) => {
    try {
      const { requestId } = req.body;
      const house = await House.findById(req.params.id);
      
      // Find the specific request
      const request = house.requests.find(r => r._id.toString() === requestId);
      if (!request) return res.status(404).json({ message: 'Request not found' });

      // 1. UPDATE STATUS
      house.isBooked = true;

      // 2. CREATE TENANT OBJECT (CRITICAL STEP)
      house.currentTenant = {
        userId: request.userId, // This links the Renter
        name: request.name,
        email: request.email,
        phone: request.phone,
        startDate: new Date().toISOString().split('T')[0],
        isRentPaid: false
      };
      
      // 3. CLEAR REQUESTS
      house.requests = []; 
      
      await house.save();
      res.json(house);
    } catch (error) { res.status(500).json({ message: error.message }); }
};
const declineRequest = async (req, res) => {
    try {
      const { requestId } = req.body;
      const house = await House.findById(req.params.id);
      house.requests = house.requests.filter(r => r._id.toString() !== requestId);
      await house.save();
      res.json(house);
    } catch (error) { res.status(500).json({ message: error.message }); }
};
const toggleRent = async (req, res) => {
    try {
      const house = await House.findById(req.params.id);
      if(house.currentTenant) {
          house.currentTenant.isRentPaid = !house.currentTenant.isRentPaid;
          await house.save();
      }
      res.json(house);
    } catch (error) { res.status(500).json({ message: error.message }); }
};
const deleteHouse = async (req, res) => {
    try {
        await House.findByIdAndDelete(req.params.id);
        res.json({ id: req.params.id });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

module.exports = { 
  addHouse, getMyHouses, getAllHouses, 
  requestBooking, acceptRequest, declineRequest, 
  toggleRent, deleteHouse,
  updateTenantDetails
};