import React, { useState, useEffect } from 'react';
import {
  Globe,
  Mail,
  ShieldCheck,
  Copy,
  Check,
  X,
  Send,
  Server,
  Lock,
  ExternalLink,
  Sparkles,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';

interface DomainSecretsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DomainSecretsModal: React.FC<DomainSecretsModalProps> = ({ isOpen, onClose }) => {
  const [domainConfig, setDomainConfig] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'secrets' | 'dns' | 'test' | 'smtp'>('secrets');

  // SMTP Form State
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('465');
  const [smtpUser, setSmtpUser] = useState('code@chattimeapp.name.ng');
  const [smtpPass, setSmtpPass] = useState('');
  const [smtpSecure, setSmtpSecure] = useState(true);
  const [showSmtpPass, setShowSmtpPass] = useState(false);
  const [smtpSaving, setSmtpSaving] = useState(false);
  const [smtpMsg, setSmtpMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchDomainConfig();
    }
  }, [isOpen]);

  const fetchDomainConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/domain-config');
      if (res.ok) {
        const data = await res.json();
        setDomainConfig(data);
        if (data.senderEmail && !testEmail) {
          setTestEmail('');
        }
      }
    } catch (e) {
      console.error('Failed to load domain config:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail || !testEmail.includes('@')) {
      setTestStatus('Please enter a valid email address.');
      return;
    }
    setTestStatus('Dispatching verification email from "Chat Time Business" <code@chattimeapp.name.ng>...');
    setTestResult(null);

    try {
      const res = await fetch('/api/auth/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail }),
      });
      const data = await res.json();
      setTestResult(data);
      if (data.dispatched) {
        setTestStatus(`Email successfully dispatched via ${data.provider.toUpperCase()} to ${testEmail}! Check your inbox.`);
      } else {
        setTestStatus(data.message || 'Verification email generated.');
      }
    } catch (err: any) {
      setTestStatus(`Error: ${err?.message || 'Failed to dispatch test email'}`);
    }
  };

  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSmtpSaving(true);
    setSmtpMsg(null);
    try {
      const res = await fetch('/api/domain/update-smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: smtpHost,
          port: smtpPort,
          user: smtpUser,
          pass: smtpPass,
          secure: smtpSecure,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSmtpMsg({ type: 'success', text: data.message });
        fetchDomainConfig();
      } else {
        setSmtpMsg({ type: 'error', text: data.error || 'SMTP verification failed.' });
      }
    } catch (err: any) {
      setSmtpMsg({ type: 'error', text: err?.message || 'Network error connecting to SMTP.' });
    } finally {
      setSmtpSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl max-h-[92dvh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-red-500/15 via-rose-500/10 to-transparent border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <BrandLogo size="sm" showText={false} />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white font-display">
                  Custom Domain & Email Secrets
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-300 text-[10px] font-bold font-mono">
                  chattimeapp.name.ng
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Sender: <span className="text-white font-semibold">"Chat Time Business"</span> &lt;<span className="text-red-400 font-mono">code@chattimeapp.name.ng</span>&gt;
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-5 pt-2.5 gap-2 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('secrets')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'secrets'
                ? 'border-red-500 text-red-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" /> Required Secrets (.env)
          </button>
          <button
            onClick={() => setActiveTab('dns')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'dns'
                ? 'border-red-500 text-red-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" /> DNS Records
          </button>
          <button
            onClick={() => setActiveTab('test')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'test'
                ? 'border-red-500 text-red-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Send className="w-3.5 h-3.5" /> Test Real Email
          </button>
          <button
            onClick={() => setActiveTab('smtp')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
              activeTab === 'smtp'
                ? 'border-red-500 text-red-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-3.5 h-3.5" /> Live SMTP Setup
          </button>
        </div>

        {/* Tab Content */}
        <div className="overflow-y-auto p-5 space-y-4 flex-1">
          {/* ---------------- TAB 1: REQUIRED SECRETS ---------------- */}
          {activeTab === 'secrets' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/25 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-white">Registered Domain: chattimeapp.name.ng</h4>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    All environment variables below are ready for your registered domain. Verification emails will be sent with sender name <strong className="text-white">"Chat Time Business"</strong> appearing first, from <strong className="text-red-400">code@chattimeapp.name.ng</strong> with the Red Chat Tile logo.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                  <span className="font-semibold uppercase tracking-wider text-[10px]">Environment Secrets</span>
                  <span>Click to copy value</span>
                </div>

                <div className="space-y-2 font-mono text-xs">
                  {[
                    { key: 'CUSTOM_DOMAIN', val: 'chattimeapp.name.ng', desc: 'Custom domain registered by user' },
                    { key: 'APP_URL', val: 'https://chattimeapp.name.ng', desc: 'Public URL of Chat Time' },
                    { key: 'SMTP_USER', val: 'code@chattimeapp.name.ng', desc: 'Sending email address' },
                    { key: 'SMTP_HOST', val: 'mail.chattimeapp.name.ng', desc: 'Your mail host (or smtp.zoho.com, smtp.titan.email, etc.)' },
                    { key: 'SMTP_PORT', val: '465', desc: 'SSL Mail port' },
                    { key: 'SMTP_SECURE', val: 'true', desc: 'SSL active' },
                    { key: 'SMTP_PASS', val: 'YOUR_EMAIL_ACCOUNT_PASSWORD', desc: 'Password for code@chattimeapp.name.ng' },
                    { key: 'RESEND_API_KEY', val: 're_123456789 (optional)', desc: 'Alternative API sender if using Resend.com' },
                  ].map((s) => (
                    <div
                      key={s.key}
                      className="p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-red-500/40 transition-colors flex items-center justify-between gap-3 group"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-red-400 font-bold">{s.key}</span>
                          <span className="text-slate-500 text-[10px] font-sans">({s.desc})</span>
                        </div>
                        <div className="text-slate-300 text-[11px] truncate mt-0.5 select-all">
                          {s.val}
                        </div>
                      </div>
                      <button
                        onClick={() => handleCopy(`${s.key}="${s.val}"`, s.key)}
                        className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors shrink-0"
                        title="Copy variable"
                      >
                        {copiedKey === s.key ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Copy entire .env block */}
              <div className="pt-2">
                <button
                  onClick={() => {
                    const block = `# Chat Time Custom Domain & Secrets
CUSTOM_DOMAIN="chattimeapp.name.ng"
APP_URL="https://chattimeapp.name.ng"
VITE_APP_DOMAIN="chattimeapp.name.ng"

# Email Dispatcher
SMTP_USER="code@chattimeapp.name.ng"
SMTP_HOST="mail.chattimeapp.name.ng"
SMTP_PORT="465"
SMTP_SECURE="true"
SMTP_PASS="YOUR_PASSWORD_HERE"
SMTP_FROM="Chat Time Business <code@chattimeapp.name.ng>"
`;
                    handleCopy(block, 'all_env');
                  }}
                  className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors flex items-center justify-center gap-2"
                >
                  {copiedKey === 'all_env' ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Copied Full .env Configuration!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-red-400" />
                      <span>Copy Complete .env Configuration Block</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ---------------- TAB 2: DNS RECORDS ---------------- */}
          {activeTab === 'dns' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-red-400" /> Domain Registrar DNS Configuration
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Add these DNS records in your domain registrar's DNS management panel (Namecheap, GoDaddy, Cloudflare, Hostinger, etc.) for <strong className="text-red-400">chattimeapp.name.ng</strong>:
                </p>
              </div>

              <div className="space-y-2.5 font-mono text-xs">
                {[
                  {
                    type: 'CNAME or A Record',
                    host: '@ or chattimeapp.name.ng',
                    value: window.location.hostname,
                    purpose: 'Points web & PWA traffic to your running Chat Time instance',
                  },
                  {
                    type: 'MX Record',
                    host: '@',
                    value: '10 mail.chattimeapp.name.ng',
                    purpose: 'Mail exchange server for code@chattimeapp.name.ng',
                  },
                  {
                    type: 'TXT Record (SPF)',
                    host: '@',
                    value: 'v=spf1 include:_spf.yourmailserver.com ~all',
                    purpose: 'Authorizes mail server to dispatch from code@chattimeapp.name.ng',
                  },
                  {
                    type: 'TXT Record (DMARC)',
                    host: '_dmarc',
                    value: 'v=DMARC1; p=none; rua=mailto:code@chattimeapp.name.ng',
                    purpose: 'Protects domain reputation and prevents email spoofing',
                  },
                ].map((dns, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-lg bg-red-500/15 text-red-300 text-[10px] font-bold">
                        {dns.type}
                      </span>
                      <button
                        onClick={() => handleCopy(dns.value, `dns_${idx}`)}
                        className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                      >
                        {copiedKey === `dns_${idx}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        Copy Value
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[11px] pt-1">
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase font-sans">Host:</span>
                        <span className="text-slate-200 select-all">{dns.host}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-500 block text-[9px] uppercase font-sans">Target / Value:</span>
                        <span className="text-red-300 truncate block select-all">{dns.value}</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 font-sans">{dns.purpose}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ---------------- TAB 3: TEST REAL EMAIL ---------------- */}
          {activeTab === 'test' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-red-400" /> Test Live Email Delivery
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Send a test verification email with sender name <strong className="text-white">"Chat Time Business"</strong>, from <strong className="text-red-400">code@chattimeapp.name.ng</strong> containing the Red Chat Tile logo.
                </p>
              </div>

              <form onSubmit={handleSendTestEmail} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Send Test Code To (Your Email Address):
                  </label>
                  <input
                    type="email"
                    required
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="e.g. prisparimobank@gmail.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 font-mono"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-red-500/25 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Test Email From code@chattimeapp.name.ng</span>
                </button>
              </form>

              {testStatus && (
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                    <span className="font-semibold text-white">{testStatus}</span>
                  </div>
                  {testResult && (
                    <div className="text-[11px] text-slate-400 space-y-1 border-t border-slate-800 pt-2 font-mono">
                      <div>Sender: <span className="text-white">{testResult.sender}</span></div>
                      <div>Recipient: <span className="text-white">{testResult.recipient}</span></div>
                      <div>Test 6-Digit Code: <strong className="text-red-400 text-sm">{testResult.testCode}</strong></div>
                      <div>Delivery Status: <span className={testResult.dispatched ? 'text-emerald-400 font-bold' : 'text-amber-400'}>{testResult.dispatched ? 'Dispatched to inbox' : 'In-App Ready (Configure SMTP or Resend)'}</span></div>
                    </div>
                  )}
                </div>
              )}

              {/* Red Chat Tile Email Preview */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Email Visual Preview:</span>
                  <span className="text-[10px] text-red-400 font-mono">Red Chat Tile Logo Included</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-900 border border-red-500/30 text-center space-y-2 max-w-sm mx-auto">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 via-rose-600 to-red-900 p-0.5 mx-auto flex items-center justify-center shadow-lg shadow-red-500/30">
                    <BrandLogo size="md" showText={false} />
                  </div>
                  <h5 className="text-sm font-extrabold text-white">Chat Time Business</h5>
                  <p className="text-[10px] text-red-400 font-mono uppercase font-bold">Official Verification</p>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-red-500/40 font-mono text-xl font-bold text-red-400 tracking-widest">
                    654 321
                  </div>
                  <p className="text-[10px] text-slate-400">From: "Chat Time Business" &lt;code@chattimeapp.name.ng&gt;</p>
                </div>
              </div>
            </div>
          )}

          {/* ---------------- TAB 4: LIVE SMTP SETUP ---------------- */}
          {activeTab === 'smtp' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-red-400" /> Connect Your Mail Server Live
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Enter your mail server credentials to connect directly and begin dispatching emails from <strong className="text-red-400">code@chattimeapp.name.ng</strong> immediately.
                </p>
              </div>

              {smtpMsg && (
                <div
                  className={`p-3.5 rounded-2xl text-xs font-medium border ${
                    smtpMsg.type === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}
                >
                  {smtpMsg.text}
                </div>
              )}

              <form onSubmit={handleSaveSmtp} className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2 space-y-1">
                    <label className="text-[11px] font-semibold text-slate-300">SMTP Host</label>
                    <input
                      type="text"
                      required
                      value={smtpHost}
                      onChange={(e) => setSmtpHost(e.target.value)}
                      placeholder="e.g. mail.chattimeapp.name.ng"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-300">Port</label>
                    <input
                      type="number"
                      required
                      value={smtpPort}
                      onChange={(e) => setSmtpPort(e.target.value)}
                      placeholder="465"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">Username (Sending Email)</label>
                  <input
                    type="text"
                    required
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                    placeholder="code@chattimeapp.name.ng"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                    <span>Password / App Password</span>
                    <button
                      type="button"
                      onClick={() => setShowSmtpPass(!showSmtpPass)}
                      className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
                    >
                      {showSmtpPass ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      {showSmtpPass ? 'Hide' : 'Show'}
                    </button>
                  </label>
                  <input
                    type={showSmtpPass ? 'text' : 'password'}
                    required
                    value={smtpPass}
                    onChange={(e) => setSmtpPass(e.target.value)}
                    placeholder="Enter email account password"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 font-mono"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="secureCheck"
                    checked={smtpSecure}
                    onChange={(e) => setSmtpSecure(e.target.checked)}
                    className="rounded border-slate-800 text-red-500 focus:ring-red-500"
                  />
                  <label htmlFor="secureCheck" className="text-xs text-slate-300 cursor-pointer">
                    Use SSL / TLS (recommended for port 465)
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={smtpSaving}
                  className="w-full py-3 rounded-2xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-red-500/25 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Server className="w-4 h-4" />
                  <span>{smtpSaving ? 'Testing & Connecting...' : 'Verify & Connect SMTP Server'}</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
