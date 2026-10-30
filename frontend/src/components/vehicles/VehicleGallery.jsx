import { applyImageFallback } from '../../config/imageConfig.js';
import './VehicleGallery.css';
export function VehicleGallery({ v }) {
  return (
    <div className="detail-image">
      <img src={v.image} alt={v.name} onError={applyImageFallback} decoding="async" />
      <span>Illustrative image · actual vehicle may differ</span>
    </div>
  );
}
