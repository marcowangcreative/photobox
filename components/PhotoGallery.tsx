'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

interface PhotoData {
  id: string;
  url: string;
  is_landscape: boolean;
  sort_order: number;
}

interface Props {
  coupleNames: string;
  sneakPeekLabel: string;
  photos: PhotoData[];
  galleryUrl: string;
}

function GridIcon({ color = '#6b6159' }: { color?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill={color}>
      <rect x="0" y="0" width="5" height="5" rx="1" />
      <rect x="6.5" y="0" width="5" height="5" rx="1" />
      <rect x="13" y="0" width="5" height="5" rx="1" />
      <rect x="0" y="6.5" width="5" height="5" rx="1" />
      <rect x="6.5" y="6.5" width="5" height="5" rx="1" />
      <rect x="13" y="6.5" width="5" height="5" rx="1" />
      <rect x="0" y="13" width="5" height="5" rx="1" />
      <rect x="6.5" y="13" width="5" height="5" rx="1" />
      <rect x="13" y="13" width="5" height="5" rx="1" />
    </svg>
  );
}

function StackIcon({ color = '#6b6159' }: { color?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={color} strokeWidth="1.2">
      <rect x="2" y="1" width="14" height="10" rx="1" fill={color} fillOpacity="0.15" />
      <rect x="1" y="3" width="14" height="10" rx="1" fill={color} fillOpacity="0.25" />
      <rect x="3" y="5" width="14" height="10" rx="1" fill={color} fillOpacity="0.4" />
    </svg>
  );
}

