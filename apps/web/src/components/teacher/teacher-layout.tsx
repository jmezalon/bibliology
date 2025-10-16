import { Outlet } from 'react-router-dom';

import { TeacherSidebar } from './sidebar';

export function TeacherLayout() {
  return (
    <div className="min-h-screen flex">
      <TeacherSidebar />

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
