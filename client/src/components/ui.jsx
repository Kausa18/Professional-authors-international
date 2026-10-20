import { Link } from 'react-router';

export function Container({ className = '', children }) {
  return <div className={`mx-auto w-full max-w-6xl px-4 sm:px-8 ${className}`}>{children}</div>;
}

export function Section({ className = '', children, ...props }) {
  return (
    <section className={`py-14 sm:py-20 ${className}`} {...props}>
      <Container>{children}</Container>
    </section>
  );
}

export function Eyebrow({ children }) {
  if (!children) return null;
  return <p className="mb-3 font-sans text-xs font-bold uppercase tracking-[0.18em] text-highlight">{children}</p>;
}

export function SectionHeading({ title, intro, children }) {
  if (!title && !intro && !children) return null;
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4 sm:mb-10">
      <div className="max-w-2xl">
        {title && <h2 className="text-3xl sm:text-4xl">{title}</h2>}
        {intro && <p className="mt-3 text-lg text-muted">{intro}</p>}
      </div>
      {children}
    </div>
  );
}

const BUTTON = {
  base: 'inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 font-sans text-sm font-semibold transition-colors',
  primary: 'bg-primary text-on-primary hover:bg-[color-mix(in_oklab,var(--primary)_85%,var(--ink))]',
  outline: 'border border-ink/25 text-ink hover:border-ink hover:bg-ink/5'
};

export function ButtonLink({ to, variant = 'primary', className = '', children }) {
  if (!children) return null;
  return <Link to={to} className={`${BUTTON.base} ${BUTTON[variant]} ${className}`}>{children}</Link>;
}

export function Button({ variant = 'primary', className = '', ...props }) {
  return <button className={`${BUTTON.base} ${BUTTON[variant]} disabled:opacity-60 ${className}`} {...props} />;
}

// Text typed in the admin keeps its line breaks.
export function Prose({ text, className = '' }) {
  if (!text) return null;
  return <p className={`whitespace-pre-line ${className}`}>{text}</p>;
}

export function PageHero({ eyebrow, title, intro }) {
  return (
    <div className="border-b border-line bg-[radial-gradient(ellipse_at_top_right,color-mix(in_oklab,var(--accent)_14%,transparent),transparent_60%)]">
      <Container className="py-16 sm:py-24">
        <Eyebrow>{eyebrow}</Eyebrow>
        {title && <h1 className="max-w-3xl text-4xl sm:text-6xl">{title}</h1>}
        <Prose text={intro} className="mt-5 max-w-2xl text-lg text-muted sm:text-xl" />
      </Container>
    </div>
  );
}
