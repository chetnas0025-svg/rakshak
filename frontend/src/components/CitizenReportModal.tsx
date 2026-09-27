import React, { useState, useEffect } from 'react';
import { Camera, MapPin, CheckCircle2, AlertTriangle, X, WifiOff, Send } from 'lucide-react';
import { WardRisk } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  wards: WardRisk[];
  onReportSubmitted: () => void;
}

type CategoryType = 'crack' | 'seepage' | 'rockfall' | 'water_rising' | 'other';

const CATEGORIES: { type: CategoryType; label: string; icon: string; desc: string }[] = [
  { type: 'crack', label: 'Tension Crack', icon: '🪨', desc: 'Slope cracks / ground displacement' },
  { type: 'seepage', label: 'Water Seepage', icon: '💧', desc: 'Muddy water emerging from hill' },
  { type: 'rockfall', label: 'Rockfall', icon: '🧗', desc: 'Falling rocks & loose debris' },
  { type: 'water_rising', label: 'River Surge', icon: '🌊', desc: 'Rapidly rising river or khad' },
  { type: 'other', label: 'Road Erosion', icon: '⚠️', desc: 'Retaining wall or road collapse' }
];

export const CitizenReportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  wards,
  onReportSubmitted
}) => {
  const [category, setCategory] = useState<CategoryType>('crack');
  const [selectedWardId, setSelectedWardId] = useState<string>(wards[0]?.ward_id || 'HP-MND-01');
  const [latitude, setLatitude] = useState<number>(31.7087);
  const [longitude, setLongitude] = useState<number>(76.9320);
  const [gpsCaptured, setGpsCaptured] = useState<boolean>(false);
  const [description, setDescription] = useState<string>('');
  const [reporterContact, setReporterContact] = useState<string>('');
  const [reporterType, setReporterType] = useState<'citizen' | 'field_officer'>('citizen');
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [queuedOffline, setQueuedOffline] = useState<boolean>(false);

  // Auto GPS location capture
  useEffect(() => {
    if (isOpen && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(Number(pos.coords.latitude.toFixed(4)));
          setLongitude(Number(pos.coords.longitude.toFixed(4)));
          setGpsCaptured(true);
        },
        () => {
          setGpsCaptured(false);
        },
        { timeout: 5000, enableHighAccuracy: true }
      );
    }
  }, [isOpen]);

  // Online / offline status listener
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOpen) return null;

  // Compress image client-side for 2G/3G low-bandwidth
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6); // 60% quality
        setPhotoBase64(compressedBase64);
        setIsCompressing(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      category,
      latitude,
      longitude,
      ward_id: selectedWardId,
      description: description || undefined,
      reporter_type: reporterType,
      reporter_contact: reporterContact || undefined,
      photo_base64: photoBase64 || undefined
    };

    if (isOffline) {
      // Offline queueing in localStorage
      const queued = JSON.parse(localStorage.getItem('rakshak_offline_reports') || '[]');
      queued.push({ ...payload, queued_at: new Date().toISOString() });
      localStorage.setItem('rakshak_offline_reports', JSON.stringify(queued));
      setQueuedOffline(true);
      setSubmitSuccess(true);
      setIsSubmitting(false);
      onReportSubmitted();
      return;
    }

    try {
      const res = await fetch('/api/v1/reports/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSubmitSuccess(true);
        onReportSubmitted();
      } else {
        throw new Error('Failed to submit report');
      }
    } catch {
      // Fallback to offline queue on network error
      const queued = JSON.parse(localStorage.getItem('rakshak_offline_reports') || '[]');
      queued.push({ ...payload, queued_at: new Date().toISOString() });
      localStorage.setItem('rakshak_offline_reports', JSON.stringify(queued));
      setQueuedOffline(true);
      setSubmitSuccess(true);
      onReportSubmitted();
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setSubmitSuccess(false);
    setQueuedOffline(false);
    setPhotoBase64(null);
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Bar */}
        <div className="bg-[#064244] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-white/10">
              <AlertTriangle className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Report Ground Hazard</h3>
              <p className="text-xs text-slate-200 font-mono">SIH26192 • Low-Bandwidth Citizen PWA</p>
            </div>
          </div>
          <button
            onClick={resetAndClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Offline Banner */}
        {isOffline && (
          <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <WifiOff className="w-4 h-4" /> 2G / Offline Mode: Report will be queued locally and synced automatically
            </span>
          </div>
        )}

        {/* Form Body */}
        {submitSuccess ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="text-xl font-bold text-slate-900">
              {queuedOffline ? 'Report Queued Offline' : 'Hazard Report Submitted!'}
            </h4>
            <p className="text-sm text-slate-600 max-w-sm mx-auto">
              {queuedOffline
                ? 'Your report has been saved locally on your device and will submit as soon as internet connection returns.'
                : 'Thank you! Your report has been dispatched to field officers. Upon officer verification, ward risk scores will be updated.'}
            </p>
            <div className="pt-4">
              <button
                onClick={resetAndClose}
                className="w-full py-3 rounded-2xl bg-[#064244] text-white font-bold text-sm shadow-md hover:bg-[#053537] transition-all"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
            {/* 1. Large Tap Category Picker */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                1. Select Hazard Category <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    type="button"
                    key={cat.type}
                    onClick={() => setCategory(cat.type)}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      category === cat.type
                        ? 'border-[#064244] bg-[#064244]/5 ring-2 ring-[#064244]'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                    }`}
                  >
                    <div className="text-2xl mb-1">{cat.icon}</div>
                    <div>
                      <div className="font-bold text-xs text-slate-900 leading-tight">{cat.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5 leading-none">{cat.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Auto GPS Badge & Ward Picker */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#064244]" /> 2. Device Location
                </span>
                {gpsCaptured ? (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> GPS Captured ✓
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500 font-mono">Centroid auto-match</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="bg-white p-2 rounded-xl border border-slate-200 text-slate-700">
                  Lat: <strong className="text-slate-900">{latitude}</strong>
                </div>
                <div className="bg-white p-2 rounded-xl border border-slate-200 text-slate-700">
                  Lng: <strong className="text-slate-900">{longitude}</strong>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Fallback Ward Select (if GPS is poor):
                </label>
                <select
                  value={selectedWardId}
                  onChange={(e) => setSelectedWardId(e.target.value)}
                  className="w-full text-xs font-medium bg-white border border-slate-200 rounded-xl p-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#064244]"
                >
                  {wards.map((w) => (
                    <option key={w.ward_id} value={w.ward_id}>
                      {w.ward_name} ({w.district_name})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 3. Camera / Photo Upload (Optional) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  3. Add Photo <span className="text-emerald-700 text-[10px] font-normal lowercase">(optional — skip for 2G/3G)</span>
                </label>
              </div>

              {photoBase64 ? (
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 h-36">
                  <img src={photoBase64} alt="Hazard preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setPhotoBase64(null)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 text-white hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 hover:border-[#064244] rounded-2xl cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-all text-center">
                  <div className="p-3 rounded-full bg-slate-200/60 text-[#064244] mb-1">
                    <Camera className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-slate-800">Tap to Take Photo or Upload</span>
                  <span className="text-[10px] text-slate-500">Auto-compressed to ~200KB</span>
                  <input type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} className="hidden" />
                </label>
              )}
            </div>

            {/* 4. Reporter Role & Contact */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Reporter Role</label>
                <select
                  value={reporterType}
                  onChange={(e) => setReporterType(e.target.value as any)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2 text-slate-800 font-medium"
                >
                  <option value="citizen">Villager / Citizen</option>
                  <option value="field_officer">Field Officer / NDRF</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Phone Number (Optional)</label>
                <input
                  type="tel"
                  placeholder="+9198160..."
                  value={reporterContact}
                  onChange={(e) => setReporterContact(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2 text-slate-800 font-mono"
                />
              </div>
            </div>

            {/* 5. Short Description */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Observation Details (Optional)</label>
              <textarea
                rows={2}
                placeholder="Describe crack size, soil movement, or water speed..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#064244]"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || isCompressing}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#064244] hover:bg-[#053537] text-white font-bold text-sm shadow-lg flex items-center justify-center space-x-2 disabled:opacity-50 transition-all"
              >
                {isSubmitting ? (
                  <span>Submitting Report...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Hazard Report</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
