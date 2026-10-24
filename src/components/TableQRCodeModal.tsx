import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, Download, Printer, ExternalLink, Check } from 'lucide-react';
import { Location } from '../types/models';

interface TableQRCodeModalProps {
  location: Location;
  tableNumber: string;
  onClose: () => void;
  onSelectTableUrl?: (url: string) => void;
}

export const TableQRCodeModal: React.FC<TableQRCodeModalProps> = ({
  location,
  tableNumber,
  onClose,
  onSelectTableUrl
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Generate URL for scanning: includes locationId and table parameter
  const targetUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?location=${encodeURIComponent(location.id)}&table=${encodeURIComponent(tableNumber)}`
    : `https://shangrilla.lucknow/?location=${location.id}&table=${encodeURIComponent(tableNumber)}`;

  useEffect(() => {
    QRCode.toDataURL(targetUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#1c1518',
        light: '#ffffff'
      }
    }).then(url => {
      setQrDataUrl(url);
    }).catch(err => {
      console.error('Failed to generate QR code:', err);
    });
  }, [targetUrl]);

  const handleCopy = () => {
    navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `shangrilla-${location.code.toLowerCase()}-${tableNumber.replace(/\s+/g, '-').toLowerCase()}-qr.png`;
    a.click();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white border border-stone-200 rounded-2xl p-6 text-stone-800 shadow-2xl animate-modal-pop">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-800 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <span className="text-xs uppercase tracking-widest text-[#996e1e] font-bold">
            {location.name}
          </span>
          <h3 className="text-2xl font-serif font-bold text-stone-900 mt-1">
            {tableNumber} QR Ordering
          </h3>
          <p className="text-xs text-stone-500 mt-1">
            Guests scan this QR to automatically order from {tableNumber}
          </p>
        </div>

        <div className="bg-[#faf8f5] border border-stone-200 p-6 rounded-2xl flex flex-col items-center justify-center shadow-xs mx-auto max-w-[280px]">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt={`${tableNumber} QR Code`} className="w-56 h-56 object-contain rounded-lg shadow-xs" />
          ) : (
            <div className="w-56 h-56 flex items-center justify-center text-stone-400 text-sm">
              Generating QR...
            </div>
          )}
          <span className="mt-3 text-[11px] font-mono font-bold text-stone-700 uppercase tracking-wider">
            SHANGRILLA · {tableNumber.toUpperCase()}
          </span>
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <div className="flex items-center gap-2 bg-[#faf8f5] border border-stone-200 rounded-xl p-2.5 text-xs text-stone-700">
            <span className="truncate flex-1 font-mono text-[11px] text-stone-600">{targetUrl}</span>
            <button
              onClick={handleCopy}
              className="px-2.5 py-1 bg-[#cba158]/20 hover:bg-[#cba158]/30 text-[#855e18] rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : null}
              {copied ? 'Copied' : 'Copy Link'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
            <button
              onClick={handleDownload}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#996e1e]" />
              Download PNG
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#cba158] to-[#dfb872] hover:shadow-md text-stone-950 text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Printer className="w-4 h-4" />
              Print Tent Card
            </button>
          </div>

          {onSelectTableUrl && (
            <button
              onClick={() => {
                onSelectTableUrl(targetUrl);
                onClose();
              }}
              className="mt-1 flex items-center justify-center gap-1.5 text-xs text-[#996e1e] hover:underline font-bold cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Test Customer Ordering as this Table
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
