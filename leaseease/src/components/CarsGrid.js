import React from 'react';
import './CarsGrid.css';

export default function CarsGrid({cars = []}){
  return (
    <div className="cars-grid">
      {cars.map((c) => {
        const key = c._id || c.id || c.model || Math.random();
        const name = c.model || c.name || '';
        const year = c.year || '';
        const price = typeof c.price === 'number' ? c.price : Number(c.price || 0);
        const monthly = c.monthlyEstimate !== undefined ? c.monthlyEstimate : c.monthlyPayment || null;
        return (
          <div key={key} className="car-card">
            <div className="car-image-wrap">
              <img src={c.image || '/toyota icon.png'} alt={name} className="car-image" />
            </div>
            <div className="car-info">
              <div className="car-name">{name} <span className="car-year">{year}</span></div>
              <div className="car-price">${price.toLocaleString()}</div>
              <div className="car-meta">{c.type || ''} {c.mpg ? `• ${c.mpg} mpg` : ''}</div>
              {monthly !== null && (
                <div className="car-monthly">Est. monthly: <strong>${Number(monthly).toFixed(2)}</strong></div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
