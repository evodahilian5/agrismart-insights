import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import GlassCard from '@/components/GlassCard';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, MessageCircle, User, Video, Search, Plus, Heart, MessageSquare, Share2, Bookmark, MoreHorizontal, MapPin, X, Send } from 'lucide-react';

type Tab = 'home' | 'messages' | 'profile' | 'videos' | 'search';
type PostType = 'harvest' | 'sale' | 'buyer' | 'innovation';

interface Post {
  id: string;
  author: { name: string; role: string; location: string; avatar: string };
  type: PostType;
  image: string;
  description: string;
  hashtags: string[];
  likes: number;
  comments: number;
  date: string;
  saleInfo?: { crop: string; volume: string; price: string };
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

const MOCK_POSTS: Post[] = [
  {
    id: '1', author: { name: 'Amadou Diallo', role: 'Agriculteur', location: 'Bamako, Mali', avatar: '👨🏾‍🌾' },
    type: 'harvest', image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=600&h=750&fit=crop',
    description: 'Excellente récolte de maïs cette saison ! 8 tonnes/ha grâce à l\'analyse de sol AgriSmartConnect.',
    hashtags: ['maïs', 'récolte2026', 'agriculture'], likes: 142, comments: 23, date: '2h',
  },
  {
    id: '2', author: { name: 'Fatou Sow', role: 'Entreprise', location: 'Dakar, Sénégal', avatar: '👩🏾‍💼' },
    type: 'sale', image: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=600&h=750&fit=crop',
    description: 'Tomates bio fraîchement récoltées disponibles. Qualité premium, livraison possible.',
    hashtags: ['tomates', 'bio', 'vente'], likes: 89, comments: 15, date: '4h',
    saleInfo: { crop: 'Tomates Bio', volume: '5 tonnes', price: '300 $/t' },
  },
  {
    id: '3', author: { name: 'Kwame Asante', role: 'Agriculteur', location: 'Accra, Ghana', avatar: '👨🏾‍🌾' },
    type: 'innovation', image: 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=600&h=750&fit=crop',
    description: 'Nouveau système d\'irrigation goutte-à-goutte installé. Économie de 40% d\'eau !',
    hashtags: ['irrigation', 'innovation', 'eau'], likes: 256, comments: 42, date: '6h',
  },
  {
    id: '4', author: { name: 'Aissetou Barry', role: 'Agriculteur', location: 'Conakry, Guinée', avatar: '👩🏾‍🌾' },
    type: 'buyer', image: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=600&h=750&fit=crop',
    description: 'Recherche fournisseurs de cacao certifié. Volume : 20 tonnes/mois minimum.',
    hashtags: ['cacao', 'achat', 'commerce'], likes: 67, comments: 31, date: '8h',
  },
  {
    id: '5', author: { name: 'Moussa Koné', role: 'Agriculteur', location: 'Abidjan, Côte d\'Ivoire', avatar: '👨🏾‍🌾' },
    type: 'harvest', image: 'https://images.unsplash.com/photo-1595855759920-86582396756a?w=600&h=750&fit=crop',
    description: 'Plantation de cacao en pleine floraison. La saison s\'annonce prometteuse.',
    hashtags: ['cacao', 'plantation', 'agriculture'], likes: 198, comments: 28, date: '12h',
  },
];

export default function Market() {
  const { t, user, lang } = useApp();
  const [tab, setTab] = useState<Tab>('home');
  const [posts, setPosts] = useState(MOCK_POSTS);
  const [showCreate, setShowCreate] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newPost, setNewPost] = useState({ description: '', type: 'harvest' as PostType, image: '' });

