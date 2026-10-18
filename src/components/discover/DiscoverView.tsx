import React, { useState, useEffect } from 'react';
import {
  Compass,
  Users,
  Eye,
  Heart,
  MessageCircle,
  Check,
  Plus,
  Search,
  Send,
  Megaphone,
  MessageSquare,
  Crown,
  Shield,
  UserPlus,
  UserMinus,
  X,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { useChatTime } from '../../context/ChatTimeContext';
import { User } from '../../types';
import { formatTime } from '../../utils/formatters';

export const DiscoverView: React.FC = () => {
  const {
    channels,
    users,
    currentUser,
    createCommunity,
    toggleSubscribeChannel,
    openCommunityChat,
    manageCommunityMember,
    postCommunityAnnouncement,
    createChannelPost,
    reactChannelPost,
    commentChannelPost,
    setInspectedUserId,
    t,
  } = useChatTime();

  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedChannelId, setSelectedChannelId] = useState<string>('');
  const [mobileShowDetail, setMobileShowDetail] = useState<boolean>(false);
  const [subTab, setSubTab] = useState<'feed' | 'announcements' | 'members'>('feed');

  // Create Community Modal state
  const [isCreateCommunityOpen, setIsCreateCommunityOpen] = useState(false);
  const [commName, setCommName] = useState('');
  const [commHandle, setCommHandle] = useState('');
  const [commCategory, setCommCategory] = useState('Communities');
  const [commDescription, setCommDescription] = useState('');

  // Feed post state
  const [isNewPostOpen, setIsNewPostOpen] = useState<boolean>(false);
  const [newPostTitle, setNewPostTitle] = useState<string>('');
  const [newPostContent, setNewPostContent] = useState<string>('');
  const [commentInput, setCommentInput] = useState<{ [postId: string]: string }>({});

  // Announcement state
  const [isNewAnnouncementOpen, setIsNewAnnouncementOpen] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annPriority, setAnnPriority] = useState<'normal' | 'important' | 'urgent'>('important');

  // Member add state
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);

  useEffect(() => {
    if (!selectedChannelId && channels.length > 0) {
      setSelectedChannelId(channels[0].id);
    }
  }, [channels, selectedChannelId]);

  const categories = ['All', 'Communities', 'Technology', 'Design', 'Official'];

  const filteredChannels = channels.filter((ch) => {
    const matchesCat =
      activeCategory === 'All' || ch.category.toLowerCase() === activeCategory.toLowerCase();
    const matchesSearch =
      !searchQuery.trim() ||
      ch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ch.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ch.handle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const activeChannel =
    channels.find((c) => c.id === selectedChannelId) || filteredChannels[0] || channels[0];

  const isMember = Boolean(
    activeChannel &&
      (activeChannel.isSubscribed || (activeChannel.members || []).includes(currentUser.id))
  );

  const myCommunityRole =
    activeChannel?.memberRoles?.[currentUser.id] ||
    (activeChannel?.creatorId === currentUser.id ? 'creator' : isMember ? 'member' : undefined);

  const canManageCommunity =
    currentUser.role === 'admin' ||
    myCommunityRole === 'creator' ||
    myCommunityRole === 'admin' ||
    myCommunityRole === 'moderator';

  const handleCreateCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commName.trim()) return;
    const created = await createCommunity({
      name: commName.trim(),
      handle: commHandle.trim() || commName.toLowerCase().replace(/[^a-z0-9_]/g, ''),
      category: commCategory,
      description: commDescription.trim() || 'Welcome to our official ChatTime community!',
    });
    if (created) {
      setSelectedChannelId(created.id);
      setMobileShowDetail(true);
      setIsCreateCommunityOpen(false);
      setCommName('');
      setCommHandle('');
      setCommDescription('');
    }
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim() || !activeChannel) return;
    createChannelPost(
      activeChannel.id,
      newPostTitle.trim() || 'Community Update',
      newPostContent.trim()
    );
    setNewPostTitle('');
    setNewPostContent('');
    setIsNewPostOpen(false);
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim() || !activeChannel) return;
    await postCommunityAnnouncement(
      activeChannel.id,
      annTitle.trim(),
      annContent.trim(),
      annPriority
    );
    setAnnTitle('');
    setAnnContent('');
    setIsNewAnnouncementOpen(false);
  };

  const handleSendComment = (postId: string) => {
    const text = commentInput[postId];
    if (!text?.trim() || !activeChannel) return;
    commentChannelPost(activeChannel.id, postId, text.trim());
    setCommentInput((prev) => ({ ...prev, [postId]: '' }));
  };

  const allUsersList = Object.values(users) as User[];
  const communityMemberIds = activeChannel?.members || [];
  const nonMembers = allUsersList.filter((u) => !communityMemberIds.includes(u.id));

  return (
    <div className="flex-1 h-full flex flex-col md:flex-row bg-slate-950 overflow-hidden select-none">
      {/* Left Column: Communities Directory */}
      <div
        className={`${
          mobileShowDetail ? 'hidden md:flex' : 'flex'
        } w-full md:w-80 lg:w-96 h-full flex-col border-r border-slate-800 bg-slate-900/40 shrink-0`}
      >
        <div className="p-4 sm:p-5 border-b border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-100 font-display">{t('communities', 'Communities')}</h2>
              <p className="text-xs text-slate-400">
                {t('exploreCommunities', 'Create, join, chat, and broadcast announcements')}
              </p>
            </div>
            <button
              onClick={() => setIsCreateCommunityOpen(true)}
              className="px-3 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-teal-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>{t('create', 'Create')}</span>
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search communities..."
              className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500/50"
            />
          </div>

          {/* Category Filters */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                  activeCategory === cat
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Communities List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredChannels.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <Compass className="w-10 h-10 text-teal-400/50 mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-200">No communities yet</p>
                <p className="text-xs text-slate-500">
                  Be the first to launch a community with live group chat, announcements, and member management.
                </p>
              </div>
              <button
                onClick={() => setIsCreateCommunityOpen(true)}
                className="px-4 py-2 rounded-xl bg-teal-500 text-slate-950 text-xs font-bold hover:bg-teal-400 inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Create First Community</span>
              </button>
            </div>
          ) : (
            filteredChannels.map((channel) => {
              const isSelected = activeChannel?.id === channel.id;
              const joined =
                channel.isSubscribed || (channel.members || []).includes(currentUser.id);
              const memberCount = Math.max(
                channel.subscriberCount || 0,
                (channel.members || []).length
              );

              return (
                <div
                  key={channel.id}
                  onClick={() => {
                    setSelectedChannelId(channel.id);
                    setMobileShowDetail(true);
                  }}
                  className={`p-3.5 rounded-2xl cursor-pointer transition-all flex items-center justify-between gap-2 border ${
                    isSelected
                      ? 'bg-teal-500/10 border-teal-500/30'
                      : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <img
                        src={channel.avatar}
                        alt={channel.name}
                        className="w-12 h-12 rounded-2xl object-cover border border-slate-700"
                        referrerPolicy="no-referrer"
                      />
                      {channel.isVerified && (
                        <span className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-teal-400 text-slate-950">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-100 truncate font-display">
                        {channel.name}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">
                        @{channel.handle} · {memberCount} member{memberCount === 1 ? '' : 's'}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSubscribeChannel(channel.id);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors ${
                      joined
                        ? 'bg-slate-800 text-teal-300 border border-teal-500/30'
                        : 'bg-teal-500 text-slate-950 hover:bg-teal-400'
                    }`}
                  >
                    {joined ? 'Joined' : 'Join'}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column: Active Community Workspace */}
      <div
        className={`${
          !mobileShowDetail ? 'hidden md:flex' : 'flex'
        } flex-1 h-full flex-col bg-slate-950 overflow-hidden`}
      >
        {!activeChannel ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Sparkles className="w-8 h-8" />
            </div>
            <div className="max-w-sm space-y-1">
              <h3 className="text-lg font-bold text-slate-100 font-display">
                Welcome to ChatTime Communities
              </h3>
              <p className="text-xs text-slate-400">
                Create a new community or select one from the directory to open community chat, broadcast announcements, and manage members.
              </p>
            </div>
            <button
              onClick={() => setIsCreateCommunityOpen(true)}
              className="px-5 py-2.5 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold flex items-center gap-2 shadow-lg shadow-teal-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Community</span>
            </button>
          </div>
        ) : (
          <>
            {/* Community Header */}
            <div className="p-4 sm:p-6 bg-slate-900/70 border-b border-slate-800 flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setMobileShowDetail(false)}
                    className="md:hidden p-2 rounded-xl bg-slate-800 text-slate-300"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <img
                    src={activeChannel.avatar}
                    alt={activeChannel.name}
                    className="w-13 h-13 rounded-2xl object-cover border border-slate-700"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base sm:text-lg font-bold text-slate-100 font-display">
                        {activeChannel.name}
                      </h3>
                      <span className="text-[10px] px-2 py-0.5 bg-teal-500/10 text-teal-300 border border-teal-500/20 rounded-full font-mono">
                        {activeChannel.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      @{activeChannel.handle} · {activeChannel.description}
                    </p>
                  </div>
                </div>

                {/* Community Primary Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => openCommunityChat(activeChannel.id)}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Community Chat</span>
                  </button>

                  <button
                    onClick={() => toggleSubscribeChannel(activeChannel.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      isMember
                        ? 'bg-slate-800 text-slate-200 hover:bg-rose-500/20 hover:text-rose-300'
                        : 'bg-teal-500 text-slate-950 hover:bg-teal-400 shadow-md shadow-teal-500/20'
                    }`}
                  >
                    {isMember ? 'Joined (Leave)' : 'Join Community'}
                  </button>
                </div>
              </div>

              {/* Sub-Navigation Tabs: Feed | Announcements | Members */}
              <div className="flex items-center justify-between border-t border-slate-800/80 pt-3">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setSubTab('feed')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                      subTab === 'feed'
                        ? 'bg-teal-500 text-slate-950'
                        : 'bg-slate-800/70 text-slate-300 hover:text-white'
                    }`}
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Feed ({activeChannel.posts?.length || 0})</span>
                  </button>
                  <button
                    onClick={() => setSubTab('announcements')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                      subTab === 'announcements'
                        ? 'bg-teal-500 text-slate-950'
                        : 'bg-slate-800/70 text-slate-300 hover:text-white'
                    }`}
                  >
                    <Megaphone className="w-3.5 h-3.5" />
                    <span>Announcements ({(activeChannel.announcements || []).length})</span>
                  </button>
                  <button
                    onClick={() => setSubTab('members')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                      subTab === 'members'
                        ? 'bg-teal-500 text-slate-950'
                        : 'bg-slate-800/70 text-slate-300 hover:text-white'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Members ({communityMemberIds.length})</span>
                  </button>
                </div>

                {subTab === 'feed' && (
                  <button
                    onClick={() => setIsNewPostOpen(!isNewPostOpen)}
                    className="px-3 py-1.5 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/30 text-teal-300 text-xs font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Post</span>
                  </button>
                )}

                {subTab === 'announcements' && canManageCommunity && (
                  <button
                    onClick={() => setIsNewAnnouncementOpen(!isNewAnnouncementOpen)}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1"
                  >
                    <Megaphone className="w-3.5 h-3.5" />
                    <span>Post Announcement</span>
                  </button>
                )}
              </div>
            </div>

            {/* Tab Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 max-w-3xl mx-auto w-full">
              {/* 1. FEED TAB */}
              {subTab === 'feed' && (
                <>
                  {isNewPostOpen && (
                    <form
                      onSubmit={handleCreatePost}
                      className="bg-slate-900 border border-teal-500/30 rounded-3xl p-5 space-y-3 shadow-xl"
                    >
                      <h4 className="text-xs font-bold text-teal-400 uppercase tracking-wider">
                        Publish Post to {activeChannel.name}
                      </h4>
                      <input
                        type="text"
                        value={newPostTitle}
                        onChange={(e) => setNewPostTitle(e.target.value)}
                        placeholder="Headline / Title"
                        className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-teal-500/50"
                      />
                      <textarea
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                        rows={3}
                        required
                        placeholder="Share an update with the community..."
                        className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-teal-500/50 resize-none"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setIsNewPostOpen(false)}
                          className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 bg-teal-500 text-slate-950 text-xs font-bold rounded-xl hover:bg-teal-400"
                        >
                          Publish Post
                        </button>
                      </div>
                    </form>
                  )}

                  {(activeChannel.posts || []).length === 0 ? (
                    <div className="p-10 rounded-3xl bg-slate-900/40 border border-slate-800 text-center space-y-2">
                      <MessageCircle className="w-8 h-8 text-slate-600 mx-auto" />
                      <p className="text-sm font-semibold text-slate-300">No posts in this community yet</p>
                      <p className="text-xs text-slate-500">
                        Click "New Post" above to start a discussion or open Community Chat for live messaging.
                      </p>
                    </div>
                  ) : (
                    activeChannel.posts.map((post) => (
                      <article
                        key={post.id}
                        className="bg-slate-900 border border-slate-800/80 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl"
                      >
                        {post.authorName && (
                          <div className="flex items-center gap-2.5">
                            {post.authorAvatar && (
                              <img
                                src={post.authorAvatar}
                                alt={post.authorName}
                                className="w-7 h-7 rounded-full object-cover"
                              />
                            )}
                            <span className="text-xs font-bold text-teal-400">
                              {post.authorName}
                            </span>
                            <span className="text-[11px] font-mono text-slate-500">
                              · {formatTime(post.timestamp)}
                            </span>
                          </div>
                        )}

                        {post.title && (
                          <h4 className="text-base font-bold text-slate-100 font-display">
                            {post.title}
                          </h4>
                        )}

                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                          {post.content}
                        </p>

                        {post.mediaUrl && (
                          <div className="rounded-2xl overflow-hidden max-h-80 bg-slate-950 border border-slate-800">
                            <img
                              src={post.mediaUrl}
                              alt="media"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        {/* Post Footer with Views & Reactions */}
                        <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2">
                            {Object.entries(post.reactions || {}).map(([emo, count]) => (
                              <button
                                key={emo}
                                onClick={() => reactChannelPost(activeChannel.id, post.id, emo)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl transition-transform active:scale-95"
                              >
                                <span>{emo}</span>
                                <span className="font-mono text-slate-400 text-[11px]">{count}</span>
                              </button>
                            ))}
                            <button
                              onClick={() => reactChannelPost(activeChannel.id, post.id, '❤️')}
                              className="p-1.5 text-slate-400 hover:text-rose-400"
                            >
                              <Heart className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex items-center gap-3 text-slate-500 font-mono text-[11px]">
                            <div className="flex items-center gap-1">
                              <MessageCircle className="w-3.5 h-3.5 text-slate-400" />
                              <span>{post.comments?.length || post.commentsCount || 0}</span>
                            </div>
                            <span>·</span>
                            <div className="flex items-center gap-1">
                              <Eye className="w-3.5 h-3.5 text-teal-400" />
                              <span>{(post.views || 1).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>

                        {/* Existing Comments */}
                        {post.comments && post.comments.length > 0 && (
                          <div className="pt-2 space-y-2 border-t border-slate-800/60">
                            {post.comments.map((c) => (
                              <div
                                key={c.id}
                                className="flex items-start gap-2.5 bg-slate-950/60 p-2.5 rounded-xl"
                              >
                                <img
                                  src={c.userAvatar}
                                  alt={c.userName}
                                  className="w-6 h-6 rounded-full object-cover border border-slate-800 shrink-0 mt-0.5"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-semibold text-teal-300">
                                      {c.userName}
                                    </span>
                                    <span className="text-[10px] font-mono text-slate-500">
                                      {formatTime(c.timestamp)}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-300 mt-0.5">{c.content}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Comment submission bar */}
                        <div className="pt-2 flex items-center gap-2">
                          <input
                            type="text"
                            value={commentInput[post.id] || ''}
                            onChange={(e) =>
                              setCommentInput((prev) => ({ ...prev, [post.id]: e.target.value }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSendComment(post.id);
                            }}
                            placeholder="Write a comment..."
                            className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500/50"
                          />
                          <button
                            onClick={() => handleSendComment(post.id)}
                            className="p-2 rounded-xl bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 font-semibold"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </article>
                    ))
                  )}
                </>
              )}

              {/* 2. ANNOUNCEMENTS TAB */}
              {subTab === 'announcements' && (
                <div className="space-y-4">
                  {isNewAnnouncementOpen && (
                    <form
                      onSubmit={handleCreateAnnouncement}
                      className="bg-slate-900 border border-amber-500/40 rounded-3xl p-5 space-y-3 shadow-xl"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Megaphone className="w-4 h-4" />
                          Broadcast Official Community Announcement
                        </h4>
                        <select
                          value={annPriority}
                          onChange={(e) => setAnnPriority(e.target.value as any)}
                          className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200"
                        >
                          <option value="normal">Normal Priority</option>
                          <option value="important">Important</option>
                          <option value="urgent">Urgent Alert</option>
                        </select>
                      </div>
                      <input
                        type="text"
                        required
                        value={annTitle}
                        onChange={(e) => setAnnTitle(e.target.value)}
                        placeholder="Announcement Title..."
                        className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none"
                      />
                      <textarea
                        required
                        rows={3}
                        value={annContent}
                        onChange={(e) => setAnnContent(e.target.value)}
                        placeholder="All joined community members will receive an instant notification..."
                        className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none resize-none"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setIsNewAnnouncementOpen(false)}
                          className="px-3 py-1.5 text-xs text-slate-400"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 bg-amber-500 text-slate-950 text-xs font-bold rounded-xl hover:bg-amber-400"
                        >
                          Broadcast & Notify Members
                        </button>
                      </div>
                    </form>
                  )}

                  {(activeChannel.announcements || []).length === 0 ? (
                    <div className="p-10 rounded-3xl bg-slate-900/40 border border-slate-800 text-center space-y-2">
                      <Megaphone className="w-8 h-8 text-amber-400/60 mx-auto" />
                      <p className="text-sm font-semibold text-slate-300">
                        No community announcements yet
                      </p>
                      <p className="text-xs text-slate-500">
                        Community admins and moderators can broadcast real-time announcements to all members.
                      </p>
                    </div>
                  ) : (
                    (activeChannel.announcements || []).map((ann) => (
                      <div
                        key={ann.id}
                        className={`p-5 rounded-3xl border space-y-2 ${
                          ann.priority === 'urgent'
                            ? 'bg-rose-500/10 border-rose-500/30'
                            : ann.priority === 'important'
                            ? 'bg-amber-500/10 border-amber-500/30'
                            : 'bg-slate-900 border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                            <Megaphone className="w-3.5 h-3.5" />
                            {ann.priority} Announcement
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">
                            {formatTime(ann.timestamp)}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-white">{ann.title}</h4>
                        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                          {ann.content}
                        </p>
                        <div className="pt-2 text-[11px] text-slate-400">
                          Posted by <span className="font-semibold text-teal-300">{ann.authorName}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* 3. MEMBERS & MANAGEMENT TAB */}
              {subTab === 'members' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-slate-900 p-4 rounded-2xl border border-slate-800">
                    <div>
                      <h4 className="text-sm font-bold text-slate-100">
                        Community Members ({communityMemberIds.length})
                      </h4>
                      <p className="text-xs text-slate-400">
                        Click any member to view their profile, or manage roles if you are an admin.
                      </p>
                    </div>
                    {canManageCommunity && nonMembers.length > 0 && (
                      <button
                        onClick={() => setIsAddMemberOpen(!isAddMemberOpen)}
                        className="px-3 py-1.5 rounded-xl bg-teal-500 text-slate-950 text-xs font-bold flex items-center gap-1.5"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Add Member</span>
                      </button>
                    )}
                  </div>

                  {isAddMemberOpen && nonMembers.length > 0 && (
                    <div className="p-4 rounded-2xl bg-slate-900 border border-teal-500/30 space-y-2">
                      <h5 className="text-xs font-bold text-teal-400">
                        Add Registered User to {activeChannel.name}
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {nonMembers.map((u) => (
                          <div
                            key={u.id}
                            className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <img
                                src={u.avatar}
                                alt={u.name}
                                className="w-7 h-7 rounded-full object-cover"
                              />
                              <span className="text-xs font-semibold text-slate-200 truncate">
                                {u.name}
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                manageCommunityMember(activeChannel.id, u.id, 'add');
                                setIsAddMemberOpen(false);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-teal-500 text-slate-950 text-[11px] font-bold"
                            >
                              Add
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-slate-900 border border-slate-800 rounded-3xl divide-y divide-slate-800 overflow-hidden">
                    {communityMemberIds.map((uid) => {
                      const member = users[uid];
                      if (!member) return null;
                      const role =
                        activeChannel.memberRoles?.[uid] ||
                        (activeChannel.creatorId === uid ? 'creator' : 'member');

                      return (
                        <div
                          key={uid}
                          className="p-3.5 sm:px-5 flex items-center justify-between gap-3"
                        >
                          <div
                            onClick={() => setInspectedUserId(member.id)}
                            className="flex items-center gap-3 cursor-pointer min-w-0"
                          >
                            <img
                              src={member.avatar}
                              alt={member.name}
                              className="w-10 h-10 rounded-2xl object-cover bg-slate-800"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-slate-100 hover:text-teal-400 truncate">
                                  {member.name}
                                </span>
                                {role === 'creator' && (
                                  <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 text-[10px] font-bold flex items-center gap-1">
                                    <Crown className="w-3 h-3" /> Creator
                                  </span>
                                )}
                                {role === 'admin' && (
                                  <span className="px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-300 text-[10px] font-bold flex items-center gap-1">
                                    <Shield className="w-3 h-3" /> Admin
                                  </span>
                                )}
                                {role === 'moderator' && (
                                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 text-[10px] font-bold">
                                    Moderator
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] font-mono text-slate-400">
                                @{member.username}
                              </p>
                            </div>
                          </div>

                          {canManageCommunity && uid !== currentUser.id && role !== 'creator' && (
                            <div className="flex items-center gap-1.5">
                              {role === 'member' ? (
                                <button
                                  onClick={() =>
                                    manageCommunityMember(activeChannel.id, uid, 'promote_admin')
                                  }
                                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-teal-500/20 text-xs text-teal-300 font-semibold"
                                >
                                  Make Admin
                                </button>
                              ) : (
                                <button
                                  onClick={() =>
                                    manageCommunityMember(activeChannel.id, uid, 'demote')
                                  }
                                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-semibold"
                                >
                                  Demote
                                </button>
                              )}
                              <button
                                onClick={() =>
                                  manageCommunityMember(activeChannel.id, uid, 'remove')
                                }
                                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400"
                                title="Remove from Community"
                              >
                                <UserMinus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Create Community Modal */}
      {isCreateCommunityOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <form
            onSubmit={handleCreateCommunity}
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-100 font-display">
                Create New Community
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateCommunityOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Community Name *
              </label>
              <input
                type="text"
                required
                value={commName}
                onChange={(e) => {
                  setCommName(e.target.value);
                  if (!commHandle) {
                    setCommHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''));
                  }
                }}
                placeholder="e.g. Global Builders Hub"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-teal-500/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Handle</label>
                <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
                  <span className="text-xs text-slate-500">@</span>
                  <input
                    type="text"
                    value={commHandle}
                    onChange={(e) =>
                      setCommHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))
                    }
                    placeholder="buildershub"
                    className="w-full bg-transparent text-xs text-slate-100 focus:outline-none pl-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Category</label>
                <select
                  value={commCategory}
                  onChange={(e) => setCommCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none"
                >
                  <option value="Communities">Communities</option>
                  <option value="Technology">Technology</option>
                  <option value="Design">Design</option>
                  <option value="Official">Official</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Description *
              </label>
              <textarea
                rows={3}
                required
                value={commDescription}
                onChange={(e) => setCommDescription(e.target.value)}
                placeholder="Describe what members will discuss and share..."
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-teal-500/50 resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreateCommunityOpen(false)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-teal-500 text-slate-950 text-xs font-bold rounded-xl hover:bg-teal-400 shadow-lg shadow-teal-500/20"
              >
                Launch Community
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
