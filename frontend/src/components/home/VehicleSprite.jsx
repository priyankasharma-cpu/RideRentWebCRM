import './VehicleSprite.css';
export function VehicleSprite({ category }) {
  return (
    <div className="driving-vehicle" key={category}>
      {category === 'Car' ? (
        <svg viewBox="0 0 300 130" fill="none">
          <path
            d="M28 80L55 67L86 29Q92 23 109 23H194Q207 23 219 42L239 67L270 78L279 105H23Z"
            fill="#0785ef"
            stroke="#9bdbff"
            strokeWidth="3"
          />
          <path d="M88 34H136V64H63ZM145 34H190L215 64H145Z" fill="#071c37" />
          <path d="M29 83H56M245 82H271" stroke="#e3f4ff" strokeWidth="7" />
          <path d="M110 78H125M161 78H176" stroke="#bddeff" strokeWidth="3" />
          {[76, 226].map((x) => (
            <g
              className="spinning-wheel"
              style={{
                transformOrigin: `${x}px 102px`,
              }}
              key={x}
            >
              <circle cx={x} cy="102" r="22" fill="#09131f" stroke="#c4e2f9" strokeWidth="5" />
              <path d={`M${x - 14} 102H${x + 14}M${x} 88V116`} stroke="#6d91aa" strokeWidth="3" />
            </g>
          ))}
        </svg>
      ) : (
        <svg viewBox="0 0 300 150" fill="none">
          {[67, 235].map((x) => (
            <g
              className="spinning-wheel"
              style={{
                transformOrigin: `${x}px 115px`,
              }}
              key={x}
            >
              <circle cx={x} cy="115" r="29" fill="#0b1825" stroke="#9bdbff" strokeWidth="5" />
              <circle cx={x} cy="115" r="19" stroke="#087bff" strokeWidth="3" />
              <path d={`M${x - 17} 115H${x + 17}M${x} 98V132`} stroke="#829fb2" strokeWidth="3" />
            </g>
          ))}
          {category === 'Bike' ? (
            <>
              <path
                d="M67 115L108 66L160 115H67L128 68L194 67L235 115"
                stroke="#98a8bd"
                strokeWidth="8"
              />
              <path
                d="M86 60L111 49L145 50L168 66L143 84L110 80Z"
                fill="#1389ff"
                stroke="#8edcff"
                strokeWidth="2"
              />
              <path
                d="M184 59L209 54L215 28L198 26M72 55H116M148 111H178"
                stroke="#0d2944"
                strokeWidth="11"
              />
              <path d="M183 43L211 45L214 62L194 70" fill="#168eff" />
              <path d="M56 74L38 68L44 58L91 57" fill="#0081ed" />
            </>
          ) : (
            <>
              <path
                d="M66 109L94 79L148 96H189L184 59L202 33L216 37L219 85L241 97L252 110H201L174 113H110Z"
                fill="#d4ecff"
                stroke="#399eff"
                strokeWidth="3"
              />
              <path d="M83 78L94 67H147L153 81Z" fill="#15324d" />
              <path d="M202 32L194 17H176M218 39L235 35" stroke="#8fcaff" strokeWidth="7" />
            </>
          )}
        </svg>
      )}
    </div>
  );
}