  const toggleLike = (id: string) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p));
  };

  const toggleSave = (id: string) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, saved: !p.saved } : p));
  };

  const filteredPosts = searchQuery
    ? posts.filter(p => p.description.toLowerCase().includes(searchQuery.toLowerCase()) || p.hashtags.some(h => h.includes(searchQuery.toLowerCase())))
    : posts;

  const tabs: { key: Tab; icon: any; label: string }[] = [
    { key: 'home', icon: Home, label: t('market.home') },
    { key: 'search', icon: Search, label: t('market.search') },
    { key: 'videos', icon: Video, label: t('market.videos') },
    { key: 'messages', icon: MessageCircle, label: t('market.messages') },
    { key: 'profile', icon: User, label: t('market.profile') },
  ];

  return (
    <div className="min-h-screen pt-20 pb-24 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Glass tab bar */}
        <div className="glass-strong rounded-2xl p-1 mb-6 flex items-center">
          {tabs.map(tb => (
            <button key={tb.key} onClick={() => setTab(tb.key)}
              className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl text-xs font-medium transition-all ${
                tab === tb.key ? 'bg-green-gradient text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'
              }`}>
              <tb.icon className="w-4 h-4" />
              {tb.label}
            </button>
          ))}
        </div>

        {/* Search */}
        {tab === 'search' && (
          <GlassCard variant="strong" className="mb-6 p-4">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder={lang === 'fr' ? 'Rechercher des posts, cultures, hashtags...' : 'Search posts, crops, hashtags...'}
                className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-sm" />
            </div>
          </GlassCard>
        )}

        {/* Feed */}
        {(tab === 'home' || tab === 'search') && (
          <div className="space-y-6">
            {filteredPosts.map(post => (
              <motion.div key={post.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <GlassCard variant="strong" className="p-0 overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-lg">{post.author.avatar}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-foreground">{post.author.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${TYPE_COLORS[post.type]}`}>
                            {TYPE_LABELS[post.type][lang]}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3" /> {post.author.location}
                        </div>
                      </div>
                    </div>
                    <button className="text-muted-foreground hover:text-foreground"><MoreHorizontal className="w-5 h-5" /></button>
                  </div>

                  {/* Image */}
                  <div className="relative aspect-[4/5] bg-secondary">
                    <img src={post.image} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </div>

                  {/* Sale info */}
                  {post.saleInfo && (
                    <div className="mx-4 mt-3 p-3 rounded-xl bg-gold/10 border border-gold/20">
                      <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                        <div><span className="text-muted-foreground">{lang === 'fr' ? 'Culture' : 'Crop'}</span><div className="font-bold text-foreground">{post.saleInfo.crop}</div></div>
                        <div><span className="text-muted-foreground">Volume</span><div className="font-bold text-foreground">{post.saleInfo.volume}</div></div>
                        <div><span className="text-muted-foreground">{lang === 'fr' ? 'Prix' : 'Price'}</span><div className="font-bold text-foreground">{post.saleInfo.price}</div></div>
                      </div>
                      <button className="w-full py-2 rounded-lg text-xs font-bold bg-green-gradient text-primary-foreground">
                        {t('market.interested')}
                      </button>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <button onClick={() => toggleLike(post.id)} className="flex items-center gap-1 text-sm">
                        <Heart className={`w-5 h-5 ${post.liked ? 'fill-destructive text-destructive' : 'text-foreground'}`} />
                        <span className="text-muted-foreground">{post.likes}</span>
                      </button>
                      <button className="flex items-center gap-1 text-sm text-foreground">
                        <MessageSquare className="w-5 h-5" />
                        <span className="text-muted-foreground">{post.comments}</span>
                      </button>
                      <button className="text-foreground"><Share2 className="w-5 h-5" /></button>
                    </div>
                    <button onClick={() => toggleSave(post.id)}>
                      <Bookmark className={`w-5 h-5 ${post.saved ? 'fill-foreground text-foreground' : 'text-foreground'}`} />
                    </button>
                  </div>

                  {/* Description */}
                  <div className="px-4 pb-4">
                    <p className="text-sm text-foreground">{post.description}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {post.hashtags.map(h => (
                        <span key={h} className="text-xs text-green-accent">#{h}</span>
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground mt-1 block">{post.date}</span>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}

        {/* Messages placeholder */}
        {tab === 'messages' && (
          <GlassCard variant="strong" className="text-center py-16">
            <MessageCircle className="w-12 h-12 text-green-accent mx-auto mb-4" />
            <p className="text-foreground font-bold mb-2">{t('market.messages')}</p>
            <p className="text-sm text-muted-foreground">{lang === 'fr' ? 'Fonctionnalité bientôt disponible' : 'Feature coming soon'}</p>
          </GlassCard>
        )}

        {/* Videos placeholder */}
        {tab === 'videos' && (
          <GlassCard variant="strong" className="text-center py-16">
            <Video className="w-12 h-12 text-green-accent mx-auto mb-4" />
            <p className="text-foreground font-bold mb-2">{t('market.videos')}</p>
            <p className="text-sm text-muted-foreground">{lang === 'fr' ? 'Fonctionnalité bientôt disponible' : 'Feature coming soon'}</p>
          </GlassCard>
        )}

        {/* Profile */}
        {tab === 'profile' && user && (
          <div>
            <GlassCard variant="strong" className="text-center py-8 mb-6">
              <div className="w-20 h-20 rounded-full bg-green-gradient mx-auto mb-4 flex items-center justify-center text-3xl">
                {user.role === 'farmer' ? '👨🏾‍🌾' : '👩🏾‍💼'}
              </div>
              <h2 className="text-xl font-bold text-foreground">{user.name}</h2>
              <p className="text-sm text-muted-foreground capitalize">{user.role === 'farmer' ? (lang === 'fr' ? 'Agriculteur' : 'Farmer') : (lang === 'fr' ? 'Entreprise' : 'Company')}</p>
              {user.country && <p className="text-xs text-muted-foreground mt-1"><MapPin className="w-3 h-3 inline" /> {user.country}</p>}
            </GlassCard>
          </div>
        )}

        {/* FAB */}
        <button onClick={() => setShowCreate(true)}
          className="fixed bottom-24 right-6 w-14 h-14 rounded-full bg-green-gradient text-primary-foreground shadow-lg shadow-green-accent/30 flex items-center justify-center hover:scale-110 transition-transform z-40">
          <Plus className="w-6 h-6" />
        </button>

        {/* Create Post Modal */}
        <AnimatePresence>
          {showCreate && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-foreground/20 backdrop-blur-sm"
              onClick={() => setShowCreate(false)}>
              <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
                className="glass-strong rounded-3xl p-6 w-full max-w-lg"
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
                <textarea rows={4} placeholder={lang === 'fr' ? 'Décrivez votre publication... Utilisez @ pour mentionner et # pour taguer' : 'Describe your post... Use @ to mention and # to tag'}
                  value={newPost.description} onChange={e => setNewPost(p => ({ ...p, description: e.target.value }))}
                  className="w-full p-3 rounded-xl bg-background/50 border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none mb-4" />
                <button className="w-full py-3 rounded-xl text-sm font-bold bg-green-gradient text-primary-foreground hover:opacity-90 transition-all flex items-center justify-center gap-2"
                  onClick={() => setShowCreate(false)}>
                  <Send className="w-4 h-4" /> {t('market.create_post')}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
