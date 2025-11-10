const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/.env' });
const Car = require('./models/Car');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5002;

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB (api-server)'))
  .catch(err => console.error('MongoDB connect error:', err));

// Simple in-memory fallback dataset used when MongoDB is unreachable.
// Keep fields the frontend expects: model, year, price, type, monthlyEstimate, image
const FALLBACK_CARS = [
  { _id: 'fb-1', model: 'Corolla', year: 2024, price: 22000, type: 'Sedan', monthlyEstimate: 415.17, image: '/images/corolla.jpg' },
  { _id: 'fb-2', model: 'Camry', year: 2023, price: 28000, type: 'Sedan', monthlyEstimate: 528.39, image: '/images/camry.jpg' },
  { _id: 'fb-3', model: 'RAV4', year: 2024, price: 33000, type: 'SUV', monthlyEstimate: 566.14, image: '/images/rav4.jpg' },
  { _id: 'fb-4', model: 'Prius', year: 2025, price: 25000, type: 'Hybrid', monthlyEstimate: 471.78, image: '/images/prius.jpg' },
  { _id: 'fb-5', model: 'Yaris', year: 2023, price: 20000, type: 'Hatchback', monthlyEstimate: 377.42, image: '/images/yaris.jpg' },
];

function filterFallback(maxMonthly, limit) {
  if (isNaN(maxMonthly)) {
    return FALLBACK_CARS.slice(0, limit);
  }
  const matching = FALLBACK_CARS.filter(c => typeof c.monthlyEstimate === 'number' && c.monthlyEstimate <= maxMonthly)
    .sort((a, b) => a.monthlyEstimate - b.monthlyEstimate)
    .slice(0, limit);

  if (matching.length >= limit) return matching;

  const needed = limit - matching.length;
  const above = FALLBACK_CARS.filter(c => c.monthlyEstimate > maxMonthly)
    .sort((a, b) => a.monthlyEstimate - b.monthlyEstimate)
    .slice(0, needed);

  let result = matching.concat(above).slice(0, limit);
  if (result.length < limit) {
    const stillNeeded = limit - result.length;
    const byPrice = FALLBACK_CARS.slice().sort((a, b) => a.price - b.price).slice(0, stillNeeded);
    result = result.concat(byPrice).slice(0, limit);
  }
  return result;
}

// GET /cars?maxMonthly=number&limit=5
app.get('/cars', async (req, res) => {
  try {
    const maxMonthly = Number(req.query.maxMonthly);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 5));

    // If MongoDB is not connected, return deterministic fallback data so frontend can function.
    if (mongoose.connection.readyState !== 1) {
      console.warn('MongoDB not connected - returning fallback cars');
      const cars = filterFallback(maxMonthly, limit);
      return res.json({ ok: true, cars });
    }

    if (isNaN(maxMonthly)) {
      // If maxMonthly not provided, return top N cars sorted by price ascending
      const cars = await Car.find({}).sort({ price: 1 }).limit(limit).lean();
      return res.json({ ok: true, cars });
    }

    // Find cars where monthlyEstimate exists and is <= maxMonthly
    let cars = await Car.find({ monthlyEstimate: { $lte: maxMonthly } })
      .sort({ monthlyEstimate: 1 })
      .limit(limit)
      .lean();

    // If we have fewer than requested, fetch nearest alternatives (monthly > maxMonthly)
    if (cars.length < limit) {
      const needed = limit - cars.length;

      // Try to fetch cars with monthlyEstimate > maxMonthly sorted by monthlyEstimate ascending
      const above = await Car.find({ monthlyEstimate: { $gt: maxMonthly } })
        .sort({ monthlyEstimate: 1 })
        .limit(needed)
        .lean();

      // Combine results: matching first, then near-above
      cars = cars.concat(above).slice(0, limit);

      // If still fewer (e.g., some docs missing monthlyEstimate), fallback to nearest by price
      if (cars.length < limit) {
        const stillNeeded = limit - cars.length;
        const byPrice = await Car.find({}).sort({ price: 1 }).limit(stillNeeded).lean();
        cars = cars.concat(byPrice).slice(0, limit);
      }
    }

    return res.json({ ok: true, cars });
  } catch (err) {
    console.error('Error in /cars', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`toyota-db API server listening on http://localhost:${PORT}`);
});
