// Starting content, written to the database the first time the site runs.
// After that, everything is edited from the Admin page; changing this file
// does not change a site that has already been set up.

export const SETTING_DEFAULTS = {
  siteName: 'Professional Authors Zambia',
  shortName: 'PAZ',
  tagline: 'Quality Books, Improved Reading Culture',
  metaDescription: 'Professional Authors Zambia supports writers across Zambia to publish quality books and grow a stronger reading culture.',
  footerText: 'Professional Authors Zambia. All rights reserved.',
  notFoundTitle: 'Page not found',
  notFoundText: 'The page you are looking for does not exist or has moved.',
  notFoundLink: 'Back to the home page',

  colorPrimary: '#14213a',
  colorAccent: '#b8862b',
  colorHighlight: '#2e7d4f',
  galleryStyle: 'featured',
  homeBooksCount: '4',
  homeEventsCount: '3',
  showPastEvents: 'true',

  contactEmail: '',
  contactPhone: '',
  address: '',
  facebookUrl: '',
  instagramUrl: '',

  layoutHome: 'hero,highlights,gallery,intro,events,books,cta',
  heroEyebrow: 'Quality Books, Improved Reading Culture',
  heroTitle: 'A professional home for Zambian authors.',
  heroText: 'Professional Authors Zambia brings writers together to sharpen their craft, publish with confidence, and put good books into the hands of readers.',
  heroPrimaryLabel: 'Become a member',
  heroSecondaryLabel: 'About us',
  galleryTitle: 'Our graduation dinner',
  galleryIntro: 'Members and guests at our recent graduation dinner.',
  introTitle: 'Supporting authors at every stage',
  introText: 'We support published and emerging authors from the first manuscript to editing, publishing, and reaching readers at home and abroad.',
  introLinkLabel: 'Our story',
  eventsPreviewTitle: 'Upcoming events',
  eventsPreviewLinkLabel: 'All events',
  booksTitle: 'Books by our members',
  booksIntro: 'Recent titles from authors in our community.',
  booksLinkLabel: 'See all books',
  ctaTitle: 'Become part of the community',
  ctaText: 'Join authors across Zambia who are building a stronger reading culture.',
  ctaPrimaryLabel: 'See membership',
  ctaSecondaryLabel: 'Get in touch',

  layoutAbout: 'mission,story,principles,team,cta',
  aboutNav: 'About',
  aboutEyebrow: 'About us',
  aboutTitle: 'Quality books and a stronger reading culture.',
  aboutIntro: 'Professional Authors Zambia connects writers so they can grow their craft, protect their work, and reach more readers.',
  missionTitle: 'Our mission',
  missionText: 'To promote quality books and an improved reading culture in Zambia by supporting authors at every stage of their careers: sharing knowledge, opening doors to publishers and readers, and giving writers a strong voice as a community.',
  storyTitle: 'Our story',
  storyText: '',
  principlesTitle: 'What we stand for',
  teamTitle: 'Our leadership',

  servicesNav: 'Services',
  servicesEyebrow: 'Services',
  servicesTitle: 'What members get',
  servicesIntro: "Support for every stage of an author's career.",

  booksNav: 'Books',
  booksEyebrow: 'Books',
  booksPageTitle: 'Books by our members',
  booksPageIntro: 'Titles from authors in our community.',
  booksEmpty: 'Books from our members will appear here soon.',
  bookLinkLabel: 'Buy or read',

  membershipNav: 'Membership',
  membershipEyebrow: 'Membership',
  membershipTitle: 'Choose how you want to belong',
  membershipIntro: 'Ways to join, whether you are starting out or already published.',
  membershipEmpty: 'Membership options will be announced soon.',
  membershipJoinLabel: 'Join now',

  eventsNav: 'Events',
  eventsEyebrow: 'Events',
  eventsTitle: 'Workshops, launches, and gatherings',
  eventsIntro: 'Meet other authors and readers in person and online.',
  upcomingTitle: 'Upcoming events',
  pastTitle: 'Past events',
  eventsEmpty: 'No upcoming events yet. Please check back soon.',
  eventLinkLabel: 'More information',

  joinNav: 'Join',
  joinEyebrow: 'Join',
  joinTitle: 'Join the community',
  joinIntro: 'Leave your details and we will send you membership information.',
  joinNameLabel: 'Full name',
  joinEmailLabel: 'Email',
  joinPhoneLabel: 'Phone (optional)',
  joinGenreLabel: 'Genre or pen name (optional)',
  joinMessageLabel: 'Message (optional)',
  joinButton: 'Request information',
  joinSuccess: 'Thank you! We will be in touch soon.',
  joinContactTitle: 'Contact us'
};

// Image files in server/seed/images that are uploaded to the database on first run.
export const SEED_LOGO = 'logo.png';

export const COLLECTION_SEEDS = {
  highlights: [
    { value: 'Every genre', label: 'Fiction, nonfiction, poetry, and children’s books' },
    { value: 'Monthly', label: 'Workshops and author talks' },
    { value: 'Nationwide', label: 'Members across Zambia and online' }
  ],
  gallery: [
    { image: 'graduation-dinner-group.jpg', caption: 'Guests at the graduation dinner' },
    { image: 'graduation-dinner-speech.jpg', caption: 'A speech during the dinner' },
    { image: 'graduation-dinner-welcome.jpg', caption: 'Guests being welcomed' },
    { image: 'graduation-dinner-guest.jpg', caption: 'A guest at the dinner' }
  ],
  tiers: [
    { name: 'Emerging', price: '', features: 'Writing circles\nMonthly workshop\nResource library' },
    { name: 'Professional', price: '', features: 'Everything in Emerging\nMember directory profile\nPublishing and contract clinics' },
    { name: 'Patron', price: '', features: 'Everything in Professional\nSponsor a young writer\nInvitation to the annual gathering' }
  ],
  services: [
    { title: 'Workshops and critique', text: 'Genre groups and live sessions led by published authors.' },
    { title: 'Publishing guidance', text: 'Plain advice on editing, publishers, self-publishing, contracts, and royalties.' },
    { title: 'Book launches and fairs', text: 'Help showcasing your books at launches, book fairs, and school visits.' },
    { title: 'Member directory', text: 'A public author profile with your books, bio, and links.' }
  ],
  principles: [
    { title: 'Quality', text: 'Good books are written, edited, and refined with care.' },
    { title: 'Reading culture', text: 'We work to put good books in the hands of readers of every age.' },
    { title: 'Fairness', text: 'Authors deserve clear contracts and fair pay for their work.' },
    { title: 'Community', text: 'Writers do their best work when other writers support them.' }
  ]
};
