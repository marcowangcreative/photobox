'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

interface PhotoData {
  id: string;
  url: string;
  is_landscape: boolean;
  sort_order: number;
}

interface PhotoGalleryProps {
  coupleNames: string;
  sneakPeekLabel: string;
  photos: PhotoData[];
  galleryUrl: string;
}

export default function PhotoGallery({
  coupleNames,
  sneakPeekLabel,
  photos: rawPhotos,
  galleryUrl,
}: PhotoGalleryProps) {
  const photos = rawPhotos.map((p, i) => ({
    ...p,
    idx: i,
    stackRotation: (Math.random() - 0.5) * 2.5,
    stackX: (Math.random() - 0.5) * 4,
    stackY: (Math.random() - 0.5) * 3,
  }));

  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<'idle' | 'pulling' | 'viewing' | 'discarding'>('idle');
  const [viewingPhoto, setViewingPhoto] = useState<typeof photos[0] | null>(null);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [mode, setMode] = useState<'stack' | 'grid'>('stack');
  const [gridViewing, setGridViewing] = useState<typeof photos[0] | null>(null);
  const [lidState, setLidState] = useState<'closed' | 'shrinking' | 'open'>('closed');
  const [isMobile, setIsMobile] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const touchRef = useRef({ startX: 0, startY: 0, startTime: 0 });

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Preload images
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
    setCurrentIndex(0);
    setViewingPhoto(null);
    setPhase('idle');
    setLidState('closed');
  }, []);

  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

  // Share functionality
  async function handleShare(e: React.MouseEvent, photo: typeof photos[0]) {
    e.stopPropagation();
    // Generate share image with canvas
    const canvas = document.createElement('canvas');
    const W = 1080, H = 1350;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#e2ded8';
    ctx.fillRect(0, 0, W, H);

    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = photo.url;
    await new Promise(res => { img.onload = res; });

    const printW = photo.is_landscape ? 700 : 560;
    const printH = photo.is_landscape ? 560 : 700;
    const b = 24, px = (W - printW) / 2, py = 260;

    ctx.shadowColor = 'rgba(0,0,0,0.2)';
    ctx.shadowBlur = 40; ctx.shadowOffsetY = 8;
    ctx.fillStyle = '#f5f0e8';
    ctx.save();
    ctx.translate(px + printW / 2, py + printH / 2);
    ctx.rotate(-0.008);
    ctx.fillRect(-printW / 2, -printH / 2, printW, printH);
    ctx.shadowColor = 'transparent';
    ctx.drawImage(img, -printW / 2 + b, -printH / 2 + b, printW - b * 2, printH - b * 2);
    ctx.restore();

    ctx.shadowColor = 'transparent';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#8a7d6e'; ctx.font = "300 28px 'Helvetica Neue', sans-serif";
    ctx.fillText(`${photo.idx + 1}  of  ${photos.length} prints`, W / 2, py + printH + 70);
    ctx.fillStyle = '#5a4f42'; ctx.font = "400 42px 'Georgia', serif";
    ctx.fillText(coupleNames, W / 2, 130);
    ctx.fillStyle = '#8a8078'; ctx.font = "300 22px 'Helvetica Neue', sans-serif";
    ctx.fillText('open the box', W / 2, 170);
    ctx.fillStyle = '#9a9088'; ctx.font = "300 18px 'Helvetica Neue', sans-serif";
    ctx.fillText(galleryUrl, W / 2, H - 50);

    const blob = await new Promise<Blob>(res => canvas.toBlob(b => res(b!), 'image/jpeg', 0.92));
    const file = new File([blob], `print-${photo.idx + 1}.jpg`, { type: 'image/jpeg' });

    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: `${coupleNames} — Print ${photo.idx + 1}` });
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = file.name; a.click();
      URL.revokeObjectURL(url);
    }
  }

  const seenPhotos = photos.slice(0, currentIndex);
  const unseenPhotos = photos.slice(currentIndex);

  // The component renders the same gallery experience we built
  // Full implementation would be the same JSX from the prototype
  // with photos[i].url replacing the base64 src

  return (
    <div>
      {/* Full gallery component JSX goes here */}
      {/* This is a placeholder - copy the working JSX from the prototype */}
      {/* replacing photo.src with photo.url */}
    </div>
  );
}
