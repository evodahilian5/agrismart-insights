import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Leaf, Menu, X, Globe } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const { user, lang, setLang, logout, t } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = user ? [
    { to: '/dashboard', label: t('nav.dashboard') },
    { to: '/analysis', label: t('nav.analysis') },
    { to: '/market', label: t('nav.market') },
    { to: '/about', label: t('nav.about') },
    { to: '/contact', label: t('nav.contact') },
  ] : [
    { to: '/about', label: t('nav.about') },
    { to: '/contact', label: t('nav.contact') },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-green-gradient flex items-center justify-center">
              <Leaf className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-primary-foreground tracking-tight">
              Agri<span className="text-gradient">Smart</span>Connect
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {links.map(l => (
              <Link
                key={l.to}
                to={l.to}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive(l.to)
                    ? 'bg-primary/20 text-primary-foreground'
                    : 'text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/5'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-primary-foreground/70 hover:text-primary-foreground transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              {lang === 'fr' ? 'EN' : 'FR'}
            </button>
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-primary-foreground/70">{user.name}</span>
                <button onClick={() => { logout(); navigate('/'); }} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 transition-colors">
                  {t('nav.logout')}
                </button>
              </div>
            ) : (
              <Link to="/auth" className="px-4 py-2 rounded-xl text-sm font-semibold bg-green-gradient text-primary-foreground hover:opacity-90 transition-opacity">
                {t('nav.login')}
              </Link>
            )}
          </div>

          <button className="md:hidden text-primary-foreground" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass-dark border-t border-primary-foreground/10"
          >
            <div className="px-4 py-3 space-y-1">
              {links.map(l => (
                <Link key={l.to} to={l.to} onClick={() => setMenuOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-sm font-medium ${isActive(l.to) ? 'bg-primary/20 text-primary-foreground' : 'text-primary-foreground/70'}`}>
                  {l.label}
                </Link>
              ))}
              <div className="flex items-center gap-3 pt-2">
                <button onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')} className="text-xs text-primary-foreground/70">
                  <Globe className="w-4 h-4 inline mr-1" />{lang === 'fr' ? 'EN' : 'FR'}
                </button>
                {user ? (
                  <button onClick={() => { logout(); navigate('/'); setMenuOpen(false); }} className="text-xs text-primary-foreground/70">{t('nav.logout')}</button>
                ) : (
                  <Link to="/auth" onClick={() => setMenuOpen(false)} className="px-3 py-1.5 rounded-lg text-xs bg-green-gradient text-primary-foreground">{t('nav.login')}</Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
