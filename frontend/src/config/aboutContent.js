// Replace image.src with image.replacementPath after supplying the dedicated photo.
export const aboutContent = {
  hero: {
    eyebrow: 'ABOUT RIDERENT',
    titleLead: 'Your Journey.',
    titleAccent: 'Our Passion.',
    description:
      'At RideRent, we make every journey easier with flexible vehicle rentals, transparent pricing, and a simple booking experience.',
    cta: 'Find Your Ride',
    ctaPath: '/vehicles',
    detail: 'Bikes, scooters & cars. Your plans, your pace.',
    image: {
      src: '/images/vehicles/cars/fleet-car.jpg',
      replacementPath: '/images/about/about-hero.webp',
      alt: 'White SUV parked beside an open mountain landscape',
      caption: 'A little freedom. A whole new perspective.',
    },
  },
  story: {
    eyebrow: 'MADE FOR THE WAY YOU MOVE',
    title: 'Who We Are',
    paragraphs: [
      'A quick commute, a day of errands, or a change of scenery. Whatever brings you to the road, choosing a rental should feel straightforward.',
      'RideRent brings bikes, scooters and cars together in one place. Compare vehicles, choose your hours and review your rental details before you book. We keep the experience clear so you can focus on where you want to go.',
    ],
    highlights: [
      'Choose a vehicle that fits your plans',
      'Review your quote before confirming',
      'Keep your booking reference close at hand',
    ],
    image: {
      src: '/images/vehicles/bikes/fleet-classic.jpg',
      replacementPath: '/images/about/about-story.webp',
      alt: 'Orange motorcycle parked beside a tiled building',
    },
    caption: 'Everyday journeys deserve a great ride.',
  },
  features: {
    eyebrow: 'THE RIDERENT APPROACH',
    title: 'Less hassle. More open road.',
    description: 'Thoughtful rental essentials that make planning your next ride feel simple.',
    items: [
      {
        icon: 'clock',
        title: 'Flexible Hourly Rentals',
        description:
          'Choose rental hours around your schedule, whether you need a quick ride or a longer day out.',
      },
      {
        icon: 'receipt',
        title: 'Transparent Pricing',
        description:
          'Review rental charges, deposits and applicable terms in your quote before confirming.',
      },
      {
        icon: 'car',
        title: 'Bikes, Scooters & Cars',
        description:
          'Explore different ways to travel and find the vehicle that suits your journey.',
      },
      {
        icon: 'booking',
        title: 'Simple Booking Experience',
        description:
          'Select your vehicle and dates, confirm your details and keep your booking reference handy.',
      },
    ],
  },
  mission: {
    eyebrow: 'PURPOSE IN EVERY JOURNEY',
    title: 'Our Mission',
    description:
      'To make everyday mobility easier to plan, easier to understand and better suited to your life. We believe a great rental experience starts with clear choices and the freedom to choose your own pace.',
    values: [
      { title: 'Convenience', description: 'Find your vehicle and plan your rental in one place.' },
      {
        title: 'Transparency',
        description: 'Understand the quote and rental terms before you commit.',
      },
      {
        title: 'Flexibility',
        description: 'Choose from different vehicle types and rental hours.',
      },
    ],
    image: {
      src: '/images/vehicles/bikes/fleet-road.jpg',
      replacementPath: '/images/about/about-mission.webp',
      alt: 'Motorcyclist riding along an open road at sunset',
    },
  },
};
