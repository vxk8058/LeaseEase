import React from 'react';
import './CarsGrid.css';

export default function CarsGrid({cars = []}){
  return (
    <div className="cars-grid">
      {cars.map((c) => (
        <div key={c.id} className="car-card">
          <div className="car-name">{c.name}</div>
          <div className="car-price">${c.price.toLocaleString()}</div>
          <div className="car-meta">{c.type} • {c.mpg} mpg</div>
        </div>
      ))}
    </div>
  );
}
