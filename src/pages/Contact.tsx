import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import GlassCard from '@/components/GlassCard';
import { motion } from 'framer-motion';
import { Mail, Send, CheckCircle2 } from 'lucide-react';

export default function Contact() {
  const { t, lang } = useApp();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = `mailto:evodahilian5@gmail.com?subject=${encodeURIComponent(form.subject)}&body=${encodeURIComponent(`De: ${form.name} (${form.email})\n\n${form.message}`)}`;
    setSent(true);
  };

  const inputClass = "w-full px-4 py-3 rounded-xl bg-background/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-green-accent/50 transition-all";

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-green-gradient mx-auto mb-4 flex items-center justify-center">
              <Mail className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-black text-foreground mb-2">{t('contact.title')}</h1>
            <p className="text-muted-foreground">evodahilian5@gmail.com</p>
          </div>

          {sent ? (
            <GlassCard variant="strong" className="text-center py-12">
              <CheckCircle2 className="w-16 h-16 text-green-accent mx-auto mb-4" />
              <p className="text-lg font-bold text-foreground">{lang === 'fr' ? 'Message envoyé !' : 'Message sent!'}</p>
            </GlassCard>
          ) : (
            <GlassCard variant="strong">
              <form onSubmit={handleSubmit} className="space-y-4">
                <input type="text" placeholder={t('auth.name')} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className={inputClass} required />
                <input type="email" placeholder={t('auth.email')} value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className={inputClass} required />
                <input type="text" placeholder={t('contact.subject')} value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} className={inputClass} required />
                <textarea rows={5} placeholder={t('contact.message')} value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} className={`${inputClass} resize-none`} required />
                <button type="submit" className="w-full py-3 rounded-xl text-sm font-bold bg-green-gradient text-primary-foreground hover:opacity-90 transition-all flex items-center justify-center gap-2">
                  <Send className="w-4 h-4" /> {t('contact.send')}
                </button>
              </form>
            </GlassCard>
          )}
        </motion.div>
      </div>
    </div>
  );
}
