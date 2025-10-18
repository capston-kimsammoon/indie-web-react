import { Routes, Route } from 'react-router-dom';
import routes from './routes';
import ScrollToTop from './components/layout/ScrollToTop';
import BottomNav from "./components/layout/BottomNav";
import  { Toaster } from 'react-hot-toast';

function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {routes.map(({ path, element }, idx) => (
          <Route key={idx} path={path} element={element} />
        ))}
      </Routes>
      <Toaster />
      <BottomNav />
    </>
  );
}

export default App;