import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router';
import { PAGES } from '../../shared/content.js';
import { ContentProvider } from './lib/content.jsx';
import SiteLayout from './components/SiteLayout.jsx';
import Home from './pages/Home.jsx';
import About from './pages/About.jsx';
import Join from './pages/Join.jsx';
import { Books, Events, Membership, NotFound, Services } from './pages/ListPages.jsx';
import StatusScreen from './components/StatusScreen.jsx';

// Visitors never download the admin code unless they open /admin.
const Admin = lazy(() => import('./pages/admin/Admin.jsx'));

const PAGE_COMPONENTS = { about: About, services: Services, books: Books, membership: Membership, events: Events, join: Join };

export default function App() {
  return (
    <ContentProvider>
      <Routes>
        <Route element={<SiteLayout />}>
          <Route index element={<Home />} />
          {PAGES.map(({ key, path }) => {
            const Page = PAGE_COMPONENTS[key];
            return <Route key={key} path={path} element={<Page />} />;
          })}
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="/admin" element={<Suspense fallback={<StatusScreen label="Loading the admin…" />}><Admin /></Suspense>} />
      </Routes>
    </ContentProvider>
  );
}
