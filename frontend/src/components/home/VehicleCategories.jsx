import { ArrowRight, ArrowUpRight, Bike, CarFront } from 'lucide-react';
import { useHomePage } from '../../context/HomePageContext';
import { homeContent } from '../../config/homeContent';
import { imageConfig, applyImageFallback } from '../../config/imageConfig';
import { money } from '../../utils/formatters';
import './VehicleCategories.css';
export function VehicleCategories() {
  const { navigate, fleet, setCategory } = useHomePage();
  const content = homeContent.categories;
  return (
    <section className="container section" id="vehicles">
      <div className="section-heading">
        <div>
          <div className="eyebrow">{content.eyebrow}</div>
          <h2>
            {content.titleLead} <em>{content.titleAccent}</em>
          </h2>
        </div>
        <button className="rr-button--outline" onClick={() => navigate('/vehicles')}>
          {content.allVehiclesLabel} <ArrowRight size={15} />
        </button>
      </div>
      <div className="category-grid">
        {content.items.map((category) => {
          const rates = (fleet || [])
            .filter((vehicle) => vehicle.category === category.type)
            .map((vehicle) => vehicle.rate);
          const startingRate = rates.length ? Math.min(...rates) : null;
          return (
            <article key={category.type} className={`category-card ${category.type.toLowerCase()}`}>
              <img
                src={imageConfig.categories[category.imageKey]}
                alt={`${category.name} available for rent`}
                onError={applyImageFallback}
                decoding="async"
              />
              <div className="category-gradient" />
              <div className="category-content">
                {category.type === 'Car' ? <CarFront size={28} /> : <Bike size={28} />}
                <h3>{category.name}</h3>
                <p>
                  Starting at{' '}
                  <strong>
                    {startingRate === null ? '—' : money(startingRate)}
                    <small>/hr</small>
                  </strong>
                </p>
                <button
                  onClick={() => {
                    setCategory(category.type);
                    navigate(`/vehicles?category=${category.type}`);
                  }}
                >
                  Explore {category.name} <ArrowRight size={14} />
                </button>
              </div>
              <ArrowUpRight className="category-arrow" size={30} />
            </article>
          );
        })}
      </div>
    </section>
  );
}
