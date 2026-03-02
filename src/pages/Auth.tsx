import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { motion } from 'framer-motion';
import { Leaf, Eye, EyeOff } from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import heroImg from '@/assets/hero-farm.jpg';

export default function Auth() {
  const { login, t } = useApp();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const defaultRole = params.get('role') as 'farmer' | 'company' | null;

  const [isLogin, setIsLogin] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', password: '', country: '',
    role: defaultRole || 'farmer' as 'farmer' | 'company',
    company_name: '', crop_needed: '', volume: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = {
      id: crypto.randomUUID(),
      name: form.name || form.email.split('@')[0],
      email: form.email,
      role: form.role as 'farmer' | 'company',
      country: form.country,
      company_name: form.company_name || undefined,
      crop_needed: form.crop_needed || undefined,
      volume: form.volume ? Number(form.volume) : undefined,
    };
    login(user);
    navigate(form.role === 'farmer' ? '/analysis' : '/dashboard');
  };

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const inputClass = "w-full px-4 py-3 rounded-xl bg-background/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-green-accent/50 transition-all";

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      <img src={heroImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-hero-gradient" />

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-md mx-4 mt-20">
        <GlassCard variant="strong" className="p-8">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-green-gradient flex items-center justify-center">
              <Leaf className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">AgriSmartConnect</span>
          </div>

          <h2 className="text-2xl font-bold text-center text-foreground mb-6">
            {isLogin ? t('auth.login') : t('auth.signup')}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="flex gap-2 p-1 rounded-xl bg-secondary">
                  {(['farmer', 'company'] as const).map(r => (
                    <button key={r} type="button" onClick={() => update('role', r)}
                      className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${form.role === r ? 'bg-green-gradient text-primary-foreground shadow-md' : 'text-muted-foreground'}`}>
                      {t(`auth.${r}`)}
                    </button>
                  ))}
                </div>

                <input type="text" placeholder={form.role === 'company' ? t('auth.company_name') : t('auth.name')}
                  value={form.name} onChange={e => update('name', e.target.value)} className={inputClass} required />
              </>
            )}

            <input type="email" placeholder={t('auth.email')} value={form.email} onChange={e => update('email', e.target.value)} className={inputClass} required />

            <div className="relative">
              <input type={showPw ? 'text' : 'password'} placeholder={t('auth.password')}
                value={form.password} onChange={e => update('password', e.target.value)} className={inputClass} required />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {!isLogin && (
              <>
                <input type="text" placeholder={t('auth.country')} value={form.country} onChange={e => update('country', e.target.value)} className={inputClass} />
                {form.role === 'company' && (
                  <>
                    <input type="text" placeholder={t('auth.crop_needed')} value={form.crop_needed} onChange={e => update('crop_needed', e.target.value)} className={inputClass} />
                    <input type="number" placeholder={t('auth.volume')} value={form.volume} onChange={e => update('volume', e.target.value)} className={inputClass} />
                  </>
                )}
              </>
            )}

            <button type="submit" className="w-full py-3 rounded-xl text-base font-bold bg-green-gradient text-primary-foreground hover:opacity-90 transition-all shadow-lg">
              {isLogin ? t('auth.login') : t('auth.signup')}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-4">
            {isLogin ? t('auth.no_account') : t('auth.has_account')}{' '}
            <button onClick={() => setIsLogin(!isLogin)} className="text-green-accent font-semibold hover:underline">
              {isLogin ? t('auth.signup') : t('auth.login')}
            </button>
          </p>
        </GlassCard>
      </motion.div>
    </div>
  );
}
