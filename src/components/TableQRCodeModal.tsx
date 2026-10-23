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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-[#181214] border border-[#cba158]/30 rounded-2xl p-6 text-stone-100 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <span className="text-xs uppercase tracking-widest text-[#cba158] font-semibold">
            {location.name}
          </span>
          <h3 className="text-2xl font-serif font-bold text-white mt-1">
            {tableNumber} QR Ordering
          </h3>
          <p className="text-xs text-stone-400 mt-1">
            Guests scan this QR to automatically order from {tableNumber}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl flex flex-col items-center justify-center shadow-inner mx-auto max-w-[280px]">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt={`${tableNumber} QR Code`} className="w-56 h-56 object-contain" />
          ) : (
            <div className="w-56 h-56 flex items-center justify-center text-stone-500 text-sm">
              Generating QR...
            </div>
          )}
          <span className="mt-2 text-[11px] font-mono font-medium text-stone-800 uppercase tracking-wider">
            SHANGRILLA · {tableNumber.toUpperCase()}
          </span>
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <div className="flex items-center gap-2 bg-stone-900/80 border border-stone-800 rounded-lg p-2.5 text-xs text-stone-300">
            <span className="truncate flex-1 font-mono text-[11px] text-stone-400">{targetUrl}</span>
            <button
              onClick={handleCopy}
              className="px-2.5 py-1 bg-[#cba158]/20 hover:bg-[#cba158]/30 text-[#e6c989] rounded text-[11px] font-medium transition-colors flex items-center gap-1 shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : null}
              {copied ? 'Copied' : 'Copy Link'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
            <button
              onClick={handleDownload}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium rounded-lg transition-colors"
            >
              <Download className="w-4 h-4 text-[#cba158]" />
              Download PNG
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#cba158] hover:bg-[#dfb872] text-[#1c1518] text-xs font-semibold rounded-lg transition-colors"
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
              className="mt-1 flex items-center justify-center gap-1.5 text-xs text-[#cba158] hover:underline"
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
