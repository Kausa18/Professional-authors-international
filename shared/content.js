// The content model: every editable setting and list on the site.
// The server uses it to build database tables and validate input, and the
// admin uses it to draw its forms. Default values live in server/seed/defaults.js.

export const IMAGE_PATTERN = /^\/api\/images\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COLOR_PATTERN = /^#[0-9a-f]{6}$/i;
const URL_PATTERN = /^https?:\/\/\S+$/i;

// ---------- Pages ----------
// Each page's menu label, headline and intro are settings, so they can be edited.
export const PAGES = [
  { key: 'about', path: '/about', nav: 'aboutNav', title: 'aboutTitle', intro: 'aboutIntro', eyebrow: 'aboutEyebrow' },
  { key: 'services', path: '/services', nav: 'servicesNav', title: 'servicesTitle', intro: 'servicesIntro', eyebrow: 'servicesEyebrow' },
  { key: 'books', path: '/books', nav: 'booksNav', title: 'booksPageTitle', intro: 'booksPageIntro', eyebrow: 'booksEyebrow' },
  { key: 'membership', path: '/membership', nav: 'membershipNav', title: 'membershipTitle', intro: 'membershipIntro', eyebrow: 'membershipEyebrow' },
  { key: 'events', path: '/events', nav: 'eventsNav', title: 'eventsTitle', intro: 'eventsIntro', eyebrow: 'eventsEyebrow' },
  { key: 'join', path: '/join', nav: 'joinNav', title: 'joinTitle', intro: 'joinIntro', eyebrow: 'joinEyebrow' }
];

// Brand colours from the settings, as CSS variables for the stylesheet.
export function themeVariables(settings) {
  return {
    '--brand-primary': settings.colorPrimary,
    '--brand-accent': settings.colorAccent,
    '--brand-highlight': settings.colorHighlight
  };
}

// ---------- Site settings ----------

export const SETTING_GROUPS = [
  { key: 'brand', label: 'Brand' },
  { key: 'appearance', label: 'Appearance' },
  { key: 'contact', label: 'Contact details' },
  { key: 'home', label: 'Home page' },
  { key: 'about', label: 'About page' },
  { key: 'services', label: 'Services page' },
  { key: 'books', label: 'Books page' },
  { key: 'membership', label: 'Membership page' },
  { key: 'events', label: 'Events page' },
  { key: 'join', label: 'Join page' }
];

// Sections that can be shown, hidden and reordered on a page.
export const LAYOUTS = {
  layoutHome: [
    { key: 'hero', label: 'Welcome banner' },
    { key: 'highlights', label: 'Highlights band' },
    { key: 'gallery', label: 'Photo gallery' },
    { key: 'intro', label: 'Introduction' },
    { key: 'events', label: 'Upcoming events' },
    { key: 'books', label: 'Books by our members' },
    { key: 'cta', label: 'Call to action' }
  ],
  layoutAbout: [
    { key: 'mission', label: 'Our mission' },
    { key: 'story', label: 'Our story' },
    { key: 'principles', label: 'What we stand for' },
    { key: 'team', label: 'Leadership' },
    { key: 'cta', label: 'Call to action' }
  ]
};

const text = (key, group, label, max = 120, extra = {}) => ({ key, group, label, type: 'text', max, ...extra });
const area = (key, group, label, max = 1000, extra = {}) => ({ key, group, label, type: 'textarea', max, ...extra });

