import { Zap, ShieldCheck, Tag, CarFront, Headphones } from 'lucide-react';
export const benefits = [
  {
    icon: Zap,
    title: 'Instant Booking',
    text: 'Less waiting. More riding.',
    tone: 'purple',
  },
  {
    icon: ShieldCheck,
    title: 'Well Maintained',
    text: 'Clean, checked & road-ready.',
    tone: 'blue',
  },
  {
    icon: Tag,
    title: 'Affordable Rates',
    text: 'Great rides. Honest prices.',
    tone: 'pink',
  },
  {
    icon: CarFront,
    title: 'Wide Vehicle Range',
    text: 'A ride for every kind of day.',
    tone: 'blue',
  },
  {
    icon: Headphones,
    title: '24/7 Support',
    text: 'We’re always along for the ride.',
    tone: 'teal',
  },
];
export const homeContent = {
  hero: {
    eyebrow: 'YOUR JOURNEY STARTS HERE',
    titleLead: 'Premium',
    titleAccent: 'Vehicle Rental',
    titleEnd: 'for Every Journey',
    darkTitleLead: 'PREMIUM VEHICLE',
    darkTitleAccent: 'RENTAL SERVICES',
    descriptionLead: 'Rent Bikes, Scooters & Cars on Your Terms.',
    description: 'By the hour. For the adventure. Always ready for you.',
    callLabel: 'Prefer a quick chat? Call to Book',
    annotationLead: 'Your ride.',
    annotationEnd: 'Your rules.',
    badgeLead: 'Great rides.',
    badgeAccent: 'Even better rates.',
    reviewsTitle: 'Sample rider reviews',
    reviewsDescription: 'Illustrative demo content',
    sampleRating: '4.9',
  },
  booking: {
    cta: 'Search Available Vehicles',
    note: 'No hidden charges. Just good journeys.',
  },
  categories: {
    eyebrow: 'CHOOSE YOUR RIDE',
    titleLead: 'Explore Our',
    titleAccent: 'Vehicles',
    allVehiclesLabel: 'View All Vehicles',
  },
  popular: {
    eyebrow: 'THE CROWD FAVORITES',
    titleLead: 'Most Rented',
    titleAccent: 'Vehicles',
    readyLabel: 'Ready when you are',
    empty: 'No matching vehicles. Try another category.',
  },
  why: {
    eyebrow: 'WHY RIDE WITH US',
    titleLead: 'More than',
    titleAccent: 'just a rental.',
    description:
      'For the everyday commute and the unplanned detour. We bring you well-maintained rides, flexible plans, and a team that cares about your journey.',
  },
  how: {
    eyebrow: 'LESS PLANNING. MORE EXPLORING.',
    titleLead: 'Your next adventure,',
    titleAccent: 'in three steps.',
    steps: [
      ['01', 'Find your kind of ride', 'Choose a bike, scooter or car that fits your plans.'],
      ['02', 'Make it yours', 'Pick your dates, check the hourly rate and request your ride.'],
      ['03', 'Pick up. Head out.', 'Bring your valid license and ID. The open road is waiting.'],
    ],
  },
  rental: {
    title: 'A few things before you go.',
    description:
      'Riders must be 18+ and carry a valid driving license and government ID. Fuel is excluded. Security deposit, pickup details, and cancellation terms are confirmed by our team before payment.',
    callLabel: 'Talk to our team',
  },
  faq: {
    eyebrow: 'A FEW GOOD ANSWERS',
    titleLead: 'Before you',
    titleAccent: 'hit the road.',
  },
  final: {
    titleLead: 'Ready for your',
    titleAccent: 'next chapter?',
    cta: 'Find Your Ride',
  },
};
homeContent.categories.items = [
  { name: 'Bikes', type: 'Bike', imageKey: 'bike' },
  { name: 'Scooters', type: 'Scooter', imageKey: 'scooter' },
  { name: 'Cars', type: 'Car', imageKey: 'car' },
];
