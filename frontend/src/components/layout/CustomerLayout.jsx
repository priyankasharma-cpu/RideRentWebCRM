import { Header } from './Header.jsx';
import { Outlet } from 'react-router-dom';
import { Footer } from './Footer.jsx';
import { MobileCallBar } from './MobileCallBar.jsx';
export function CustomerLayout() {
  return (
    <>
      <Header />
      <Outlet />
      <Footer />
      <MobileCallBar />
    </>
  );
}
