const packages = {
  basic: {
    name: 'Basic',
    price: 120,
    tag: 'Best for small businesses',
    description: 'A focused, professional presence for getting online with confidence.',
    features: ['Up to 5 pages', 'Responsive design', 'Contact form integration', 'Basic SEO setup', 'Social media integration', '1-2 weeks delivery']
  },
  standard: {
    name: 'Standard',
    price: 250,
    tag: 'Most popular',
    description: 'A stronger digital foundation for growing businesses ready to stand out.',
    features: ['Up to 10 pages', 'Custom UI/UX design', 'Responsive design', 'Clear calls-to-action', 'Google Maps integration', 'Blog or news section', 'Basic SEO optimisation', '2-4 weeks delivery']
  },
  premium: {
    name: 'Premium',
    price: 400,
    tag: 'For ambitious teams',
    description: 'A complete, flexible platform for teams with bigger goals and richer needs.',
    features: ['Unlimited pages', 'Advanced UX/UI design', 'Full custom functionality', 'Advanced SEO setup', 'Performance optimisation', 'Social media integration', '1 month free support', '4-6 weeks delivery']
  }
};

const addOnCatalog = {
  'Domain Registration (1 year)': { price: 15, description: 'Secure your perfect web address.' },
  'Web Hosting (1 year)': { price: 40, description: 'Reliable hosting for your new site.' },
  'Website Maintenance (Monthly)': { price: 20, description: 'Keep content and security up to date.' },
  'Additional Page': { price: 10, description: 'Extend your site as your needs grow.' },
  'Logo Design': { price: 30, description: 'A sharper identity to match the new site.' }
};

module.exports = { packages, addOnCatalog };