import { useEffect } from 'react';
import { Bug, Droplets, Phone } from 'lucide-react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';

import './RapidHoma.css';

export const services = [
  {
    slug: 'pest-control',
    name: 'Pest Control',
    phone: '+18338637643',
    displayPhone: '1 (833) 863-7643',
    icon: Bug,
    description: 'Get help with unwanted pests in and around your home.',
    examples: ['Ants and cockroaches', 'Rodents', 'Household pest concerns'],
  },
  {
    slug: 'plumbing',
    name: 'Plumbing',
    phone: '+18444552688',
    displayPhone: '1 (844) 455-2688',
    icon: Droplets,
    description: 'Talk through leaks, clogged drains, and other household plumbing problems.',
    examples: ['Leaks and dripping fixtures', 'Clogged drains', 'Toilet and faucet problems'],
  },
];

function ServiceCall({ service }) {
  return (
    <a
      className="rapid-homa__call"
      href={`tel:${service.phone}`}
      aria-label={`Call RapidHoma ${service.name} at ${service.displayPhone}`}
    >
      <Phone size={18} aria-hidden="true" />
      {service.displayPhone}
    </a>
  );
}

export function RapidHomaLayout() {
  const { pathname } = useLocation();

  useEffect(() => {
    const service = services.find(({ slug }) => pathname.replace(/^\/|\/$/g, '') === slug);
    const previousTitle = document.title;
    document.title = service
      ? `${service.name} | RapidHoma`
      : 'RapidHoma | Pest Control & Plumbing';
    window.scrollTo(0, 0);
    return () => {
      document.title = previousTitle;
    };
  }, [pathname]);

  return (
    <div className="rapid-homa">
      <header className="rapid-homa__header">
        <div className="rapid-homa__container rapid-homa__header-content">
          <Link to="/" aria-label="RapidHoma home">
            <img className="rapid-homa__logo" src="/images/rapidhoma/logo.png" alt="RapidHoma" />
          </Link>
          <nav aria-label="Home services">
            {services.map((service) => (
              <NavLink key={service.slug} to={`/${service.slug}`}>
                {service.name}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="rapid-homa__container rapid-homa__main">
        <Outlet />
      </main>
      <footer className="rapid-homa__footer">
        <div className="rapid-homa__container rapid-homa__footer-content">
          <Link to="/">RapidHoma</Link>
          {services.map((service) => (
            <a key={service.slug} href={`tel:${service.phone}`}>
              {service.name} · {service.displayPhone}
            </a>
          ))}
        </div>
      </footer>
    </div>
  );
}

export function RapidHomaHome() {
  return (
    <>
      <section className="rapid-homa__intro" aria-labelledby="rapid-homa-heading">
        <h1 id="rapid-homa-heading">
          Home services.
          <br />
          <span>One call away.</span>
        </h1>
        <p>Choose the service you need and call RapidHoma directly.</p>
      </section>
      <div className="rapid-homa__cards">
        {services.map((service) => {
          const Icon = service.icon;
          return (
            <article className="rapid-homa__card" key={service.slug}>
              <div className="rapid-homa__icon">
                <Icon size={28} aria-hidden="true" />
              </div>
              <h2>
                <Link to={`/${service.slug}`}>{service.name}</Link>
              </h2>
              <p>{service.description}</p>
              <ServiceCall service={service} />
            </article>
          );
        })}
      </div>
    </>
  );
}

export function RapidHomaService({ service }) {
  const Icon = service.icon;

  return (
    <>
      <section className="rapid-homa__detail" aria-labelledby="rapid-homa-heading">
        <Link className="rapid-homa__back" to="/">
          All home services
        </Link>
        <div className="rapid-homa__icon">
          <Icon size={30} aria-hidden="true" />
        </div>
        <h1 id="rapid-homa-heading">{service.name}</h1>
        <p>{service.description}</p>
        <ul>
          {service.examples.map((example) => (
            <li key={example}>{example}</li>
          ))}
        </ul>
        <ServiceCall service={service} />
      </section>
    </>
  );
}
