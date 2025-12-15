const mongoose = require('mongoose');
const dotenv = require('dotenv');
const House = require('./models/House'); // Import your House model

dotenv.config();

// Connect to Local MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected for Seeding...'))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

const houses = [
  {
    title: "Sunny Isles Beach Villa",
    location: "Miami, Florida",
    rent: 4500,
    type: "Villa",
    rating: 4.8,
    images: [
      "https://i.pinimg.com/1200x/69/75/f9/6975f944ae42587f05d9f64f0eb22bd2.jpg",
      "https://i.pinimg.com/736x/3c/55/f4/3c55f4e4cf85f4e755cda28b9c0add3e.jpg",
      "https://i.pinimg.com/736x/a8/72/25/a87225f967981e7a25e10b8d1747a858.jpg",
      "https://i.pinimg.com/1200x/83/87/36/8387366f91a55f1d6c59efe0568ee683.jpg"
    ],
    amenities: ["Private Pool", "Free WiFi", "Gym", "Ocean View", "Smart Home", "2 Car Parking"]
  },
  {
    title: "Modern Blue Apartment",
    location: "Downtown, New York",
    rent: 2800,
    type: "Apartment",
    rating: 4.5,
    images: [
      "https://i.pinimg.com/1200x/89/22/4d/89224d691cb744e848827979387c571a.jpg",
      "https://i.pinimg.com/1200x/f7/d9/a0/f7d9a0cc3cbf4f319922a9f6df969bab.jpg",
      "https://i.pinimg.com/1200x/5f/df/a7/5fdfa70fed3d2030ff801872633acb54.jpg"
    ],
    amenities: ["City View", "Concierge", "Rooftop Deck", "Pet Friendly"]
  },
  {
    title: "Cozy Cornflower Cottage",
    location: "Austin, Texas",
    rent: 1900,
    type: "Cottage",
    rating: 4.9,
    images: [
      "https://i.pinimg.com/736x/b7/75/86/b7758615370561ebd534be54e61a04c4.jpg",
      "https://i.pinimg.com/1200x/b1/9a/c4/b19ac4d4a475015760a58ec4e7ba6b9d.jpg",
      "https://i.pinimg.com/1200x/cb/c0/c9/cbc0c9ca96111bdb3123194ba3912183.jpg"
    ],
    amenities: ["Garden", "Fireplace", "Hardwood Floors", "Quiet Area"]
  },
  {
    title: "Bliss Villa",
    location: "Los Angeles, California",
    rent: 30000,
    type: "Villa",
    rating: 4.9,
    images: [
      "https://i.pinimg.com/1200x/26/de/fe/26defe817493dd15ffd320181c756b0a.jpg",
      "https://i.pinimg.com/736x/ce/7c/3b/ce7c3b4962c24d9cfe569cb4afd1996c.jpg",
      "https://i.pinimg.com/736x/92/38/f3/9238f358df9888a5dddba5c8a34f027f.jpg",
      "https://i.pinimg.com/736x/19/da/5b/19da5b5bdac571db76be7a186cad906f.jpg"
    ],
    amenities: ["Garden", "Inner Courtyard", "Yard"]
  },
  {
    title: "Sky Lounge",
    location: "Dallas, Texas",
    rent: 5000,
    type: "Penthouse",
    rating: 4.6,
    images: [
      "https://i.pinimg.com/736x/67/ac/e8/67ace86caf4c4805cca8e4dd77e94fe2.jpg",
      "https://i.pinimg.com/1200x/f1/c1/db/f1c1db5f33408fbfedf14b4708effb01.jpg",
      "https://i.pinimg.com/1200x/a4/a7/3d/a4a73d1a79c75a2a828df031eff7b742.jpg",
      "https://i.pinimg.com/1200x/6b/58/e2/6b58e225517cf5ea4df1272bff3bb9d4.jpg",
      "https://i.pinimg.com/736x/80/e6/d0/80e6d0233caf51b392e24a1aa4915c71.jpg"
    ],
    amenities: ["Lift", "Interior Theatre", "Balcony"]
  }
];

const importData = async () => {
  try {
    // Clear existing data to avoid duplicates
    await House.deleteMany(); 
    console.log('Old Data Cleared...');

    // Insert new houses
    await House.insertMany(houses); 
    console.log('Data Imported Successfully!');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error}`);
    process.exit(1);
  }
};

importData();