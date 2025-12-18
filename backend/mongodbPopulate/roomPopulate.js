//   POPULATE ROOMS SCRIPT

require('dotenv').config();
const mongoose = require('mongoose');

//   MONGO CONNECTION

const MONGO_URI = process.env.MONGODB_URI_ORIGINAL || "mongodb+srv://bbbnhan1_db_user:TT3yyCJJ1KCk0FuB@cluster0.sewtqr0.mongodb.net/hotel_booking?retryWrites=true&w=majority&appName=Cluster0";
mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err.message));

// ==============================
//   DEFINE SCHEMAS
// ==============================
const hotelSchema = new mongoose.Schema({
    name: String,
    // other hotel fields if needed
});

const roomSchema = new mongoose.Schema({
    hotelName: String,
    type: String,
    price: Number,
});

const Hotel = mongoose.model('Hotel', hotelSchema, 'hotels'); // existing collection
const Room = mongoose.model('Room', roomSchema, 'rooms'); // target collection

// Random algorithm
const roomTypes = ['deluxe', 'family', 'studio'];

function getRandomPrice(min = 1500000, max = 3500000) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomType() {
    return roomTypes[Math.floor(Math.random() * roomTypes.length)];
}

//   POPULATE ROOMS
async function populateRooms() {
    try {
        const hotels = await Hotel.find();
        console.log(`Found ${hotels.length} hotels`);

        const roomsToInsert = [];

        hotels.forEach(hotel => {
            for (let i = 0; i < 2; i++) { // 2 rooms per hotel
                roomsToInsert.push({
                    hotelName: hotel.name,
                    type: getRandomType(),
                    price: getRandomPrice(),
                });
            }
        });

        if (roomsToInsert.length > 0) {
            await Room.insertMany(roomsToInsert);
            console.log(` Inserted ${roomsToInsert.length} rooms`);
        } else {
            console.log(' No rooms to insert');
        }

        mongoose.connection.close();
    } catch (err) {
        console.error(' Error populating rooms:', err);
        mongoose.connection.close();
    }
}

populateRooms();
