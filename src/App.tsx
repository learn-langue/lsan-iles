import { useEffect } from 'react';
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { LANG_META } from './content';
import { useApp } from './store/useApp';
import { Layout } from './components/Layout';
import { LanguagePicker } from './features/home/LanguagePicker';
import { Welcome } from './features/home/Welcome';
import { Dashboard } from './features/home/Dashboard';
import { Path } from './features/path/Path';
import { LessonPlayer } from './features/lesson/LessonPlayer';
import { Review } from './features/srs/Review';
import { Sprint } from './features/sprint/Sprint';
import { Settings } from './features/settings/Settings';
import { TestsHome } from './features/tests/TestsHome';
import { TestRunner } from './features/tests/TestRunner';
import { Tutor } from './features/chat/Tutor';

function ReviewRoute() {
  const loc = useLocation();
  return <Review key={loc.search} />;
}

function Themed() {
  const lang = useApp((s) => s.activeLang);
  useEffect(() => {
    document.body.className = lang ? `theme-${LANG_META[lang].color}` : 'theme-dz';
  }, [lang]);
  if (!lang) {
    return (
      <Routes>
        <Route path="*" element={<LanguagePicker />} />
      </Routes>
    );
  }
  return (
    <Routes>
      <Route path="/langue" element={<LanguagePicker />} />
      <Route path="/bienvenue" element={<Welcome />} />
      <Route path="/lecon/:id" element={<LessonPlayer />} />
      <Route path="/tests/positionnement" element={<TestRunner kind="placement" />} />
      <Route path="/tests/examen/:level" element={<TestRunner kind="exam" />} />
      <Route path="/tests/bilan" element={<TestRunner kind="checkup" />} />
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="/parcours" element={<Path />} />
        <Route path="/reviser" element={<ReviewRoute />} />
        <Route path="/sprint" element={<Sprint />} />
        <Route path="/tests" element={<TestsHome />} />
        <Route path="/tuteur" element={<Tutor />} />
        <Route path="/reglages" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export function App() {
  return (
    <HashRouter>
      <Themed />
    </HashRouter>
  );
}
