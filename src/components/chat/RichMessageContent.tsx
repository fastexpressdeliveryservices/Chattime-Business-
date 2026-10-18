import React from 'react';
import { ExternalLink, Globe } from 'lucide-react';
import {
  parseTextWithUrls,
  findUrlsInText,
  extractDomain,
  normalizeUrl,
  openInExternalBrowser,
  detectPlatform,
} from '../../utils/linkHandler';

interface RichMessageContentProps {
  content: string;
  isOwn: boolean;
  className?: string;
}

export const RichMessageContent: React.FC<RichMessageContentProps> = ({
  content,
  isOwn,
  className = '',
}) => {
  const urls = findUrlsInText(content);
  const tokens = parseTextWithUrls(content);
  const { browserName, isAndroid, isIOS } = detectPlatform();

  const handleLinkClick = (e: React.MouseEvent, url: string) => {
    e.preventDefault();
    e.stopPropagation();
    openInExternalBrowser(url);
  };

  const primaryUrl = urls.length > 0 ? urls[0] : null;
  const primaryDomain = primaryUrl ? extractDomain(primaryUrl) : '';
  const normalizedPrimaryUrl = primaryUrl ? normalizeUrl(primaryUrl) : '';

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* WhatsApp-style Rich Link Preview Card when message contains a URL */}
      {primaryUrl && (
        <div
          onClick={(e) => handleLinkClick(e, primaryUrl)}
          className={`group rounded-xl p-2.5 transition-all cursor-pointer border select-none ${
            isOwn
              ? 'bg-slate-950/20 hover:bg-slate-950/30 border-slate-950/30 text-slate-950'
              : 'bg-slate-950/70 hover:bg-slate-950/90 border-slate-800 text-slate-200'
          }`}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <div
              className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                isOwn ? 'bg-slate-950 text-teal-400' : 'bg-teal-500/20 text-teal-400'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-bold truncate tracking-tight">
                {primaryDomain}
              </div>
              <div
                className={`text-[9px] truncate font-mono ${
                  isOwn ? 'text-slate-800/80' : 'text-slate-400'
                }`}
              >
                {normalizedPrimaryUrl}
              </div>
            </div>
            <div
              className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                isOwn
                  ? 'bg-slate-950 text-teal-300'
                  : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
              }`}
            >
              <span>{isAndroid ? 'Chrome' : isIOS ? 'Safari' : 'Open'}</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </div>
          </div>
        </div>
      )}

      {/* Message Text with Hyperlinks */}
      <p className="text-xs sm:text-sm whitespace-pre-wrap break-words leading-relaxed">
        {tokens.map((token, idx) => {
          if (token.type === 'url') {
            return (
              <a
                key={idx}
                href={normalizeUrl(token.content)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => handleLinkClick(e, token.content)}
                title={`Open in ${browserName} (${token.content})`}
                className={`inline-flex items-baseline gap-0.5 underline font-medium hover:opacity-80 transition-opacity break-all cursor-pointer ${
                  isOwn
                    ? 'text-slate-950 font-semibold decoration-slate-950/60'
                    : 'text-teal-300 font-semibold decoration-teal-400/60'
                }`}
              >
                <span>{token.content}</span>
                <ExternalLink className="w-2.5 h-2.5 inline self-center ml-0.5 opacity-80 shrink-0" />
              </a>
            );
          }
          return <React.Fragment key={idx}>{token.content}</React.Fragment>;
        })}
      </p>
    </div>
  );
};
