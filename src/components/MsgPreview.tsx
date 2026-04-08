import React, { useState, useEffect } from 'react';
import { Mail, User, Users, Calendar, Paperclip, Download, AlertCircle } from 'lucide-react';
import MsgReader from '@kenjiuno/msgreader';

interface MsgPreviewProps {
  url: string;
  fileName: string;
  onDownload: () => void;
}

interface ParsedEmail {
  subject: string;
  senderName: string;
  senderEmail: string;
  recipients: { name: string; email: string; type: string }[];
  date: string;
  body: string;
  bodyHtml: string;
  attachments: { name: string; size: number }[];
}

const MsgPreview: React.FC<MsgPreviewProps> = ({ url, fileName, onDownload }) => {
  const [email, setEmail] = useState<ParsedEmail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const parseMsg = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(url);
        if (!response.ok) throw new Error('Kan bestand niet ophalen');

        const arrayBuffer = await response.arrayBuffer();
        const reader = new MsgReader(arrayBuffer);
        const data = reader.getFileData();

        if (data.error) {
          throw new Error(data.error);
        }

        const toRecipients = (data.recipients || []).filter(r => r.recipType === 'to');
        const ccRecipients = (data.recipients || []).filter(r => r.recipType === 'cc');
        const allRecipients = [...toRecipients.map(r => ({
          name: r.name || '',
          email: r.email || r.smtpAddress || '',
          type: 'Aan',
        })), ...ccRecipients.map(r => ({
          name: r.name || '',
          email: r.email || r.smtpAddress || '',
          type: 'CC',
        }))];

        let bodyHtml = '';
        if (data.html) {
          const decoder = new TextDecoder('utf-8');
          bodyHtml = decoder.decode(data.html);
        } else if (data.bodyHtml) {
          bodyHtml = data.bodyHtml;
        }

        const attachments = (data.attachments || [])
          .filter(a => !a.attachmentHidden)
          .map(a => ({
            name: a.fileName || a.name || 'Bijlage',
            size: a.contentLength || 0,
          }));

        const senderEmail = data.senderSmtpAddress || data.senderEmail || data.creatorSMTPAddress || '';

        setEmail({
          subject: data.subject || '(Geen onderwerp)',
          senderName: data.senderName || '',
          senderEmail,
          recipients: allRecipients,
          date: data.clientSubmitTime || data.messageDeliveryTime || data.creationTime || '',
          body: data.body || '',
          bodyHtml,
          attachments,
        });
      } catch (err: any) {
        console.error('Error parsing .msg file:', err);
        setError(err.message || 'Kan e-mail niet lezen');
      } finally {
        setLoading(false);
      }
    };

    parseMsg();
  }, [url]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
        <p className="text-gray-400 mt-4">E-mail laden...</p>
      </div>
    );
  }

  if (error || !email) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <AlertCircle size={48} className="text-red-400 mb-4" />
        <p className="text-gray-400 mb-2">Kan e-mail niet weergeven</p>
        <p className="text-sm text-gray-500 mb-4">{error}</p>
        <button onClick={onDownload} className="btn-primary flex items-center gap-2">
          <Download size={16} />
          Download om te openen in Outlook
        </button>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('nl-NL', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const formatRecipient = (r: { name: string; email: string }) => {
    if (r.name && r.email && r.name !== r.email) return `${r.name} <${r.email}>`;
    return r.name || r.email;
  };

  const toRecipients = email.recipients.filter(r => r.type === 'Aan');
  const ccRecipients = email.recipients.filter(r => r.type === 'CC');

  return (
    <div className="space-y-4">
      <div className="bg-[#1a1f2b] rounded-lg p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg flex-shrink-0 mt-0.5">
            <Mail size={20} className="text-blue-400" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-white font-semibold text-lg leading-snug break-words">
              {email.subject}
            </h3>
          </div>
        </div>

        <div className="border-t border-gray-700/50 pt-3 space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <User size={14} className="text-gray-500 flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="text-gray-500">Van: </span>
              <span className="text-gray-300">
                {email.senderName}
                {email.senderEmail && email.senderName !== email.senderEmail && (
                  <span className="text-gray-500 ml-1">&lt;{email.senderEmail}&gt;</span>
                )}
              </span>
            </div>
          </div>

          {toRecipients.length > 0 && (
            <div className="flex items-start gap-2">
              <Users size={14} className="text-gray-500 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="text-gray-500">Aan: </span>
                <span className="text-gray-300">
                  {toRecipients.map(formatRecipient).join('; ')}
                </span>
              </div>
            </div>
          )}

          {ccRecipients.length > 0 && (
            <div className="flex items-start gap-2">
              <Users size={14} className="text-gray-500 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="text-gray-500">CC: </span>
                <span className="text-gray-300">
                  {ccRecipients.map(formatRecipient).join('; ')}
                </span>
              </div>
            </div>
          )}

          {email.date && (
            <div className="flex items-start gap-2">
              <Calendar size={14} className="text-gray-500 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="text-gray-500">Datum: </span>
                <span className="text-gray-300">{formatDate(email.date)}</span>
              </div>
            </div>
          )}

          {email.attachments.length > 0 && (
            <div className="flex items-start gap-2">
              <Paperclip size={14} className="text-gray-500 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="text-gray-500">Bijlagen: </span>
                <span className="text-gray-300">
                  {email.attachments.map(a => a.name).join(', ')}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg overflow-hidden">
        {email.bodyHtml ? (
          <iframe
            srcDoc={email.bodyHtml}
            className="w-full min-h-[300px] border-0"
            style={{ height: '400px' }}
            title="E-mail inhoud"
            sandbox="allow-same-origin"
          />
        ) : (
          <div className="p-4 text-gray-800 whitespace-pre-wrap text-sm leading-relaxed max-h-[400px] overflow-y-auto">
            {email.body || '(Geen inhoud)'}
          </div>
        )}
      </div>
    </div>
  );
};

export default MsgPreview;
