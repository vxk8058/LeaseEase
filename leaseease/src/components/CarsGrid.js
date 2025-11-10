import React from 'react';
import './CarsGrid.css';

export default function CarsGrid({ cars = [] }) {
  return (
    <div className="cars-grid">
<<<<<<< Updated upstream
      {cars.map((c) => (
        <div key={c.id} className="car-card">
          <div className="car-name">{c.name}</div>
          <div className="car-price">${c.price.toLocaleString()}</div>
          <div className="car-meta">{c.type} • {c.mpg} mpg</div>
        </div>
      ))}
=======
      {cars.map((c) => {
        const key = c._id || c.id || c.model || Math.random();
        const name = c.model || c.name || '';
        const year = c.year || '';
        const rawPrice = typeof c.price === 'number' ? c.price : Number(c.price || 0);
        const price = Number.isFinite(rawPrice) ? rawPrice : 0;
        const monthly = c.monthlyEstimate !== undefined ? c.monthlyEstimate : (c.monthlyPayment !== undefined ? c.monthlyPayment : null);

        const imageSrc = c.image || '/logo192.png';

        return (
          <div key={String(key)} className="car-card">
            <div className="car-image-wrap">
              <img src={imageSrc} alt={name} className="car-image" />
            </div>
            <div className="car-info">
              <div className="car-name">
                {name} <span className="car-year">{year}</span>
              </div>
              <div className="car-price">${Number(price).toLocaleString()}</div>
              <div className="car-meta">
                {c.type || ''}
                {c.mpg ? (<span className="car-mpg"> &bull; {c.mpg} mpg</span>) : null}
              </div>
              {monthly !== null && monthly !== undefined && !Number.isNaN(Number(monthly)) && (
                <div className="car-monthly">Est. monthly: <strong>${Number(monthly).toFixed(2)}</strong></div>
              )}
            </div>
          </div>
        );
      })}
>>>>>>> Stashed changes
    </div>
  );
}