export const SETTINGS = [
  text('siteName', 'brand', 'Organisation name', 100, { required: true }),
  text('shortName', 'brand', 'Short name', 20),
  text('tagline', 'brand', 'Tagline', 160),
  { key: 'logo', group: 'brand', label: 'Logo', type: 'image' },
  area('metaDescription', 'brand', 'Search engine description', 300, { help: 'Shown by Google and when the site is shared.' }),
  text('footerText', 'brand', 'Footer text', 200),
  text('notFoundTitle', 'brand', 'Missing page: heading'),
  text('notFoundText', 'brand', 'Missing page: text', 300),
  text('notFoundLink', 'brand', 'Missing page: button', 40),

  { key: 'colorPrimary', group: 'appearance', label: 'Main colour', type: 'color', help: 'Buttons and the highlights band.' },
  { key: 'colorAccent', group: 'appearance', label: 'Accent colour', type: 'color', help: 'Numbers, borders and small details.' },
  { key: 'colorHighlight', group: 'appearance', label: 'Highlight colour', type: 'color', help: 'Small headings and links.' },
  { key: 'galleryStyle', group: 'appearance', label: 'Photo gallery style', type: 'select',
    options: [{ value: 'featured', label: 'First photo large' }, { value: 'grid', label: 'Even grid' }] },
  { key: 'homeBooksCount', group: 'appearance', label: 'Books shown on the home page', type: 'number', min: 0, max: 12 },
  { key: 'homeEventsCount', group: 'appearance', label: 'Events shown on the home page', type: 'number', min: 0, max: 12 },
  { key: 'showPastEvents', group: 'appearance', label: 'Show past events on the Events page', type: 'toggle' },

  { key: 'contactEmail', group: 'contact', label: 'Email', type: 'email', max: 120 },
  text('contactPhone', 'contact', 'Phone', 40),
  area('address', 'contact', 'Address', 300),
  { key: 'facebookUrl', group: 'contact', label: 'Facebook page link', type: 'url' },
  { key: 'instagramUrl', group: 'contact', label: 'Instagram link', type: 'url' },

  { key: 'layoutHome', group: 'home', label: 'Sections on the home page', type: 'layout' },
  text('heroEyebrow', 'home', 'Banner: small heading'),
  text('heroTitle', 'home', 'Banner: headline', 140),
  area('heroText', 'home', 'Banner: text', 500),
  text('heroPrimaryLabel', 'home', 'Banner: main button', 40),
  text('heroSecondaryLabel', 'home', 'Banner: second button', 40),
  text('galleryTitle', 'home', 'Gallery: heading'),
  text('galleryIntro', 'home', 'Gallery: intro', 300),
  text('introTitle', 'home', 'Introduction: heading'),
  area('introText', 'home', 'Introduction: text', 1000),
  text('introLinkLabel', 'home', 'Introduction: button', 40),
  text('eventsPreviewTitle', 'home', 'Events: heading'),
  text('eventsPreviewLinkLabel', 'home', 'Events: button', 40),
  text('booksTitle', 'home', 'Books: heading'),
  text('booksIntro', 'home', 'Books: intro', 300),
  text('booksLinkLabel', 'home', 'Books: button', 40),
  text('ctaTitle', 'home', 'Call to action: heading', 140, { help: 'Also used on the About page.' }),
  area('ctaText', 'home', 'Call to action: text', 300),
  text('ctaPrimaryLabel', 'home', 'Call to action: main button', 40),
  text('ctaSecondaryLabel', 'home', 'Call to action: second button', 40),

  { key: 'layoutAbout', group: 'about', label: 'Sections on the About page', type: 'layout' },
  text('aboutNav', 'about', 'Menu label', 30, { required: true }),
  text('aboutEyebrow', 'about', 'Small heading'),
  text('aboutTitle', 'about', 'Headline', 140),
  area('aboutIntro', 'about', 'Intro', 500),
  text('missionTitle', 'about', 'Mission: heading'),
  area('missionText', 'about', 'Mission: text', 1500),
  text('storyTitle', 'about', 'Story: heading'),
  area('storyText', 'about', 'Story: text', 5000),
  text('principlesTitle', 'about', 'What we stand for: heading'),
  text('teamTitle', 'about', 'Leadership: heading'),

  text('servicesNav', 'services', 'Menu label', 30, { required: true }),
  text('servicesEyebrow', 'services', 'Small heading'),
  text('servicesTitle', 'services', 'Headline', 140),
  area('servicesIntro', 'services', 'Intro', 500),

  text('booksNav', 'books', 'Menu label', 30, { required: true }),
  text('booksEyebrow', 'books', 'Small heading'),
  text('booksPageTitle', 'books', 'Headline', 140),
  area('booksPageIntro', 'books', 'Intro', 500),
  text('booksEmpty', 'books', 'Message when there are no books', 200),
  text('bookLinkLabel', 'books', 'Book link label', 40),

  text('membershipNav', 'membership', 'Menu label', 30, { required: true }),
  text('membershipEyebrow', 'membership', 'Small heading'),
  text('membershipTitle', 'membership', 'Headline', 140),
  area('membershipIntro', 'membership', 'Intro', 500),
  text('membershipEmpty', 'membership', 'Message when there are no tiers', 200),
  text('membershipJoinLabel', 'membership', 'Join button', 40),

  text('eventsNav', 'events', 'Menu label', 30, { required: true }),
  text('eventsEyebrow', 'events', 'Small heading'),
  text('eventsTitle', 'events', 'Headline', 140),
  area('eventsIntro', 'events', 'Intro', 500),
  text('upcomingTitle', 'events', 'Upcoming events: heading'),
  text('pastTitle', 'events', 'Past events: heading'),
  text('eventsEmpty', 'events', 'Message when there are no upcoming events', 200),
  text('eventLinkLabel', 'events', 'Event link label', 40),

  text('joinNav', 'join', 'Menu label', 30, { required: true }),
  text('joinEyebrow', 'join', 'Small heading'),
  text('joinTitle', 'join', 'Headline', 140),
  area('joinIntro', 'join', 'Intro', 500),
  text('joinNameLabel', 'join', 'Form: name label', 60),
  text('joinEmailLabel', 'join', 'Form: email label', 60),
  text('joinPhoneLabel', 'join', 'Form: phone label', 60),
  text('joinGenreLabel', 'join', 'Form: genre label', 60),
  text('joinMessageLabel', 'join', 'Form: message label', 60),
  text('joinButton', 'join', 'Form: button', 40),
  text('joinSuccess', 'join', 'Thank-you message', 300),
  text('joinContactTitle', 'join', 'Contact box heading')
];

