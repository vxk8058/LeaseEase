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

// GET /cars?maxMonthly=number&limit=5
app.get('/cars', async (req, res) => {
  try {
    const maxMonthly = Number(req.query.maxMonthly);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 5));

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
