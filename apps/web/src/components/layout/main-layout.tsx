import { Outlet } from 'react-router-dom';
import { Header } from './header';

export function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t py-6">
        <div className="container-wide text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Bibliology. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