// ---------- Lists the admin can add to, edit and reorder ----------

export const COLLECTIONS = {
  highlights: {
    label: 'Highlights', help: 'The short facts in the coloured band on the home page.',
    fields: [
      { key: 'value', label: 'Big text', required: true, max: 40 },
      { key: 'label', label: 'Small text', required: true, max: 120 }
    ],
    title: 'value', subtitle: 'label'
  },
  events: {
    label: 'Events', sortBy: 'date',
    fields: [
      { key: 'title', label: 'Event title', required: true, max: 120 },
      { key: 'date', label: 'Date', type: 'date', required: true },
      { key: 'time', label: 'Time', type: 'time' },
      { key: 'location', label: 'Location', max: 160 },
      { key: 'description', label: 'Description', type: 'textarea', max: 2000 },
      { key: 'link', label: 'Registration or info link', type: 'url' },
      { key: 'image', label: 'Photo', type: 'image' }
    ],
    title: 'title', subtitle: 'date', thumb: 'image'
  },
  books: {
    label: 'Books',
    fields: [
      { key: 'title', label: 'Book title', required: true, max: 160 },
      { key: 'author', label: 'Author', required: true, max: 120 },
      { key: 'description', label: 'Short description', type: 'textarea', max: 800 },
      { key: 'genre', label: 'Genre', max: 60 },
      { key: 'year', label: 'Year', max: 10 },
      { key: 'link', label: 'Link to buy or read', type: 'url' },
      { key: 'image', label: 'Cover image', type: 'image' }
    ],
    title: 'title', subtitle: 'author', thumb: 'image'
  },
  gallery: {
    label: 'Photo gallery',
    fields: [
      { key: 'image', label: 'Photo', type: 'image', required: true },
      { key: 'caption', label: 'Caption', max: 200 }
    ],
    title: 'caption', thumb: 'image'
  },
  tiers: {
    label: 'Membership tiers',
    fields: [
      { key: 'name', label: 'Tier name', required: true, max: 60 },
      { key: 'price', label: 'Price', max: 60, help: 'For example: K500 per year' },
      { key: 'features', label: 'What is included', type: 'textarea', max: 1000, help: 'One item per line.' }
    ],
    title: 'name', subtitle: 'price'
  },
  team: {
    label: 'Leadership',
    fields: [
      { key: 'name', label: 'Name', required: true, max: 100 },
      { key: 'role', label: 'Role', max: 100 },
      { key: 'bio', label: 'Short bio', type: 'textarea', max: 600 },
      { key: 'image', label: 'Photo', type: 'image' }
    ],
    title: 'name', subtitle: 'role', thumb: 'image'
  },
  services: {
    label: 'Services',
    fields: [
      { key: 'title', label: 'Service name', required: true, max: 100 },
      { key: 'text', label: 'Description', type: 'textarea', max: 600 }
    ],
    title: 'title'
  },
  principles: {
    label: 'What we stand for', help: 'Shown on the About page.',
    fields: [
      { key: 'title', label: 'Heading', required: true, max: 60 },
      { key: 'text', label: 'Text', type: 'textarea', max: 400 }
    ],
    title: 'title', subtitle: 'text'
  }
};

