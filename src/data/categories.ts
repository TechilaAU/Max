// Equipment categories. Slugs match the old WooCommerce categories where possible (see redirects in astro.config.mjs).
// `kind: 'filter'` pages are built from product flags rather than a category assignment.
export type Category = {
  slug: string;
  name: string;
  blurb: string;
  intro: string;
  subcategories?: string[];
  kind?: 'category' | 'filter';
};

export const categories: Category[] = [
  { slug: 'mobility', name: 'Mobility', blurb: 'Wheelchairs, walkers, scooters',
    intro: 'Equipment to help you get around safely at home and out in the community, from walking aids to electric scooters.',
    subcategories: ['Electric Scooters / Gophers', 'Powered Wheelchairs', 'Self-Propelled Wheelchairs', 'Transit Wheelchairs', 'Walkers', 'Walking Aids', 'Mobility Accessories'] },
  { slug: 'bedroom', name: 'Bedroom', blurb: 'Electric beds, mattresses, rails',
    intro: 'Electric high-low beds, mattresses and bed accessories, delivered and installed by our trained team.',
    subcategories: ['Beds', 'Mattresses', 'Bed Sticks & Rails', 'Bedroom Aids'] },
  { slug: 'bathroom-toilet', name: 'Bathroom & Toilet', blurb: 'Shower chairs, commodes, raisers',
    intro: 'Shower chairs, commodes, toilet surrounds and transfer aids to make the bathroom safer.',
    subcategories: ['Shower Chairs & Stools', 'Commodes', 'Toilet Surrounds', 'Toilet Seat Raisers', 'Transfer Benches', 'Small Bathroom Aids'] },
  { slug: 'chairs-seating', name: 'Chairs & Seating', blurb: 'Lift recliners, cushions',
    intro: 'Electric lift recliners and supportive seating. Trial chairs in our showroom or at home before you decide.',
    subcategories: ['Electric Lift Chairs / Recliners', 'Utility Chairs', 'Cushions'] },
  { slug: 'pressure-care', name: 'Pressure Care', blurb: 'Mattresses and cushions',
    intro: 'Pressure care mattresses, overlays and cushions for people spending long periods in bed or seated.' },
  { slug: 'patient-lifters', name: 'Patient Lifters', blurb: 'Lifters and slings',
    intro: 'Patient lifters and slings for safe transfers at home, with set-up and guidance from our team.',
    subcategories: ['Lifters', 'Slings'] },
  { slug: 'daily-living-aids', name: 'Daily Living Aids', blurb: 'Dressing, reaching, eating',
    intro: 'Small aids that make everyday tasks easier while you recover or as needs change.' },
  { slug: 'kitchen', name: 'Kitchen', blurb: 'Appliances, cutlery, accessories',
    intro: 'Adapted cutlery, kitchen accessories and appliances for independent cooking and eating.',
    subcategories: ['Appliances', 'Cutlery', 'Kitchen Accessories'] },
  { slug: 'personal-hygiene', name: 'Personal Hygiene', blurb: 'Everyday care products',
    intro: 'Personal hygiene and continence products for everyday care.' },
  { slug: 'falls-prevention', name: 'Falls Prevention', blurb: 'Mats, alarms, rails',
    intro: 'Equipment that reduces the risk of falls at home.' },
  { slug: 'exercise-rehabilitation', name: 'Exercise & Rehab', blurb: 'Braces, weights, equipment',
    intro: 'Braces, weights and exercise equipment to support rehabilitation.',
    subcategories: ['Braces', 'Exercise Equipment', 'Weights'] },
  { slug: 'bariatric', name: 'Bariatric / Plus Size', blurb: 'Higher weight capacity',
    intro: 'Beds, chairs, mobility and bathroom equipment rated for higher weight capacities.' },
];

export const filterPages: Category[] = [
  { slug: 'hire', name: 'Hire equipment', blurb: 'Weekly hire', kind: 'filter',
    intro: 'Everything available to hire by the week. Delivered and set up by our team, with weekly payments you manage online.' },
  { slug: 'ex-hire-stock', name: 'Ex-hire stock', blurb: 'Cleaned, discounted', kind: 'filter',
    intro: 'Ex-hire equipment, cleaned and checked, at a lower price. South Australia only. Stock changes often, so call us for the current list. Ex-hire items are sold as is and cannot be returned, refunded or exchanged, and do not come with a warranty.' },
  { slug: 'packages', name: 'Equipment packages', blurb: 'Bundles for going home', kind: 'filter',
    intro: 'Bundled equipment for common situations, such as coming home after surgery, so you get everything you need in one delivery.' },
];

export const allCategoryPages = [...categories, ...filterPages];
export const categoryBySlug = (slug: string) => allCategoryPages.find((c) => c.slug === slug);
