// Content blocks used across pages. Each one gets its data and any labels as
// props, so the wording always comes from the Admin page.
import { ButtonLink, Prose } from './ui.jsx';

export function CardGrid({ items }) {
  if (!items.length) return null;
  return (
    <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <article key={item.id} className="border-t-2 border-accent pt-5">
          <h3 className="text-xl">{item.title}</h3>
          <Prose text={item.text} className="mt-2 text-muted" />
        </article>
      ))}
    </div>
  );
}

export function HighlightsBand({ items }) {
  if (!items.length) return null;
  return (
    <div className="bg-band text-on-band">
      <div className="mx-auto grid max-w-6xl sm:grid-cols-2 lg:grid-flow-col lg:auto-cols-fr lg:grid-cols-none">
        {items.map((item) => (
          <div key={item.id} className="border-on-band/15 px-4 py-8 sm:px-8 [&:not(:last-child)]:border-b sm:[&:not(:last-child)]:border-b-0 lg:[&:not(:last-child)]:border-r">
            <p className="font-display text-3xl text-band-accent">{item.value}</p>
            <p className="mt-1 font-sans text-sm opacity-85">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Gallery({ photos, style }) {
  if (!photos.length) return null;
  const featured = style === 'featured';
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {photos.map((photo, i) => {
        const big = featured && i === 0;
        return (
          <figure key={photo.id} className={`group relative overflow-hidden rounded-lg bg-card ${big ? 'aspect-[16/9] sm:col-span-2 lg:col-span-3' : 'aspect-[4/3]'}`}>
            <img src={photo.image} alt={photo.caption} loading={i === 0 ? 'eager' : 'lazy'}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
            {photo.caption && (
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 pb-3 pt-10 font-sans text-sm text-white">
                {photo.caption}
              </figcaption>
            )}
          </figure>
        );
      })}
    </div>
  );
}

// Covers without a photo get a coloured cover, cycling through the brand colours.
const COVER_TINTS = ['var(--brand-primary)', 'var(--brand-highlight)', 'color-mix(in oklab, var(--brand-accent) 70%, black)', 'color-mix(in oklab, var(--brand-primary) 60%, var(--brand-highlight))'];

export function BookGrid({ books, linkLabel }) {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
      {books.map((book, i) => (
        <article key={book.id} className="flex flex-col">
          <div className="aspect-[2/3] overflow-hidden rounded-r-md rounded-l-sm shadow-[-5px_5px_0_var(--line)]">
            {book.image ? (
              <img src={book.image} alt={book.title} loading="lazy" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full flex-col justify-between p-4 text-white" style={{ background: COVER_TINTS[i % COVER_TINTS.length] }}>
                <span className="font-display text-lg leading-tight">{book.title}</span>
                <span className="font-sans text-xs italic opacity-85">{book.author}</span>
              </div>
            )}
          </div>
          <h3 className="mt-4 text-lg">{book.title}</h3>
          <p className="font-sans text-sm text-muted">{[book.author, book.genre, book.year].filter(Boolean).join(' · ')}</p>
          <Prose text={book.description} className="mt-2 text-[0.95rem]" />
          {book.link && linkLabel && (
            <a href={book.link} target="_blank" rel="noopener noreferrer" className="mt-2 font-sans text-sm font-semibold text-highlight underline underline-offset-4">
              {linkLabel}
            </a>
          )}
        </article>
      ))}
    </div>
  );
}

function formatDate(iso, options) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, options);
}

export function EventList({ events, linkLabel, faded = false }) {
  return (
    <ul className={`divide-y divide-line border-y border-line ${faded ? 'opacity-75' : ''}`}>
      {events.map((event) => (
        <li key={event.id} className="grid gap-5 py-6 sm:grid-cols-[6rem_1fr_auto] sm:items-start">
          <time dateTime={event.date} className="flex items-baseline gap-2 font-sans sm:flex-col sm:gap-0">
            <span className="font-display text-4xl leading-none text-highlight">{formatDate(event.date, { day: 'numeric' })}</span>
            <span className="text-sm font-semibold uppercase tracking-wider text-muted">{formatDate(event.date, { month: 'short', year: 'numeric' })}</span>
          </time>
          <div>
            <h3 className="text-xl">{event.title}</h3>
            {(event.time || event.location) && (
              <p className="mt-1 font-sans text-sm text-muted">{[event.time, event.location].filter(Boolean).join(' · ')}</p>
            )}
            <Prose text={event.description} className="mt-2 max-w-2xl" />
            {event.link && linkLabel && (
              <a href={event.link} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block font-sans text-sm font-semibold text-highlight underline underline-offset-4">
                {linkLabel}
              </a>
            )}
          </div>
          {event.image && (
            <img src={event.image} alt={event.title} loading="lazy" className="aspect-[4/3] w-full rounded-lg object-cover sm:w-48" />
          )}
        </li>
      ))}
    </ul>
  );
}

export function TierGrid({ tiers }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {tiers.map((tier) => (
        <article key={tier.id} className="flex flex-col rounded-xl border border-line bg-card p-7">
          <h3 className="text-2xl">{tier.name}</h3>
          {tier.price && <p className="mt-2 font-display text-3xl text-highlight">{tier.price}</p>}
          <ul className="mt-5 space-y-2">
            {tier.features.split('\n').filter((f) => f.trim()).map((feature, i) => (
              <li key={i} className="flex gap-3">
                <span aria-hidden className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}

export function TeamGrid({ people }) {
  if (!people.length) return null;
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
      {people.map((person) => (
        <article key={person.id}>
          <div className="aspect-square max-w-48 overflow-hidden rounded-full bg-[linear-gradient(135deg,var(--brand-highlight),var(--brand-primary))]">
            {person.image ? (
              <img src={person.image} alt={person.name} loading="lazy" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full items-center justify-center font-display text-5xl text-white">{person.name.charAt(0)}</span>
            )}
          </div>
          <h3 className="mt-4 text-lg">{person.name}</h3>
          {person.role && <p className="font-sans text-sm text-muted">{person.role}</p>}
          <Prose text={person.bio} className="mt-2 text-[0.95rem]" />
        </article>
      ))}
    </div>
  );
}

export function CallToAction({ settings }) {
  const { ctaTitle, ctaText, ctaPrimaryLabel, ctaSecondaryLabel } = settings;
  if (!ctaTitle && !ctaText) return null;
  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-card px-6 py-12 sm:px-12">
      <div aria-hidden className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent/15" />
      <div className="relative max-w-2xl">
        {ctaTitle && <h2 className="text-3xl sm:text-4xl">{ctaTitle}</h2>}
        <Prose text={ctaText} className="mt-3 text-lg text-muted" />
        <div className="mt-7 flex flex-wrap gap-3">
          <ButtonLink to="/membership">{ctaPrimaryLabel}</ButtonLink>
          <ButtonLink to="/join" variant="outline">{ctaSecondaryLabel}</ButtonLink>
        </div>
      </div>
    </div>
  );
}
