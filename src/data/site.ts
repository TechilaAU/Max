// Business details. Anything marked TODO must be confirmed with Max before launch.
export const site = {
  name: 'Max Healthcare Equipment',
  shortName: 'Max Healthcare',
  tagline: 'Healthcare and mobility equipment for hire or purchase, delivered next day.',
  phone: '1800 684 277',
  phoneHref: 'tel:1800684277',
  email: 'info@maxhealthcare.com.au',
  // TODO: confirm showroom. Directories list 7 Marlow Rd Keswick; the old site mentions a Panorama showroom.
  address: { street: '7 Marlow Rd', suburb: 'Keswick', state: 'SA', postcode: '5035' },
  addressConfirmed: false,
  hours: 'TODO: confirm opening hours',
  abn: 'TODO',
  // TODO: link to the live hire/payment portal (the Salesforce site Nick publishes)
  portalUrl: '#',
  facebook: 'https://www.facebook.com/maxhealthequipment/',
};

export const nav = [
  { label: 'Equipment', href: '/equipment/' },
  { label: 'Hire', href: '/hire/' },
  { label: 'Referrers', href: '/referrers/' },
  { label: 'Funding', href: '/funding/' },
  { label: 'About', href: '/about/' },
  { label: 'Contact', href: '/contact/' },
];

export const testimonials = [
  { quote: 'Thank you for the fast delivery. It was a great help having the equipment waiting for us upon arrival home from the hospital.', name: 'Sue', place: 'West Beach, SA' },
  { quote: 'Thanks for your service. I would have ended up back in hospital within 2 days without this equipment.', name: 'Lyn', place: 'Kidman Park, SA' },
];
