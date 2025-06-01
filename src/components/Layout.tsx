import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';

const Layout: React.FC = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 p-4 md:p-6">
        <div className="mx-auto max-w-4xl">
          <Outlet />
        </div>
      </main>
      <footer className="border-t border-muted/20 py-4 text-center text-sm text-muted">
        <p>© {new Date().getFullYear()} 短信转发系统 | 使用 Cloudflare 技术构建</p>
      </footer>
    </div>
  );
};

export default Layout;