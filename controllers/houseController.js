const House = require('../models/House');

// 1. Add House
const addHouse = async (req, res) => {
  try {
    const { 
      title, location, rent, images, 
      propertyType, furnishing, amenities,
      isBooked, tenant 
    } = req.body;
    
    if (!req.user || !req.user._id) {
        return res.status(401).json({ message: "Unauthorized: No Owner ID found" });
    }

    const newHouseData = {
      ownerId: req.user._id, 
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

// 2. Get All Houses
const getAllHouses = async (req, res) => {
  try {
    const { query } = req.query;
    const filter = query ? {
       $or: [
         { title: { $regex: query, $options: 'i' } },
         { location: { $regex: query, $options: 'i' } }
       ]
    } : {};
    
    const houses = await House.find(filter).populate('ownerId', 'name email');
    res.json(houses);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// 3. Request Booking
const requestBooking = async (req, res) => {
  try {
    const house = await House.findById(req.params.id);
    if (!house) return res.status(404).json({ message: 'House not found' });
    if (house.isBooked) return res.status(400).json({ message: 'House is already occupied' });

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

// 4. Update Tenant Details
const updateTenantDetails = async (req, res) => {
  try {
    const { name, email, phone, startDate } = req.body;
    const house = await House.findById(req.params.id);

    if (!house) return res.status(404).json({ message: 'House not found' });
    
    if (!house.isBooked || !house.currentTenant) {
        return res.status(400).json({ message: 'No tenant to edit' });
    }

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

const getMyHouses = async (req, res) => {
    try {
      const houses = await House.find({ ownerId: req.user._id });
      res.json(houses);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// 5. Accept Request (Fixed to use currentTenant)
const acceptRequest = async (req, res) => {
  try {
    // FIX 1: Get House ID from the URL (req.params.id), NOT the body
    const house = await House.findById(req.params.id);
    const { requestId } = req.body;
    
    if (!house) return res.status(404).json({ message: "House not found" });

    const request = house.requests.find(r => r._id.toString() === requestId);
    if (!request) return res.status(404).json({ message: "Request not found" });
    
    const renterId = request.userId; 

    // Check if renter is already a resident elsewhere
    const existingResidency = await House.findOne({ "currentTenant.userId": renterId });
    if (existingResidency) {
      return res.status(400).json({ 
        message: "Action Failed: This user is already a resident in another house." 
      });
    }

    house.currentTenant = {
      userId: renterId,
      name: request.name,
      email: request.email,
      phone: request.phone,
      startDate: new Date(),
      isRentPaid: false
    };
    house.isBooked = true;
    house.requests = []; 

    await house.save();
    res.json({ message: "Tenant accepted successfully!", house });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const declineRequest = async (req, res) => {
    try {
      const { requestId } = req.body;
      // FIX 2: Ensure we use req.params.id here too
      const house = await House.findById(req.params.id);
      
      if (!house) return res.status(404).json({ message: "House not found" });

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

// 6. Vacate House (Fixed Export Issue)
const vacateHouse = async (req, res) => {
  try {
    const houseId = req.params.id;
    const house = await House.findById(houseId);

    if (!house) {
      return res.status(404).json({ message: "House not found" });
    }

    const isOwner = house.ownerId.toString() === req.user._id.toString();
    const isTenant = house.currentTenant && String(house.currentTenant.userId) === String(req.user._id);

    if (!isOwner && !isTenant) {
      return res.status(403).json({ message: "Not authorized to vacate this house" });
    }

    // Hard Reset using unset
    await House.findByIdAndUpdate(houseId, {
      $set: { 
        isBooked: false,
        requests: [] 
      },
      $unset: { 
        currentTenant: "", // This wipes the object completely
        tenant: ""         // Just in case old data exists
      }
    });

    res.json({ message: "Vacated successfully" });

  } catch (error) {
    console.error("Vacate Error:", error);
    res.status(500).json({ message: error.message });
  }
};

const deleteHouse = async (req, res) => {
    try {
        await House.findByIdAndDelete(req.params.id);
        res.json({ id: req.params.id });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// 7. EXPORT EVERYTHING CORRECTLY
module.exports = { 
  addHouse, 
  getMyHouses, 
  getAllHouses, 
  requestBooking, 
  acceptRequest, 
  declineRequest, 
  toggleRent, 
  deleteHouse,
  updateTenantDetails,
  vacateHouse // <--- IT IS HERE NOW!
};