// ---------- Validation (used by the server; safe to use in the browser) ----------

function checkValue(field, raw) {
  const type = field.type || 'text';
  if (type === 'toggle') return { value: raw === true || raw === 'true' ? 'true' : 'false' };

  let v = String(raw ?? '').trim();
  if (type === 'text' || type === 'email' || type === 'url') v = v.replace(/\s+/g, ' ');
  if (!v) return field.required ? { error: `${field.label} is required.` } : { value: '' };

  const bad = (msg) => ({ error: `${field.label}: ${msg}` });
  switch (type) {
    case 'date': {
      const date = new Date(v + 'T00:00:00Z');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== v) return bad('please choose a valid date.');
      break;
    }
    case 'time':
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(v)) return bad('please enter the time as HH:MM.');
      break;
    case 'url':
      try {
        if (!URL_PATTERN.test(v) || v.length > 500 || !new URL(v).hostname) return bad('links must start with http:// or https://');
      } catch { return bad('please enter a valid link.'); }
      break;
    case 'email':
      if (!EMAIL_PATTERN.test(v)) return bad('please enter a valid email address.');
      break;
    case 'image':
      if (!IMAGE_PATTERN.test(v)) return bad('invalid image.');
      break;
    case 'color':
      if (!COLOR_PATTERN.test(v)) return bad('please choose a colour.');
      return { value: v.toLowerCase() };
    case 'number': {
      const n = Number(v);
      if (!Number.isInteger(n) || n < field.min || n > field.max) return bad(`enter a whole number from ${field.min} to ${field.max}.`);
      return { value: String(n) };
    }
    case 'select':
      if (!field.options.some((o) => o.value === v)) return bad('please choose an option.');
      break;
    case 'layout': {
      const allowed = LAYOUTS[field.key].map((s) => s.key);
      const keys = v.split(',').map((k) => k.replace(/^-/, ''));
      if (keys.length !== allowed.length || !allowed.every((k) => keys.includes(k))) return bad('invalid layout.');
      break;
    }
  }
  if (field.max && v.length > field.max) return bad(`too long (${field.max} characters max).`);
  return { value: v };
}

// Returns { value } with every field cleaned, or { error } for the first problem.
export function validate(fields, body) {
  const value = {};
  for (const field of fields) {
    const result = checkValue(field, body?.[field.key]);
    if (result.error) return { error: result.error };
    value[field.key] = result.value;
  }
  return { value };
}

// "hero,-gallery,intro" -> [{ key: 'hero', visible: true }, { key: 'gallery', visible: false }, ...]
// Sections missing from a saved layout are appended so new sections always appear.
export function parseLayout(name, saved) {
  const sections = LAYOUTS[name];
  const parsed = String(saved || '').split(',').filter(Boolean)
    .map((k) => ({ key: k.replace(/^-/, ''), visible: !k.startsWith('-') }))
    .filter((s) => sections.some((d) => d.key === s.key));
  for (const s of sections) if (!parsed.some((p) => p.key === s.key)) parsed.push({ key: s.key, visible: true });
  return parsed.map((p) => ({ ...p, label: sections.find((d) => d.key === p.key).label }));
}

export function formatLayout(list) {
  return list.map((s) => (s.visible ? s.key : '-' + s.key)).join(',');
}
