require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
           
const app = express();
app.use(cors());
app.use(express.json());

// 🔹 MongoDB connection
const mongoClient = new MongoClient(process.env.MONGO_URI);
let db, carsCollection;

async function connectToDB() {
  try {
    await mongoClient.connect();
    db = mongoClient.db("toyota-db"); // your database name
    carsCollection = db.collection("Toyota-cars"); // your collection name
    console.log("Connected to MongoDB Atlas");
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
}


function buildQueryFromText(text) {
  const query = {};
  const lower = text.toLowerCase();

  // Make / brand
  if (lower.includes("toyota")) query.model = { $regex: "Toyota", $options: "i" };
  if (lower.includes("corolla")) query.model = { $regex: "Corolla", $options: "i" };
  if (lower.includes("camry")) query.model = { $regex: "Camry", $options: "i" };
  if (lower.includes("rav4")) query.model = { $regex: "RAV4", $options: "i" };
  if (lower.includes("supra")) query.model = { $regex: "Supra", $options: "i" };

  // Fuel type
  if (lower.includes("hybrid")) query.fuelType = { $regex: "Hybrid", $options: "i" };
  if (lower.includes("gas") || lower.includes("gasoline")) query.fuelType = { $regex: "Gasoline", $options: "i" };
  if (lower.includes("electric")) query.fuelType = { $regex: "Electric", $options: "i" };

  // Car type
  if (lower.includes("sedan")) query.type = { $regex: "Sedan", $options: "i" };
  if (lower.includes("suv")) query.type = { $regex: "SUV", $options: "i" };
  if (lower.includes("truck")) query.type = { $regex: "Truck", $options: "i" };
  if (lower.includes("sports")) query.type = { $regex: "Sports", $options: "i" };
  if (lower.includes("hatchback")) query.type = { $regex: "Hatchback", $options: "i" };

  // Color filter
  const colorList = ["white", "black", "blue", "red", "silver", "gray", "green", "yellow"];
  const matchedColors = colorList.filter(color => lower.includes(color));
  if (matchedColors.length > 0) {
    // Match any of the colors in an OR condition
    query.colors = { $in: matchedColors.map(c => new RegExp(c, "i")) };
  }


  // Seats
  const seatMatch = text.match(/(\d+)\s*(seater|seats?)/i);
  if (seatMatch) query.seats = Number(seatMatch[1]);

  // Year
  const yearMatch = text.match(/(19|20)\d{2}/);
  if (yearMatch) query.year = Number(yearMatch[0]);

  // Budget / price
  const priceMatch =
    text.match(/under\s*(\d+)/i) ||
    text.match(/below\s*(\d+)/i) ||
    text.match(/less than\s*(\d+)/i);
  if (priceMatch) query.price = { $lte: Number(priceMatch[1]) };

  return query;
}


app.post("/process", async (req, res) => {
  try {
    const { user_text, sessionId = "default_user" } = req.body;

    if (!user_text) return res.status(400).json({ error: "Missing user_text" });

    const query = buildQueryFromText(user_text);
    console.log("Querying Atlas with:", query);

    const resultsArray = await carsCollection.find(query).toArray();

    const resultsObject = {};
    resultsArray.forEach((car, index) => {
      resultsObject[car._id?.toString() || `car_${index + 1}`] = car;
    });

    
    res.json({
      message: "Processed successfully (Direct Atlas Query)",
      user_text,
      mongo_query: query,
      results: resultsObject
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: err.message });
  }
});

//hello 

const PORT = process.env.PORT || 5050;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await connectToDB();
});