export default function PhotoGallery({ coupleNames, sneakPeekLabel, photos: rawPhotos, galleryUrl }: Props) {
  const [photos] = useState(() => rawPhotos.map((p, i) => ({
    ...p,
    idx: i,
    isLandscape: p.is_landscape,
    stackRotation: (Math.random() - 0.5) * 2.5,
    stackX: (Math.random() - 0.5) * 4,
    stackY: (Math.random() - 0.5) * 3,
  })));

  type Photo = typeof photos[0];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<'idle' | 'pulling' | 'viewing' | 'discarding'>('idle');
  const [viewingPhoto, setViewingPhoto] = useState<Photo | null>(null);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [mode, setMode] = useState<'stack' | 'grid'>('stack');
  const [gridViewing, setGridViewing] = useState<Photo | null>(null);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [lidState, setLidState] = useState<'closed' | 'shrinking' | 'open'>('closed');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const touchRef = useRef({ startX: 0, startY: 0, startTime: 0 });

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const preloadCount = 5;
    for (let i = currentIndex; i < Math.min(currentIndex + preloadCount, photos.length); i++) {
      const img = new Image();
      img.src = photos[i].url;
    }
  }, [currentIndex, photos]);

  const seenCount = currentIndex;
  const unseenCount = photos.length - currentIndex;
  const allSeen = currentIndex >= photos.length;
  const noneSeen = currentIndex === 0;

  const pullForward = useCallback(() => {
    if (allSeen || phase !== 'idle') return;
    setDirection('forward');
    setPhase('pulling');
    setViewingPhoto(photos[currentIndex]);
    timeoutRef.current = setTimeout(() => setPhase('viewing'), 400);
  }, [allSeen, phase, currentIndex, photos]);

  const pullBackward = useCallback(() => {
    if (noneSeen || phase !== 'idle') return;
    setDirection('backward');
    setPhase('pulling');
    setViewingPhoto(photos[currentIndex - 1]);
    timeoutRef.current = setTimeout(() => setPhase('viewing'), 400);
  }, [noneSeen, phase, currentIndex, photos]);

  const dismissInDirection = useCallback((dir: 'forward' | 'backward') => {
    if (phase !== 'viewing') return;
    setDirection(dir);
    setPhase('discarding');
    setDragX(0);
    setDragging(false);
    timeoutRef.current = setTimeout(() => {
      if (dir === 'forward') setCurrentIndex(p => Math.min(p + 1, photos.length));
      else setCurrentIndex(p => Math.max(p - 1, 0));
      setViewingPhoto(null);
      setPhase('idle');
    }, 320);
  }, [phase, photos.length]);

  const dismissPhoto = useCallback(() => dismissInDirection(direction), [dismissInDirection, direction]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (phase !== 'viewing') return;
    const t = e.touches[0];
    touchRef.current = { startX: t.clientX, startY: t.clientY, startTime: Date.now() };
    setDragging(true);
    setDragX(0);
  }, [phase]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragging || phase !== 'viewing') return;
    setDragX(e.touches[0].clientX - touchRef.current.startX);
  }, [dragging, phase]);

  const onTouchEnd = useCallback(() => {
    if (!dragging || phase !== 'viewing') { setDragging(false); return; }
    setDragging(false);
    const dx = dragX;
    const velocity = Math.abs(dx) / (Date.now() - touchRef.current.startTime);
    if (Math.abs(dx) > 80 || velocity > 0.5) {
      if (dx < 0 && currentIndex < photos.length) dismissInDirection('forward');
      else if (dx > 0 && currentIndex > 0) dismissInDirection('backward');
      else setDragX(0);
    } else if (Math.abs(dx) < 10) {
      dismissInDirection('forward');
    } else {
      setDragX(0);
    }
  }, [dragging, dragX, phase, currentIndex, photos.length, dismissInDirection]);

  const resetGallery = useCallback(() => {
    setCurrentIndex(0); setViewingPhoto(null); setPhase('idle'); setLidState('closed');
  }, []);

  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

  // Grid swipe
  const gridTouchRef = useRef({ startX: 0, startTime: 0 });
  const [gridDragX, setGridDragX] = useState(0);
  const [gridDragging, setGridDragging] = useState(false);
  const [gridAnimDir, setGridAnimDir] = useState<'left' | 'right' | null>(null);

  const gridNext = useCallback(() => {
    if (!gridViewing) return;
    const idx = photos.findIndex(p => p.id === gridViewing.id);
    if (idx < photos.length - 1) {
      setGridAnimDir('left');
      setTimeout(() => { setGridViewing(photos[idx + 1]); setGridAnimDir(null); }, 200);
    }
  }, [gridViewing, photos]);

  const gridPrev = useCallback(() => {
    if (!gridViewing) return;
    const idx = photos.findIndex(p => p.id === gridViewing.id);
    if (idx > 0) {
      setGridAnimDir('right');
      setTimeout(() => { setGridViewing(photos[idx - 1]); setGridAnimDir(null); }, 200);
    }
  }, [gridViewing, photos]);

  const onGridTouchStart = useCallback((e: React.TouchEvent) => {
    if (!gridViewing) return;
    gridTouchRef.current = { startX: e.touches[0].clientX, startTime: Date.now() };
    setGridDragging(true);
    setGridDragX(0);
  }, [gridViewing]);

  const onGridTouchMove = useCallback((e: React.TouchEvent) => {
    if (!gridDragging) return;
    setGridDragX(e.touches[0].clientX - gridTouchRef.current.startX);
  }, [gridDragging]);

  const onGridTouchEnd = useCallback(() => {
    if (!gridDragging) return;
    setGridDragging(false);
    const dx = gridDragX;
    const velocity = Math.abs(dx) / (Date.now() - gridTouchRef.current.startTime);
    if (Math.abs(dx) > 60 || velocity > 0.4) {
      if (dx < 0) gridNext();
      else gridPrev();
    } else if (Math.abs(dx) < 10) {
      setGridViewing(null);
    }
    setGridDragX(0);
  }, [gridDragging, gridDragX, gridNext, gridPrev]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (gridViewing) setGridViewing(null);
        else if (phase === 'viewing') dismissPhoto();
        return;
      }
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (gridViewing) { setGridViewing(null); return; }
        if (phase === 'viewing') dismissPhoto();
        else if (phase === 'idle' && mode === 'stack') pullForward();
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (gridViewing) gridNext();
        else if (phase === 'viewing') { dismissPhoto(); setTimeout(pullForward, 350); }
        else if (phase === 'idle') pullForward();
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (gridViewing) gridPrev();
        else if (phase === 'viewing') { dismissPhoto(); setTimeout(pullBackward, 350); }
        else if (phase === 'idle') pullBackward();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase, pullForward, pullBackward, dismissPhoto, mode, gridViewing, gridNext, gridPrev]);

  const seenPhotos = photos.slice(0, currentIndex);
  const unseenPhotos = photos.slice(currentIndex);

  // When viewing a photo forward, offset the tray so the next photo shows underneath
  const isForwardActive = direction === 'forward' && (phase === 'pulling' || phase === 'viewing' || phase === 'discarding');
  const trayPhotos = isForwardActive ? unseenPhotos.slice(1) : unseenPhotos;

  // ——— GRID VIEW (scattered overlap) ———
  if (mode === 'grid') {
    return (
      <div style={st.scene}>
        <style>{baseStyles}</style>
        <div style={st.header}>
          <h1 style={st.title}>{coupleNames}</h1>
        </div>
        <div style={st.scatterScroll}>
          <div style={st.scatterContainer}>
            {photos.map((photo, i) => {
              const rot = photo.stackRotation * 2.5;
              const offsetX = ((i % 3) - 1) * 18 + photo.stackX * 4;
              return (
                <div
                  key={photo.id}
                  style={{
                    ...(photo.isLandscape ? st.scatterItemLandscape : st.scatterItem),
                    zIndex: Math.min(i, 40),
                    transform: `rotate(${rot}deg) translateX(${offsetX}px)`,
                    marginTop: i < 3 ? '0px' : '-30px',
                  }}
                  onClick={() => setGridViewing(photo)}
                >
                  <div style={photo.isLandscape ? st.scatterPrintLandscape : st.scatterPrint}>
                    <img src={photo.url} alt="" style={st.scatterImg} loading="lazy" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div style={st.modeToggle} onClick={() => setMode('stack')} role="button" tabIndex={0}>
          <StackIcon />
        </div>
        {gridViewing && (
          <div
            style={st.overlay}
            onClick={() => { if (!gridDragging && Math.abs(gridDragX) < 10) setGridViewing(null); }}
            onTouchStart={onGridTouchStart}
            onTouchMove={onGridTouchMove}
            onTouchEnd={onGridTouchEnd}
          >
            <div style={{
              ...(gridViewing.isLandscape
                ? (isMobile ? st.viewPrintLandscapeMobile : st.viewPrintLandscape)
                : st.viewPrint),
              animation: gridAnimDir ? (gridAnimDir === 'left' ? 'slideOutLeft 0.2s ease forwards' : 'slideOutRight 0.2s ease forwards') : 'fadeInSimple 0.3s ease forwards',
              transform: gridDragging
                ? `translate(${gridDragX}px, 0) rotate(${gridDragX * 0.03}deg)`
                : (gridViewing.isLandscape && isMobile ? 'rotate(90deg)' : 'rotate(-0.3deg)'),
              transition: 'none',
              opacity: gridDragging ? Math.max(0.5, 1 - Math.abs(gridDragX) / 350) : 1,
            }}>
              <img src={gridViewing.url} alt="" style={st.viewImg} />
            </div>
            <div style={st.photoNum}>{gridViewing.idx + 1} / {photos.length}</div>
          </div>
        )}
      </div>
    );
  }

  // ——— STACK / TRAY VIEW ———
  return (
    <div style={st.scene}>
      <style>{baseStyles}</style>

      <div style={st.stackWorkspace}>
        {/* Seen pile */}
        <div
          style={{
            ...st.pileArea,
            cursor: seenCount > 0 && phase === 'idle' ? 'pointer' : 'default',
            opacity: lidState === 'open' ? (seenCount > 0 ? 1 : 0.3) : 0,
            pointerEvents: lidState === 'open' ? 'auto' : 'none',
          }}
          onClick={seenCount > 0 && phase === 'idle' ? pullBackward : undefined}
        >
          {seenPhotos.slice(-4).map((photo, i) => (
            <div
              key={photo.id}
              style={{
                ...st.pilePrint,
                transform: `rotate(${photo.stackRotation * 3}deg) translate(${photo.stackX * 3}px, ${photo.stackY * 2}px)`,
                zIndex: i,
              }}
            >
              <img src={photo.url} alt="" style={st.pileImg} />
            </div>
          ))}
        </div>

        {/* Tray */}
        <div style={st.trayOuter}>
          <div style={st.tray}>
            <div style={st.trayInner}>
              {unseenCount > 0 ? (
                <div
                  style={st.stackContainer}
                  onClick={phase === 'idle' ? pullForward : undefined}
                  role="button"
                  tabIndex={0}
                >
                  {trayPhotos.slice(1, 4).map((p, i) => (
                    <div
                      key={p.id}
                      style={{
                        ...st.stackedPrint,
                        transform: 'translate(0px, 0px)',
                        zIndex: 10 - (i + 1),
                        bottom: `${(i + 1) * 2}px`,
                      }}
                    >
                      <div style={st.stackedPrintInner} />
                    </div>
                  ))}
                  {trayPhotos.length > 0 ? (
                    <div style={{
                      ...(trayPhotos[0].isLandscape ? st.topPrintLandscape : st.topPrint),
                      transform: phase === 'pulling' && direction === 'forward'
                        ? (trayPhotos[0].isLandscape
                          ? 'translate(-50%,-50%) rotate(90deg) scale(0.96)'
                          : 'scale(0.96)')
                        : (trayPhotos[0].isLandscape
                          ? 'translate(-50%,-50%) rotate(90deg)'
                          : 'none'),
                      opacity: 1,
                    }}>
                      <div style={st.topPrintBorder}>
                        <img src={trayPhotos[0].url} alt="" style={st.topImg} />
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div style={st.doneState} onClick={resetGallery} role="button" tabIndex={0}>
                  <p style={st.doneAction}>start over</p>
                </div>
              )}
            </div>
          </div>

          {/* Lid */}
          {lidState !== 'open' && (
            <div
              style={lidState === 'closed' ? st.lidFull : st.lidShrinking}
              onClick={() => {
                if (lidState === 'closed') {
                  setLidState('shrinking');
                  setTimeout(() => setLidState('open'), 600);
                }
              }}
              role="button"
              tabIndex={0}
            >
              <div style={st.lidContent}>
                <p style={st.lidNames}>{coupleNames}</p>
                <p style={st.lidSub}>{sneakPeekLabel}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mode toggle */}
      <div style={st.modeToggle} onClick={() => setMode('grid')} role="button" tabIndex={0}>
        <GridIcon />
      </div>

      {/* Fullscreen view */}
      {viewingPhoto && (phase === 'viewing' || phase === 'pulling' || phase === 'discarding') && (
        <>
          <div
            style={{
              ...st.overlay,
              animation: phase === 'discarding'
                ? (direction === 'forward' ? 'discardLeft 0.32s ease-in forwards' : 'discardRight 0.32s ease-in forwards')
                : phase === 'pulling' ? 'fadeIn 0.35s cubic-bezier(0.23, 1, 0.32, 1) forwards' : undefined,
            }}
            onClick={phase === 'viewing' && !dragging ? dismissPhoto : undefined}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <div style={{
              ...(viewingPhoto.isLandscape
                ? (isMobile ? st.viewPrintLandscapeMobile : st.viewPrintLandscape)
                : st.viewPrint),
              animation: phase === 'viewing' && !dragging ? 'breathe 3.5s ease-in-out infinite' : 'none',
              transform: dragging && phase === 'viewing'
                ? `translate(${dragX}px, ${Math.abs(dragX) * 0.15}px) rotate(${dragX * 0.04}deg)`
                : (viewingPhoto.isLandscape && isMobile ? 'rotate(90deg)' : 'rotate(-0.3deg)'),
              transition: dragging ? 'none' : 'transform 0.25s ease',
              opacity: dragging ? Math.max(0.4, 1 - Math.abs(dragX) / 400) : 1,
            }}>
              <img src={viewingPhoto.url} alt="" style={st.viewImg} />
            </div>
          </div>
          <div style={{
            ...st.photoNum,
            animation: phase === 'discarding' ? 'fadeOut 0.25s ease forwards' : 'fadeIn 0.35s ease forwards',
          }}>
            {viewingPhoto.idx + 1} / {photos.length}
          </div>
        </>
      )}
    </div>
  );
}

const baseStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@300;400;500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  @keyframes fadeIn {
    0% { opacity: 0; transform: scale(0.92) translateY(16px); }
    100% { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes discardLeft {
    0% { transform: scale(1) translate(0,0) rotate(0deg); }
    100% { transform: scale(0.45) translate(-240px, 80px) rotate(-12deg); }
  }
  @keyframes discardRight {
    0% { transform: scale(1) translate(0,0) rotate(0deg); }
    100% { transform: scale(0.45) translate(240px, 80px) rotate(12deg); }
  }
  @keyframes fadeOut {
    0% { opacity: 1; }
    100% { opacity: 0; }
  }
  @keyframes fadeInSimple {
    0% { opacity: 0; }
    100% { opacity: 1; }
  }
  @keyframes slideOutLeft {
    0% { opacity: 1; transform: translateX(0) rotate(0deg); }
    100% { opacity: 0; transform: translateX(-120px) rotate(-4deg); }
  }
  @keyframes slideOutRight {
    0% { opacity: 1; transform: translateX(0) rotate(0deg); }
    100% { opacity: 0; transform: translateX(120px) rotate(4deg); }
  }
  @keyframes breathe {
    0%, 100% { box-shadow: 0 8px 40px rgba(0,0,0,0.12); }
    50% { box-shadow: 0 14px 60px rgba(0,0,0,0.2); }
  }
  @keyframes lidShrink {
    0% { opacity: 1; transform: scale(1); }
    100% { opacity: 0; transform: scale(0.95); }
  }
`;

const st: Record<string, React.CSSProperties> = {
  scene: {
    position: 'fixed',
    inset: 0,
    width: '100vw',
    height: '100vh',
    background:
      'radial-gradient(ellipse at 25% 40%, rgba(200,194,186,0.25) 0%, transparent 50%),' +
      'radial-gradient(ellipse at 75% 25%, rgba(188,183,175,0.2) 0%, transparent 45%),' +
      'radial-gradient(ellipse at 55% 75%, rgba(195,190,182,0.15) 0%, transparent 50%),' +
      'linear-gradient(160deg, #e8e4de 0%, #dfdbd4 30%, #e3dfd9 55%, #dad5ce 80%, #e1ddd7 100%)',
    overflow: 'hidden',
    fontFamily: "'DM Sans', sans-serif",
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    touchAction: 'none',
  },
  header: {
    textAlign: 'center',
    padding: '32px 20px 0',
    zIndex: 2,
  },
  title: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '22px',
    fontWeight: 400,
    fontStyle: 'italic',
    color: '#5a4f42',
    letterSpacing: '2px',
    marginBottom: '4px',
  },
  stackWorkspace: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '32px',
    padding: '0 16px',
    width: '100%',
    maxWidth: '650px',
  },
  pileArea: {
    position: 'relative',
    width: '80px',
    height: '125px',
    flexShrink: 0,
    transition: 'opacity 0.3s ease',
  },
  pilePrint: {
    position: 'absolute',
    top: 0, left: 0,
    width: '80px',
    height: '120px',
    background: '#f5f0e8',
    padding: '4px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.06)',
    display: 'flex',
    overflow: 'hidden',
  },
  pileImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  trayOuter: {
    position: 'relative',
    flexShrink: 0,
  },
  tray: {
    position: 'relative',
    width: '200px',
    height: '280px',
    borderRadius: '1px',
    background: '#e2ded8',
    boxShadow:
      'inset 0 0 0 1px rgba(255,255,255,0.5),' +
      '0 1px 2px rgba(0,0,0,0.08),' +
      '0 4px 12px rgba(0,0,0,0.06),' +
      '0 8px 24px rgba(0,0,0,0.04)',
    padding: '5px',
  },
  trayInner: {
    width: '100%',
    height: '100%',
    borderRadius: '0px',
    background:
      'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.03) 60%, transparent 100%),' +
      'linear-gradient(180deg, #b5b0a8 0%, #bfbab2 30%, #c2bdb5 70%, #b8b3ab 100%)',
    boxShadow:
      'inset 0 2px 6px rgba(0,0,0,0.12),' +
      'inset 0 -1px 3px rgba(0,0,0,0.06),' +
      'inset 2px 0 4px rgba(0,0,0,0.05),' +
      'inset -2px 0 4px rgba(0,0,0,0.05)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  lidFull: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 'min(80vw, 340px)',
    aspectRatio: '2/3',
    zIndex: 30,
    background: '#e8e4de',
    borderRadius: '1px',
    boxShadow:
      '0 4px 20px rgba(0,0,0,0.1),' +
      '0 12px 40px rgba(0,0,0,0.06),' +
      'inset 0 1px 0 rgba(255,255,255,0.6)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lidShrinking: {
    position: 'absolute',
    inset: '-2px',
    zIndex: 30,
    background: '#e8e4de',
    borderRadius: '1px',
    boxShadow:
      '0 2px 8px rgba(0,0,0,0.1),' +
      'inset 0 1px 0 rgba(255,255,255,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    animation: 'lidShrink 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards',
  },
  lidContent: {
    textAlign: 'center',
    marginTop: '-15%',
  },
  lidNames: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '18px',
    fontWeight: 400,
    color: '#5a5248',
    letterSpacing: '3px',
    textTransform: 'uppercase',
    marginBottom: '0px',
  },
  lidSub: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '13px',
    fontWeight: 400,
    fontStyle: 'italic',
    color: '#8a8078',
    letterSpacing: '1px',
  },
  stackContainer: {
    position: 'relative',
    width: '160px',
    height: '240px',
    cursor: 'pointer',
  },
  stackedPrint: {
    position: 'absolute',
    left: 0, right: 0, top: 0,
    height: '100%',
  },
  stackedPrintInner: {
    width: '100%',
    height: '100%',
    background: '#ede8e0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
  topPrint: {
    position: 'absolute',
    inset: 0,
    zIndex: 20,
  },
  topPrintLandscape: {
    position: 'absolute',
    width: '240px',
    height: '160px',
    top: '50%',
    left: '50%',
    zIndex: 20,
  },
  topPrintBorder: {
    width: '100%',
    height: '100%',
    background: '#f5f0e8',
    padding: '6px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.1), 0 1px 4px rgba(0,0,0,0.06)',
    display: 'flex',
    overflow: 'hidden',
  },
  topImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
    filter: 'brightness(0.92)',
  },
  doneState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    padding: '20px',
  },
  doneAction: {
    fontSize: '11px',
    color: '#6b6159',
    letterSpacing: '3px',
    textTransform: 'uppercase',
    fontWeight: 300,
  },
  scatterScroll: {
    flex: 1,
    overflowY: 'auto',
    width: '100%',
    padding: '20px 10px 100px',
    position: 'relative',
    zIndex: 1,
  } as React.CSSProperties,
  scatterContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: '480px',
    margin: '0 auto',
  },
  scatterItem: {
    position: 'relative',
    cursor: 'pointer',
    flexShrink: 0,
    width: '35%',
    marginLeft: '-1.5%',
    marginRight: '-1.5%',
    marginTop: '-30px',
    transition: 'transform 0.15s ease',
  },
  scatterItemLandscape: {
    position: 'relative',
    cursor: 'pointer',
    flexShrink: 0,
    width: '44%',
    marginLeft: '-1.5%',
    marginRight: '-1.5%',
    marginTop: '-30px',
    transition: 'transform 0.15s ease',
  },
  scatterPrint: {
    width: '100%',
    aspectRatio: '2/3',
    background: '#f5f0e8',
    padding: '5px',
    display: 'flex',
    boxShadow: '0 2px 12px rgba(0,0,0,0.1), 0 1px 4px rgba(0,0,0,0.06)',
  },
  scatterPrintLandscape: {
    width: '100%',
    aspectRatio: '3/2',
    background: '#f5f0e8',
    padding: '5px',
    display: 'flex',
    boxShadow: '0 2px 12px rgba(0,0,0,0.1), 0 1px 4px rgba(0,0,0,0.06)',
  },
  scatterImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  modeToggle: {
    position: 'fixed',
    bottom: '24px',
    left: '24px',
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    background: 'rgba(0,0,0,0.04)',
    border: '1px solid rgba(0,0,0,0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    zIndex: 40,
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(225, 221, 215, 0.15)',
    zIndex: 50,
    cursor: 'pointer',
    backdropFilter: 'blur(3px)',
    WebkitBackdropFilter: 'blur(3px)',
    padding: '16px',
  },
  viewPrint: {
    background: '#f5f0e8',
    padding: '12px',
    width: 'min(90vw, 540px)',
    height: 'min(80vh, 800px)',
    boxShadow: '0 12px 60px rgba(0,0,0,0.18), 0 4px 20px rgba(0,0,0,0.1)',
    transform: 'rotate(-0.3deg)',
    display: 'flex',
  },
  viewPrintLandscape: {
    background: '#f5f0e8',
    padding: '12px',
    width: 'min(92vw, 800px)',
    height: 'min(60vh, 540px)',
    boxShadow: '0 12px 60px rgba(0,0,0,0.18), 0 4px 20px rgba(0,0,0,0.1)',
    transform: 'rotate(-0.3deg)',
    display: 'flex',
  },
  viewPrintLandscapeMobile: {
    background: '#f5f0e8',
    padding: '12px',
    width: 'min(80vh, 800px)',
    height: 'min(90vw, 540px)',
    boxShadow: '0 12px 60px rgba(0,0,0,0.18), 0 4px 20px rgba(0,0,0,0.1)',
    display: 'flex',
  },
  viewImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  photoNum: {
    position: 'fixed',
    bottom: '18px',
    right: '22px',
    fontSize: '12px',
    color: '#8a8078',
    letterSpacing: '2px',
    fontWeight: 300,
    zIndex: 55,
  },
};
