import { parseLayout } from '../../../shared/content.js';
import { useContent, usePageTitle, today } from '../lib/content.jsx';
import { ButtonLink, Container, Eyebrow, Prose, Section, SectionHeading } from '../components/ui.jsx';
import { BookGrid, CallToAction, EventList, Gallery, HighlightsBand } from '../components/blocks.jsx';

function Hero({ settings }) {
  return (
    <div className="overflow-hidden border-b border-line bg-[radial-gradient(ellipse_at_80%_20%,color-mix(in_oklab,var(--accent)_18%,transparent),transparent_55%)]">
      <Container className="grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <Eyebrow>{settings.heroEyebrow}</Eyebrow>
          {settings.heroTitle && <h1 className="text-[2.6rem] leading-[1.05] sm:text-6xl lg:text-7xl">{settings.heroTitle}</h1>}
          <Prose text={settings.heroText} className="mt-6 max-w-xl text-lg text-muted sm:text-xl" />
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink to="/membership">{settings.heroPrimaryLabel}</ButtonLink>
            <ButtonLink to="/about" variant="outline">{settings.heroSecondaryLabel}</ButtonLink>
          </div>
        </div>
        {settings.logo && (
          <div className="relative mx-auto w-64 sm:w-80 lg:w-full lg:max-w-sm">
            <div aria-hidden className="absolute inset-[8%] rounded-full bg-accent/25 blur-3xl" />
            <img src={settings.logo} alt={settings.siteName} className="relative w-full drop-shadow-xl" />
          </div>
        )}
      </Container>
    </div>
  );
}

export default function Home() {
  const { data } = useContent();
  const { settings } = data;
  usePageTitle('');

  const upcoming = data.events.filter((e) => e.date >= today()).slice(0, Number(settings.homeEventsCount));
  const books = data.books.slice(0, Number(settings.homeBooksCount));

  const sections = {
    hero: () => <Hero settings={settings} />,
    highlights: () => <HighlightsBand items={data.highlights} />,
    gallery: () => data.gallery.length > 0 && (
      <Section>
        <SectionHeading title={settings.galleryTitle} intro={settings.galleryIntro} />
        <Gallery photos={data.gallery} style={settings.galleryStyle} />
      </Section>
    ),
    intro: () => (settings.introTitle || settings.introText) && (
      <Section>
        <div className="grid gap-6 border-l-4 border-accent pl-6 sm:pl-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-3xl">
            {settings.introTitle && <h2 className="text-3xl sm:text-4xl">{settings.introTitle}</h2>}
            <Prose text={settings.introText} className="mt-4 text-lg" />
          </div>
          <ButtonLink to="/about" variant="outline">{settings.introLinkLabel}</ButtonLink>
        </div>
      </Section>
    ),
    events: () => upcoming.length > 0 && (
      <Section>
        <SectionHeading title={settings.eventsPreviewTitle}>
          <ButtonLink to="/events" variant="outline">{settings.eventsPreviewLinkLabel}</ButtonLink>
        </SectionHeading>
        <EventList events={upcoming} linkLabel={settings.eventLinkLabel} />
      </Section>
    ),
    books: () => books.length > 0 && (
      <Section>
        <SectionHeading title={settings.booksTitle} intro={settings.booksIntro}>
          <ButtonLink to="/books" variant="outline">{settings.booksLinkLabel}</ButtonLink>
        </SectionHeading>
        <BookGrid books={books} linkLabel={settings.bookLinkLabel} />
      </Section>
    ),
    cta: () => <Section><CallToAction settings={settings} /></Section>
  };

  return parseLayout('layoutHome', settings.layoutHome)
    .filter((s) => s.visible)
    .map((s) => <div key={s.key}>{sections[s.key]()}</div>);
}
