import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, MessageCircle, User, Video, Search, Plus, Heart, MessageSquare, Share2, Bookmark, MoreHorizontal, MapPin, X, Send, Loader2, ImagePlus } from 'lucide-react';

type Tab = 'home' | 'messages' | 'profile' | 'videos' | 'search';
type PostType = 'harvest' | 'sale' | 'buyer' | 'innovation';

interface Post {
  id: string;
  author_name: string;
  author_role: string;
  author_location: string;
  author_avatar: string;
  type: PostType;
  image_url: string | null;
  description: string;
  hashtags: string[];
  likes_count: number;
  comments_count: number;
  created_at: string;
  sale_crop: string | null;
  sale_volume: string | null;
  sale_price: string | null;
  liked?: boolean;
  saved?: boolean;
}

const TYPE_COLORS: Record<PostType, string> = {
  harvest: 'bg-green-accent/20 text-green-accent',
  sale: 'bg-gold/20 text-gold',
  buyer: 'bg-blue-500/20 text-blue-500',
  innovation: 'bg-purple-500/20 text-purple-500',
};

const TYPE_LABELS: Record<PostType, Record<string, string>> = {
  harvest: { fr: 'Récolte', en: 'Harvest' },
  sale: { fr: 'Vente', en: 'Sale' },
  buyer: { fr: 'Acheteur', en: 'Buyer' },
  innovation: { fr: 'Innovation', en: 'Innovation' },
};

