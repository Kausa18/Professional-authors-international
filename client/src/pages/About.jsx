import { parseLayout } from '../../../shared/content.js';
import { useContent, usePageTitle } from '../lib/content.jsx';
import { PageHero, Prose, Section, SectionHeading } from '../components/ui.jsx';
import { CallToAction, CardGrid, TeamGrid } from '../components/blocks.jsx';

function TextSection({ title, text }) {
  if (!text) return null;
  return (
    <Section className="pb-0 sm:pb-0">
      <div className="grid gap-4 lg:grid-cols-[1fr_2fr] lg:gap-16">
        {title && <h2 className="text-3xl sm:text-4xl">{title}</h2>}
        <Prose text={text} className="text-lg sm:text-xl" />
      </div>
    </Section>
  );
}

export default function About() {
  const { data } = useContent();
  const { settings } = data;
  usePageTitle(settings.aboutNav);

  const sections = {
    mission: () => <TextSection title={settings.missionTitle} text={settings.missionText} />,
    story: () => <TextSection title={settings.storyTitle} text={settings.storyText} />,
    principles: () => data.principles.length > 0 && (
      <Section>
        <SectionHeading title={settings.principlesTitle} />
        <CardGrid items={data.principles} />
      </Section>
    ),
    team: () => data.team.length > 0 && (
      <Section>
        <SectionHeading title={settings.teamTitle} />
        <TeamGrid people={data.team} />
      </Section>
    ),
    cta: () => <Section><CallToAction settings={settings} /></Section>
  };

  return (
    <>
      <PageHero eyebrow={settings.aboutEyebrow} title={settings.aboutTitle} intro={settings.aboutIntro} />
      {parseLayout('layoutAbout', settings.layoutAbout)
        .filter((s) => s.visible)
        .map((s) => <div key={s.key}>{sections[s.key]()}</div>)}
    </>
  );
}
