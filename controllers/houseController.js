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
// file: server/controllers/houseController.js

const acceptRequest = async (req, res) => {
  try {
    const { houseId, requestId } = req.body;
    
    // 1. Find the House
    const house = await House.findById(houseId);
    if (!house) return res.status(404).json({ message: "House not found" });

    // 2. Find the Renter's ID from the request list
    const request = house.requests.find(r => r._id.toString() === requestId);
    if (!request) return res.status(404).json({ message: "Request not found" });
    
    const renterId = request.user; // This is the ID of the person applying

    // 🛑 CRITICAL CHECK: Is this renter already living in ANY house?
    const existingResidency = await House.findOne({ "tenant.id": renterId });
    
    if (existingResidency) {
      return res.status(400).json({ 
        message: "Action Failed: This user is already a resident in another house. They must vacate first." 
      });
    }

    // 3. If they are homeless (clean), ACCEPT them
    house.tenant = {
      id: renterId,
      name: request.name,
      email: request.email,
      moveInDate: new Date()
    };
    house.isBooked = true;
    house.requests = []; // Clear other requests (optional)

    await house.save();
    res.json({ message: "Tenant accepted successfully!", house });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
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
// Add this to houseController.js

exports.vacateHouse = async (req, res) => {
  try {
    const house = await House.findById(req.params.id);
    
    if (!house) return res.status(404).json({ message: "House not found" });

    // Security: Only the Owner OR the Tenant can vacate
    // (Assuming req.user is populated by your authMiddleware)
    const isOwner = house.owner.toString() === req.user._id.toString();
    const isTenant = house.tenant && house.tenant.id.toString() === req.user._id.toString();

    if (!isOwner && !isTenant) {
      return res.status(403).json({ message: "Not authorized to vacate this house" });
    }

    // Reset the house
    house.tenant = null;
    house.isBooked = false;
    
    await house.save();
    res.json({ message: "House vacated successfully", house });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
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