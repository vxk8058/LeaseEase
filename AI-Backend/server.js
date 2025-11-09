// Evironment variables and dependencies
require("dotenv").config();

// Core modules 
const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const fs = require("fs");
const path = require("path");

// Intialize Express 
const app = express();
app.use(cors());
app.use(express.json());

// Setup MongoDB connection
const mongoClient = new MongoClient(process.env.MONGO_URI);
let db, carsCollection;

// Stores references 
async function connectToDB() {
  try {
    await mongoClient.connect();
    db = mongoClient.db("toyota-db"); 
    carsCollection = db.collection("Toyota-cars"); 
    console.log("Connected to MongoDB Atlas");
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
}


app.use(express.static(__dirname));

// Query builder -> convert from voice to text to MongoDB query
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

  // Colors
  const colorList = ["white", "black", "blue", "red", "silver", "gray", "green", "yellow"];
  const matchedColors = colorList.filter(color => lower.includes(color));
  if (matchedColors.length > 0) {
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

// Accept process response.txt file, parse, and build query
app.post("/process", async (req, res) => {
  try {
    const { user_text } = req.body;
    if (!user_text) return res.status(400).json({ error: "Missing user_text" });

    const query = buildQueryFromText(user_text);
    console.log("Querying Atlas with:", query);

    //structures response
    const results = await carsCollection.find(query).toArray();

    res.json({
      message: "Processed successfully (Direct Atlas Query)",
      user_text,
      mongo_query: query,
      results
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: err.message });
  }
});


function parseResponsesFile() {
  const filePath = path.join(__dirname, "responses.txt");

  // Auto-create if missing
  if (!fs.existsSync(filePath)) {
    console.warn("responses.txt not found. Creating new one...");
    fs.writeFileSync(filePath, "", "utf8");
  }

  const content = fs.readFileSync(filePath, "utf8").trim();
  if (!content) return {};

  const responses = {};
  const lines = content.split("\n");

  for (const line of lines) {
    const parts = line.split("\t");
    if (parts.length >= 4) {
      const key = parts[1].trim();
      const value = parts[3].trim();
      responses[key] = value;
    }
  }

  return responses;
}

// Affordability calculator based on user responses
function calculateAffordability(responses) {
  const totalBudget = Number(responses.totalBudget) || 0;
  const downPayment = Number(responses.downPayment) || 0;
  const interestRate = (Number(responses.interestRate) || 6) / 100 / 12;
  const loanTerm = Number(responses.loanTerm) || 48;

  const principal = totalBudget - downPayment;
  const monthlyPayment =
    principal *
    (interestRate * Math.pow(1 + interestRate, loanTerm)) /
    (Math.pow(1 + interestRate, loanTerm) - 1);
  const totalPayment = monthlyPayment * loanTerm + downPayment;

  return {
    principal,
    monthlyPayment: monthlyPayment.toFixed(2),
    totalPayment: totalPayment.toFixed(2)
  };
}

// Build MongoDB query based on user responses
function buildQueryFromResponses(responses) {
  const query = {};
  const totalBudget = Number(responses.totalBudget);
  if (!isNaN(totalBudget)) query.price = { $lte: totalBudget };

  if (responses.buyOrLease?.toLowerCase() === "lease") {
    query.type = { $regex: "Sedan|SUV", $options: "i" };
  }

  return query;
}
// Fetches cars based on affordability and user responses
app.get("/recommendCars", async (req, res) => {
  try {
    const responses = parseResponsesFile();
    if (Object.keys(responses).length === 0)
      return res.status(400).json({ error: "responses.txt is empty or invalid" });

    const affordability = calculateAffordability(responses);
    const query = buildQueryFromResponses(responses);

    console.log("Responses:", responses);
    console.log("Affordability:", affordability);
    console.log("MongoDB Query:", query);

    const cars = await carsCollection.find(query).toArray();

    res.json({
      message: "Car recommendations based on user's responses",
      responses,
      affordability,
      mongo_query: query,
      results: cars
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Fixes ports conflicts -> Goes to next if current busy
const DEFAULT_PORT = process.env.PORT || 5050;

function startServer(port = DEFAULT_PORT) {
  const server = app.listen(port, async () => {
    console.log(`Server running on port ${port}`);
    await connectToDB();
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.warn(`Port ${port} in use, retrying on ${port + 1}...`);
      startServer(Number(port) + 1);
    } else {
      console.error("Server error:", err);
    }
  });
}

startServer();
