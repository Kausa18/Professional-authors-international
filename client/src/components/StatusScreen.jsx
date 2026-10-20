import { Button, Container } from './ui.jsx';

export default function StatusScreen({ error, onRetry, label = 'Loading the website…' }) {
  return (
    <Container className="flex min-h-[65vh] items-center justify-center py-20 font-sans">
      <div className="w-full max-w-md rounded-2xl border border-line bg-card p-8 text-center shadow-sm" aria-busy={!error}>
        {error ? (
          <>
            <span aria-hidden className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-danger/10 text-2xl text-danger">!</span>
            <h1 className="text-2xl">Unable to load the website</h1>
            <p role="alert" className="mt-3 text-sm text-muted">{error}</p>
            <Button className="mt-6" onClick={onRetry}>Try again</Button>
          </>
        ) : (
          <>
            <span aria-hidden className="mx-auto mb-5 block h-9 w-9 animate-spin rounded-full border-2 border-line border-t-highlight" />
            <p role="status" className="text-sm text-muted">{label}</p>
          </>
        )}
      </div>
    </Container>
  );
}
