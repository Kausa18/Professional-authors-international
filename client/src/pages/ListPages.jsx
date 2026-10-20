// The simpler pages: a heading followed by one list from the Admin page.
import { useContent, usePageTitle, today } from '../lib/content.jsx';
import { ButtonLink, PageHero, Section, SectionHeading } from '../components/ui.jsx';
import { BookGrid, CardGrid, EventList, TierGrid } from '../components/blocks.jsx';

function Empty({ text }) {
  return text ? <p className="font-sans text-muted">{text}</p> : null;
}

export function Services() {
  const { data: { settings, services } } = useContent();
  usePageTitle(settings.servicesNav);
  return (
    <>
      <PageHero eyebrow={settings.servicesEyebrow} title={settings.servicesTitle} intro={settings.servicesIntro} />
      <Section><CardGrid items={services} /></Section>
    </>
  );
}

export function Books() {
  const { data: { settings, books } } = useContent();
  usePageTitle(settings.booksNav);
  return (
    <>
      <PageHero eyebrow={settings.booksEyebrow} title={settings.booksPageTitle} intro={settings.booksPageIntro} />
      <Section>
        {books.length ? <BookGrid books={books} linkLabel={settings.bookLinkLabel} /> : <Empty text={settings.booksEmpty} />}
      </Section>
    </>
  );
}

export function Membership() {
  const { data: { settings, tiers } } = useContent();
  usePageTitle(settings.membershipNav);
  return (
    <>
      <PageHero eyebrow={settings.membershipEyebrow} title={settings.membershipTitle} intro={settings.membershipIntro} />
      <Section>
        {tiers.length ? <TierGrid tiers={tiers} /> : <Empty text={settings.membershipEmpty} />}
        <div className="mt-10"><ButtonLink to="/join">{settings.membershipJoinLabel}</ButtonLink></div>
      </Section>
    </>
  );
}

export function Events() {
  const { data: { settings, events } } = useContent();
  usePageTitle(settings.eventsNav);
  const now = today();
  const upcoming = events.filter((e) => e.date >= now);
  const past = settings.showPastEvents === 'true' ? events.filter((e) => e.date < now).reverse() : [];
  return (
    <>
      <PageHero eyebrow={settings.eventsEyebrow} title={settings.eventsTitle} intro={settings.eventsIntro} />
      <Section>
        <SectionHeading title={settings.upcomingTitle} />
        {upcoming.length ? <EventList events={upcoming} linkLabel={settings.eventLinkLabel} /> : <Empty text={settings.eventsEmpty} />}
      </Section>
      {past.length > 0 && (
        <Section className="pt-0 sm:pt-0">
          <SectionHeading title={settings.pastTitle} />
          <EventList events={past} linkLabel={settings.eventLinkLabel} faded />
        </Section>
      )}
    </>
  );
}

export function NotFound() {
  const { data: { settings } } = useContent();
  usePageTitle(settings.notFoundTitle);
  return (
    <>
      <PageHero title={settings.notFoundTitle} intro={settings.notFoundText} />
      <Section><ButtonLink to="/">{settings.notFoundLink}</ButtonLink></Section>
    </>
  );
}
