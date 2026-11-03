import { useEffect, useId, useRef, useState } from 'react';
import { Bike, CarFront, Pause, Play } from 'lucide-react';
import './VehicleRoadAnimation.css';

const VEHICLES = [
  {
    category: 'Bike',
    model: 'Sport touring bike',
    image: 'bike',
    width: 1536,
    height: 1024,
    icon: Bike,
    wheels: [
      { x: 360, y: 825, rx: 188, ry: 181 },
      { x: 1201, y: 830, rx: 195, ry: 182 },
    ],
    hardware: [
      'M130 414 L235 407 L438 463 L453 493 L402 636 L370 660 L146 604 L126 566 Z',
      'M348 682 L398 688 L610 824 L628 844 L598 866 L550 867 L346 756 Z',
      'M326 801 L456 781 L592 801 L585 838 L380 860 L326 846 Z',
      'M1063 599 L1125 608 L1153 705 L1183 765 L1231 816 L1227 847 L1181 856 L1102 835 L1086 803 L1111 774 L1085 711 Z',
      'M1082 646 Q1206 600 1309 642 L1325 665 Q1216 648 1154 670 Z',
    ],
  },
  {
    category: 'Scooter',
    model: 'Honda Activa',
    image: 'scooter',
    width: 1672,
    height: 941,
    icon: Bike,
    wheels: [
      { x: 420, y: 775, rx: 173, ry: 151 },
      { x: 1370, y: 769, rx: 176, ry: 159 },
    ],
    hardware: [
      'M150 420 L800 540 L890 640 L870 700 L596 714 Q478 636 317 642 L236 666 L177 623 Z',
      'M324 689 L481 722 L540 774 L527 811 L465 811 L321 756 Z',
      'M1255 573 L1294 590 L1386 757 L1385 780 L1360 791 L1343 775 L1280 653 Z',
    ],
  },
  {
    category: 'Car',
    model: 'Hyundai Avante N Line',
    image: 'car',
    width: 1925,
    height: 817,
    icon: CarFront,
  },
];
const WHEEL_MASK_CLEARANCE = 30;
const IMAGE_ROOT = '/images/animations/';
// These coordinates belong to the supplied photographic cutouts, not generic vehicle geometry.
// The body mask removes tyres while restoring stationary fork/exhaust pixels above the wheel layers.
function bodyMask(vehicle) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${vehicle.width}" height="${vehicle.height}" viewBox="0 0 ${vehicle.width} ${vehicle.height}"><defs><mask id="body" maskUnits="userSpaceOnUse" x="0" y="0" width="${vehicle.width}" height="${vehicle.height}"><rect width="100%" height="100%" fill="white"/>${vehicle.wheels.map(({ x, y, rx, ry }) => `<ellipse cx="${x}" cy="${y}" rx="${rx + WHEEL_MASK_CLEARANCE}" ry="${ry + WHEEL_MASK_CLEARANCE}" fill="black"/>`).join('')}${vehicle.hardware.map((path) => `<path d="${path}" fill="white"/>`).join('')}</mask></defs><rect width="100%" height="100%" fill="white" mask="url(#body)"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
const BODY_MASKS = Object.fromEntries(
  VEHICLES.filter((vehicle) => vehicle.wheels).map((vehicle) => [
    vehicle.category,
    bodyMask(vehicle),
  ]),
);

function DrivingWheels({ vehicle }) {
  return vehicle.wheels.map(({ x, y, rx, ry }, index) => (
    <span
      className="rr-road__wheel"
      key={index}
      style={{
        left: (x / vehicle.width) * 100 + '%',
        top: (y / vehicle.height) * 100 + '%',
        width: ((rx * 2) / vehicle.width) * 100 + '%',
        transform: `translate(-50%, -50%) scaleY(${ry / rx})`,
      }}
    >
      <img
        src={IMAGE_ROOT + vehicle.image + '-wheel.webp'}
        alt=""
        width="512"
        height="512"
        decoding="async"
        draggable="false"
      />
    </span>
  ));
}

const CAR_RIMS = [
  { x: 16.3, y: 76.5, diameter: 12.1 },
  { x: 82.7, y: 76.4, diameter: 12.1 },
];

function CarRims() {
  return CAR_RIMS.map(({ x, y, diameter }, index) => {
    const height = diameter * (1925 / 817);
    const left = x - diameter / 2;
    const top = y - height / 2;
    return (
      <span
        className="rr-road__rim"
        key={index}
        style={{
          left: left + '%',
          top: top + '%',
          width: diameter + '%',
          backgroundSize: 10000 / diameter + '% auto',
          backgroundPosition:
            (left / (100 - diameter)) * 100 + '% ' + (top / (100 - height)) * 100 + '%',
        }}
      />
    );
  });
}

export function VehicleRoadAnimation({ category = 'Bike', onCategory }) {
  const sectionRef = useRef(null);
  const buttonsRef = useRef([]);
  const [localCategory, setLocalCategory] = useState(category);
  const [ready, setReady] = useState({});
  const [failed, setFailed] = useState({});
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [pausedByUser, setPausedByUser] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [displayed, setDisplayed] = useState('Bike');
  const id = useId();
  const selected = onCategory ? category : localCategory;
  const requested = VEHICLES.find((vehicle) => vehicle.category === selected) || VEHICLES[0];
  const active = VEHICLES.find((vehicle) => vehicle.category === displayed);
  const paused = !inView || !pageVisible || pausedByUser || reducedMotion;

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion = () => setReducedMotion(media.matches);
    const updateVisibility = () => setPageVisible(!document.hidden);
    updateMotion();
    updateVisibility();
    media.addEventListener('change', updateMotion);
    document.addEventListener('visibilitychange', updateVisibility);
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.05,
    });
    observer.observe(sectionRef.current);
    return () => {
      media.removeEventListener('change', updateMotion);
      document.removeEventListener('visibilitychange', updateVisibility);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    // Decode first, then crossfade. Retain the current vehicle until its replacement is ready.
    let cancelled = false;
    VEHICLES.forEach((vehicle) => {
      const sources = [vehicle.image, ...(vehicle.wheels ? [vehicle.image + '-wheel'] : [])];
      Promise.all(
        sources.map((source) => {
          const image = new Image();
          image.src = IMAGE_ROOT + source + '.webp';
          return image.decode();
        }),
      )
        .then(() => {
          if (!cancelled) setReady((state) => ({ ...state, [vehicle.category]: true }));
        })
        .catch(() => {
          if (!cancelled) setFailed((state) => ({ ...state, [vehicle.category]: true }));
        });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (ready[requested.category]) setDisplayed(requested.category);
  }, [requested.category, ready]);

  const select = (value) => {
    setLocalCategory(value);
    onCategory?.(value);
  };
  const handleKeys = (event, index) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? 2
          : (index + (event.key === 'ArrowRight' ? 1 : 2)) % 3;
    select(VEHICLES[next].category);
    buttonsRef.current[next]?.focus();
  };

  return (
    <section
      ref={sectionRef}
      className="rr-road"
      id="your-journey"
      aria-labelledby={id + '-heading'}
      data-paused={paused}
      data-reduced-motion={reducedMotion}
    >
      <div className="container rr-road__header">
        <div className="rr-road__intro">
          <p className="rr-road__eyebrow">THE ROAD IS YOURS</p>
          <h2 id={id + '-heading'}>
            Your Journey <em>Starts Here.</em>
          </h2>
          <p className="rr-road__description">Three ways to move. One feeling of freedom.</p>
        </div>
        <div
          className="rr-road__tabs road-tabs"
          role="tablist"
          aria-label="Choose your driving vehicle"
        >
          {VEHICLES.map(({ category: value, icon: Icon }, index) => (
            <button
              key={value}
              ref={(element) => {
                buttonsRef.current[index] = element;
              }}
              type="button"
              role="tab"
              id={id + '-tab-' + value}
              aria-selected={selected === value}
              aria-controls={id + '-scene'}
              tabIndex={selected === value ? 0 : -1}
              className={selected === value ? 'selected' : ''}
              onClick={() => select(value)}
              onKeyDown={(event) => handleKeys(event, index)}
            >
              <Icon size={17} aria-hidden="true" />
              {value}
            </button>
          ))}
        </div>
      </div>
      <div
        className="rr-road__scene road-stage"
        id={id + '-scene'}
        role="tabpanel"
        aria-labelledby={id + '-tab-' + requested.category}
        aria-label={'Animated ' + requested.category.toLowerCase() + ' driving along a road'}
      >
        <div className="rr-road__world" aria-hidden="true">
          <div className="rr-road__sky-light" />
          <div className="rr-road__mountains rr-road__mountains--far">
            <i />
            <i />
          </div>
          <div className="rr-road__mountains rr-road__mountains--near">
            <i />
            <i />
          </div>
          <div className="rr-road__city">
            <i />
            <i />
          </div>
          <div className="rr-road__horizon" />
          <div className="rr-road__barrier">
            <i />
          </div>
          <div className="rr-road__asphalt">
            <div className="rr-road__texture" />
            <div className="rr-road__lane rr-road__lane--far" />
            <div className="rr-road__lane rr-road__lane--near" />
          </div>
          <div className="rr-road__light-trail" />
          {VEHICLES.map((vehicle) => (
            <div
              key={vehicle.category}
              className={'rr-road__vehicle rr-road__vehicle--' + vehicle.image}
              data-active={displayed === vehicle.category && !!ready[vehicle.category]}
            >
              <div className="rr-road__contact-shadow" />
              <div className="rr-road__suspension">
                <div
                  className={
                    'rr-road__orientation' +
                    (vehicle.category === 'Car' ? ' rr-road__orientation--left' : '')
                  }
                >
                  {vehicle.wheels && <DrivingWheels vehicle={vehicle} />}
                  <img
                    src={IMAGE_ROOT + vehicle.image + '.webp'}
                    width={vehicle.width}
                    height={vehicle.height}
                    alt=""
                    decoding="async"
                    draggable="false"
                    style={
                      vehicle.wheels
                        ? {
                            maskImage: BODY_MASKS[vehicle.category],
                            WebkitMaskImage: BODY_MASKS[vehicle.category],
                          }
                        : undefined
                    }
                  />
                  {vehicle.category === 'Car' && <CarRims />}
                </div>
              </div>
            </div>
          ))}
          <div className="rr-road__foreground" />
        </div>
        <div className="container rr-road__scene-footer">
          <div className="rr-road__identity" aria-live="polite" aria-atomic="true">
            <span className="rr-road__status-dot" />
            <span>
              {failed[requested.category]
                ? 'Vehicle image unavailable'
                : ready[requested.category]
                  ? active.model
                  : 'Preparing your ride…'}
            </span>
            <span className="rr-road__identity-note">
              {reducedMotion ? 'Still view · reduced motion' : 'Made for the open road'}
            </span>
          </div>
          <button
            className="rr-road__motion-toggle"
            type="button"
            aria-label={pausedByUser ? 'Play driving animation' : 'Pause driving animation'}
            aria-pressed={pausedByUser}
            disabled={reducedMotion}
            onClick={() => setPausedByUser((value) => !value)}
          >
            {pausedByUser ? (
              <Play size={14} aria-hidden="true" />
            ) : (
              <Pause size={14} aria-hidden="true" />
            )}
            <span>{pausedByUser ? 'Play' : 'Pause'}</span>
          </button>
        </div>
      </div>
      <div className="container rr-road__credits">
        <a href="/images/animations/CREDITS.html" target="_blank" rel="noreferrer">
          Vehicle photo credits ↗
        </a>
        <span>Choose a ride. Make the road your own.</span>
      </div>
    </section>
  );
}