function timeAgo(dateStr: string, lang: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}${lang === 'fr' ? 'j' : 'd'}`;
}

function BottomTabBar({ tab, setTab, lang }: { tab: Tab; setTab: (t: Tab) => void; lang: string }) {
  const tabs: { key: Tab; icon: typeof Home; label: string }[] = [
    { key: 'home', icon: Home, label: lang === 'fr' ? 'Accueil' : 'Home' },
    { key: 'search', icon: Search, label: lang === 'fr' ? 'Rechercher' : 'Search' },
    { key: 'videos', icon: Video, label: lang === 'fr' ? 'Vidéos' : 'Videos' },
    { key: 'messages', icon: MessageCircle, label: 'Messages' },
    { key: 'profile', icon: User, label: lang === 'fr' ? 'Profil' : 'Profile' },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="liquid-glass rounded-[22px] px-2 py-1.5 flex items-center gap-0.5">
        {tabs.map(tb => {
          const Icon = tb.icon;
          const active = tab === tb.key;
          return (
            <button
              key={tb.key}
              onClick={() => setTab(tb.key)}
              className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-2xl text-[10px] font-medium transition-all duration-300 ${
                active
                  ? 'bg-primary/20 text-primary-foreground shadow-sm'
                  : 'text-primary-foreground/50 hover:text-primary-foreground/80'
              }`}
            >
              <Icon className={`w-[18px] h-[18px] transition-transform duration-300 ${active ? 'scale-110' : ''}`} />
              <span>{tb.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PostCard({ post, lang, onLike, onSave }: { post: Post; lang: string; onLike: () => void; onSave: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="liquid-glass-card rounded-3xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full liquid-glass flex items-center justify-center text-lg">{post.author_avatar}</div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">{post.author_name}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${TYPE_COLORS[post.type]}`}>
                  {TYPE_LABELS[post.type]?.[lang] || post.type}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3" /> {post.author_location}
              </div>
            </div>
          </div>
          <button className="text-muted-foreground hover:text-foreground"><MoreHorizontal className="w-5 h-5" /></button>
        </div>

        {/* Image */}
        {post.image_url && (
          <div className="relative aspect-[4/5] bg-secondary">
            <img src={post.image_url} alt="" className="w-full h-full object-cover" loading="lazy" />
          </div>
        )}

        {/* Sale info */}
        {post.sale_crop && (
          <div className="mx-4 mt-3 p-3 rounded-2xl liquid-glass-card">
            <div className="grid grid-cols-3 gap-2 text-xs mb-2">
              <div><span className="text-muted-foreground">{lang === 'fr' ? 'Culture' : 'Crop'}</span><div className="font-bold text-foreground">{post.sale_crop}</div></div>
              <div><span className="text-muted-foreground">Volume</span><div className="font-bold text-foreground">{post.sale_volume}</div></div>
              <div><span className="text-muted-foreground">{lang === 'fr' ? 'Prix' : 'Price'}</span><div className="font-bold text-foreground">{post.sale_price}</div></div>
            </div>
            <button className="w-full py-2 rounded-xl text-xs font-bold bg-green-gradient text-primary-foreground">
              {lang === 'fr' ? 'Intéressé' : 'Interested'}
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <button onClick={onLike} className="flex items-center gap-1 text-sm">
              <Heart className={`w-5 h-5 transition-all ${post.liked ? 'fill-destructive text-destructive scale-110' : 'text-foreground'}`} />
              <span className="text-muted-foreground">{post.likes_count}</span>
            </button>
            <button className="flex items-center gap-1 text-sm text-foreground">
              <MessageSquare className="w-5 h-5" />
              <span className="text-muted-foreground">{post.comments_count}</span>
            </button>
            <button className="text-foreground"><Share2 className="w-5 h-5" /></button>
          </div>
          <button onClick={onSave}>
            <Bookmark className={`w-5 h-5 transition-all ${post.saved ? 'fill-foreground text-foreground' : 'text-foreground'}`} />
          </button>
        </div>

        {/* Description */}
        <div className="px-4 pb-4">
          <p className="text-sm text-foreground">{post.description}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {post.hashtags?.map(h => (
              <span key={h} className="text-xs text-green-accent">#{h}</span>
            ))}
          </div>
          <span className="text-xs text-muted-foreground mt-1 block">{timeAgo(post.created_at, lang)}</span>
        </div>
      </div>
    </motion.div>
  );
}

export default function Market() {
  const { t, user, lang } = useApp();
  const [tab, setTab] = useState<Tab>('home');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newPost, setNewPost] = useState({ description: '', type: 'harvest' as PostType, image_url: '' });
  const [publishing, setPublishing] = useState(false);

  // Fetch real posts
  useEffect(() => {
    fetchPosts();
    const channel = supabase
      .channel('market_posts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'market_posts' }, () => fetchPosts())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('market_posts')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) {
      setPosts(data.map(p => ({ ...p, type: p.type as PostType, hashtags: p.hashtags || [], liked: false, saved: false })));
    }
    setLoading(false);
  };

  const createPost = async () => {
    if (!user || !newPost.description.trim()) return;
    setPublishing(true);
    const hashtags = newPost.description.match(/#(\w+)/g)?.map(h => h.slice(1)) || [];
    await supabase.from('market_posts').insert({
      user_id: user.id,
      author_name: user.name,
      author_role: user.role,
      author_location: user.country || '',
      author_avatar: user.role === 'farmer' ? '👨🏾‍🌾' : '👩🏾‍💼',
      type: newPost.type,
      image_url: newPost.image_url || null,
      description: newPost.description.replace(/#\w+/g, '').trim(),
      hashtags,
    });
    setNewPost({ description: '', type: 'harvest', image_url: '' });
    setShowCreate(false);
    setPublishing(false);
  };

  const toggleLike = (id: string) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, liked: !p.liked, likes_count: p.liked ? p.likes_count - 1 : p.likes_count + 1 } : p));
  };

  const toggleSave = (id: string) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, saved: !p.saved } : p));
  };

  const filteredPosts = searchQuery
    ? posts.filter(p => p.description.toLowerCase().includes(searchQuery.toLowerCase()) || p.hashtags?.some(h => h.includes(searchQuery.toLowerCase())))
    : posts;

  return (
    <div className="min-h-screen pt-20 pb-28 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Search bar */}
        {tab === 'search' && (
          <div className="liquid-glass-card rounded-2xl p-4 mb-6">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder={lang === 'fr' ? 'Rechercher des posts, cultures, hashtags...' : 'Search posts, crops, hashtags...'}
                className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-sm" />
            </div>
          </div>
        )}

        {/* Feed */}
        {(tab === 'home' || tab === 'search') && (
          <div className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-green-accent" />
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="liquid-glass-card rounded-3xl text-center py-16 px-6">
                <div className="text-4xl mb-4">🌱</div>
                <p className="text-foreground font-bold mb-2">
                  {lang === 'fr' ? 'Aucune publication' : 'No posts yet'}
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  {lang === 'fr' ? 'Soyez le premier à publier sur le marché !' : 'Be the first to post on the market!'}
                </p>
                <button onClick={() => setShowCreate(true)} className="px-6 py-2.5 rounded-2xl text-sm font-bold bg-green-gradient text-primary-foreground">
                  {t('market.create_post')}
                </button>
              </div>
            ) : (
              filteredPosts.map(post => (
                <PostCard key={post.id} post={post} lang={lang}
                  onLike={() => toggleLike(post.id)}
                  onSave={() => toggleSave(post.id)} />
              ))
            )}
          </div>
        )}

        {/* Messages placeholder */}
        {tab === 'messages' && (
          <div className="liquid-glass-card rounded-3xl text-center py-16">
            <MessageCircle className="w-12 h-12 text-green-accent mx-auto mb-4" />
            <p className="text-foreground font-bold mb-2">{t('market.messages')}</p>
            <p className="text-sm text-muted-foreground">{lang === 'fr' ? 'Fonctionnalité bientôt disponible' : 'Feature coming soon'}</p>
          </div>
        )}

        {/* Videos placeholder */}
        {tab === 'videos' && (
          <div className="liquid-glass-card rounded-3xl text-center py-16">
            <Video className="w-12 h-12 text-green-accent mx-auto mb-4" />
            <p className="text-foreground font-bold mb-2">{t('market.videos')}</p>
            <p className="text-sm text-muted-foreground">{lang === 'fr' ? 'Fonctionnalité bientôt disponible' : 'Feature coming soon'}</p>
          </div>
        )}

        {/* Profile */}
        {tab === 'profile' && user && (
          <div className="liquid-glass-card rounded-3xl text-center py-8">
            <div className="w-20 h-20 rounded-full bg-green-gradient mx-auto mb-4 flex items-center justify-center text-3xl">
              {user.role === 'farmer' ? '👨🏾‍🌾' : '👩🏾‍💼'}
            </div>
            <h2 className="text-xl font-bold text-foreground">{user.name}</h2>
            <p className="text-sm text-muted-foreground capitalize">{user.role === 'farmer' ? (lang === 'fr' ? 'Agriculteur' : 'Farmer') : (lang === 'fr' ? 'Entreprise' : 'Company')}</p>
            {user.country && <p className="text-xs text-muted-foreground mt-1"><MapPin className="w-3 h-3 inline" /> {user.country}</p>}
          </div>
        )}

        {/* FAB */}
        {user && (
          <button onClick={() => setShowCreate(true)}
            className="fixed bottom-24 right-6 w-14 h-14 rounded-full bg-green-gradient text-primary-foreground shadow-lg shadow-green-accent/30 flex items-center justify-center hover:scale-110 transition-transform z-40">
            <Plus className="w-6 h-6" />
          </button>
        )}

        {/* Bottom Tab Bar */}
        <BottomTabBar tab={tab} setTab={setTab} lang={lang} />

        {/* Create Post Modal */}
        <AnimatePresence>
          {showCreate && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-foreground/20 backdrop-blur-sm"
              onClick={() => setShowCreate(false)}>
              <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
                className="liquid-glass rounded-3xl p-6 w-full max-w-lg"
                onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-foreground">{t('market.create_post')}</h3>
                  <button onClick={() => setShowCreate(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
                </div>
                <div className="flex gap-2 mb-4">
                  {(['harvest', 'sale', 'buyer', 'innovation'] as PostType[]).map(type => (
                    <button key={type} onClick={() => setNewPost(p => ({ ...p, type }))}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${newPost.type === type ? TYPE_COLORS[type] + ' ring-2 ring-green-accent/30' : 'bg-secondary text-muted-foreground'}`}>
                      {TYPE_LABELS[type][lang]}
                    </button>
                  ))}
                </div>
                <textarea rows={4} placeholder={lang === 'fr' ? 'Décrivez votre publication... Utilisez # pour taguer' : 'Describe your post... Use # to tag'}
                  value={newPost.description} onChange={e => setNewPost(p => ({ ...p, description: e.target.value }))}
                  className="w-full p-3 rounded-xl bg-background/50 border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none mb-3" />
                <input type="url" placeholder={lang === 'fr' ? 'URL de l\'image (optionnel)' : 'Image URL (optional)'}
                  value={newPost.image_url} onChange={e => setNewPost(p => ({ ...p, image_url: e.target.value }))}
                  className="w-full p-3 rounded-xl bg-background/50 border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none mb-4" />
                <button disabled={!newPost.description.trim() || publishing}
                  className="w-full py-3 rounded-xl text-sm font-bold bg-green-gradient text-primary-foreground hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  onClick={createPost}>
                  {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {t('market.create_post')}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
