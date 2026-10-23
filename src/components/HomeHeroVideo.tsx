import React, { useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2, Flame, UtensilsCrossed } from 'lucide-react';

interface HomeHeroVideoProps {
  videoUrl?: string;
  onExploreMenu: () => void;
  onOrderNow: () => void;
}

export const HomeHeroVideo: React.FC<HomeHeroVideoProps> = ({
  videoUrl = '/assets/shangrilla-live-kitchen.mp4',
  onExploreMenu,
  onOrderNow
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleFullscreen = () => {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  return (
    <section className="relative w-full py-12 md:py-20 bg-[#120e10] overflow-hidden border-y border-[#cba158]/20">
      {/* Background ambient gradient */}
      <div className="absolute inset-0 bg-radial from-[#2a1b20]/60 via-[#140e11] to-[#0d090a] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#cba158]/10 border border-[#cba158]/30 rounded-full text-xs text-[#e6c989] font-medium tracking-wide mb-3">
            <Flame className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            <span>Live Kitchen Craftsmanship</span>
            <span aria-hidden="true">·</span>
            <span>Hazratganj & Highway Dhaba</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white tracking-tight leading-tight">
            The Sizzle, The Flame, The Heritage
          </h2>
          <p className="mt-3 text-sm sm:text-base text-stone-300 font-light leading-relaxed">
            Witness the passionate mastery of our Bawarchis tossing spiced Awadhi delicacies over searing iron woks and slow charcoal embers.
          </p>
        </div>

        {/* Video Player Frame */}
        <div className="relative mx-auto max-w-5xl rounded-2xl overflow-hidden border border-[#cba158]/30 bg-black shadow-2xl group">
          <video
            ref={videoRef}
            src={videoUrl}
            autoPlay
            loop
            muted={isMuted}
            playsInline
            className="w-full h-[320px] sm:h-[460px] md:h-[540px] object-cover"
          />

          {/* Measured overlay scrim */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

          {/* Bottom Bar Controls and Headline */}
          <div className="absolute bottom-0 inset-x-0 p-4 sm:p-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4 z-10">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#cba158]">
                Kitchen Cam · Slow Dum & High-Flame Tandoor
              </span>
              <h3 className="text-lg sm:text-2xl font-serif font-bold text-white mt-0.5">
                Authentic Charcoal Flavours in Lucknow
              </h3>
              <p className="text-xs text-stone-300 hidden sm:block mt-1">
                Every serving prepared fresh to order using heirloom spices and farm-fresh ingredients.
              </p>
            </div>

            {/* Video Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={togglePlay}
                className="p-2.5 bg-black/60 hover:bg-black/80 text-white rounded-lg border border-white/10 backdrop-blur-sm transition-colors"
                title={isPlaying ? 'Pause' : 'Play'}
                aria-label={isPlaying ? 'Pause video' : 'Play video'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>

              <button
                onClick={toggleMute}
                className="p-2.5 bg-black/60 hover:bg-black/80 text-white rounded-lg border border-white/10 backdrop-blur-sm transition-colors"
                title={isMuted ? 'Unmute' : 'Mute'}
                aria-label={isMuted ? 'Unmute video' : 'Mute video'}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-stone-400" /> : <Volume2 className="w-4 h-4 text-[#cba158]" />}
              </button>

              <button
                onClick={handleFullscreen}
                className="p-2.5 bg-black/60 hover:bg-black/80 text-white rounded-lg border border-white/10 backdrop-blur-sm transition-colors"
                title="Fullscreen"
                aria-label="Fullscreen video"
              >
                <Maximize2 className="w-4 h-4" />
              </button>

              <button
                onClick={onOrderNow}
                className="ml-2 px-4 py-2 bg-[#cba158] hover:bg-[#dfb872] text-[#140e11] font-semibold text-xs rounded-lg transition-colors shadow-lg flex items-center gap-1.5 whitespace-nowrap"
              >
                <UtensilsCrossed className="w-3.5 h-3.5" />
                Order Hot Dishes
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
