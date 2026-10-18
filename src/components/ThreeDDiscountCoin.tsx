import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ThreeDDiscountCoinProps {
  size?: number; // Boyut piksel cinsinden (varsayılan: 50)
  className?: string;
}

/**
 * Gerçek WebGL 3D Dönen İndirim Sembolü (%)
 * Three.js ile oluşturulmuş gerçek döküm metal kütleli, pürüzsüz 3 boyutlu
 * yüzde işareti. Dönerken kağıt gibi kesilmez; gerçek boru, pah ve silindirik
 * kütlesiyle kusursuz bir 3D deneyim sunar.
 */
export const ThreeDDiscountCoin: React.FC<ThreeDDiscountCoinProps> = ({
  size = 50,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let animationFrameId: number;
    let renderer: THREE.WebGLRenderer | null = null;
    let isDisposed = false;
    let isVisibleOnScreen = true;

    try {
      // Düşük donanımlı telefon tespiti (Daha az çekirdek veya düşük RAM)
      const isMobileOrLowEnd =
        (typeof window !== 'undefined' && window.innerWidth < 768) ||
        (typeof navigator !== 'undefined' && ((navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) || (navigator as any).deviceMemory <= 3));

      // 1. Sahne ve Kamera Kurulumu
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 20);
      camera.position.set(0, 0, 4.8);

      // 2. WebGL Renderer (Şeffaf arkaplan, mobil için optimize pixel ratio)
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: !isMobileOrLowEnd,
        powerPreference: 'low-power',
      });
      renderer.setSize(size, size);
      // Eski telefonlarda pixel ratio 1 tutularak GPU GPU doldurma yükü 4 kat hafifletilir
      renderer.setPixelRatio(isMobileOrLowEnd ? 1 : Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.35;

      // 3. 3D Yüzde (%) Sembolü Geometrisi (Düşük poligon sayısı ile ultra hızlı render)
      const goldMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#ffb703'),
        roughness: 0.22,
        metalness: 0.9,
        emissive: new THREE.Color('#d97706'),
        emissiveIntensity: 0.14,
      });

      const percentGroup = new THREE.Group();

      // (A) Çapraz Köşeli ve Tok 3D Altın Külçe Çubuk (Kullanıcı İsteği: Köşeli olsun, yassı olmasın)
      const barGeometry = new THREE.BoxGeometry(0.28, 2.15, 0.28);
      const barMesh = new THREE.Mesh(barGeometry, goldMaterial);
      barMesh.rotation.z = -Math.PI / 4;
      percentGroup.add(barMesh);

      // (B) Üst Sol 3D Torus
      const torusGeometry = new THREE.TorusGeometry(0.46, 0.16, isMobileOrLowEnd ? 10 : 16, isMobileOrLowEnd ? 16 : 24);
      const topTorus = new THREE.Mesh(torusGeometry, goldMaterial);
      topTorus.position.set(-0.66, 0.66, 0);
      percentGroup.add(topTorus);

      // (C) Alt Sağ 3D Torus
      const bottomTorus = new THREE.Mesh(torusGeometry, goldMaterial);
      bottomTorus.position.set(0.66, -0.66, 0);
      percentGroup.add(bottomTorus);

      scene.add(percentGroup);

      // 4. Optimize Işıklandırma (Mobil için minimal ve parlak)
      const keyLight = new THREE.DirectionalLight(0xfffbeb, 3.2);
      keyLight.position.set(3.5, 4.0, 4.0);
      scene.add(keyLight);

      const fillLight = new THREE.DirectionalLight(0xf59e0b, 2.0);
      fillLight.position.set(-3.5, -2.5, 2.5);
      scene.add(fillLight);

      const ambientLight = new THREE.AmbientLight(0xffedd5, 1.2);
      scene.add(ambientLight);

      // 5. IntersectionObserver: Ekranda görünmüyorken render döngüsünü tamamen durdur (0% CPU/GPU)
      const observer = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          isVisibleOnScreen = entry.isIntersecting;
          if (isVisibleOnScreen && !isDisposed) {
            lastTime = performance.now();
            cancelAnimationFrame(animationFrameId);
            animationFrameId = requestAnimationFrame(animate);
          }
        },
        { threshold: 0.05 }
      );
      observer.observe(container);

      // 6. 60 FPS Canlı Dönüş Döngüsü (Sadece ekrandayken çalışır)
      let lastTime = performance.now();
      const startTime = performance.now();

      const animate = (now: number) => {
        if (isDisposed || !isVisibleOnScreen) return;

        animationFrameId = requestAnimationFrame(animate);

        const currentTime = typeof now === 'number' && !isNaN(now) ? now : performance.now();
        const delta = Math.min(Math.max((currentTime - lastTime) / 1000, 0.001), 0.1);
        lastTime = currentTime;
        const elapsedTime = (currentTime - startTime) / 1000;

        percentGroup.rotation.y += delta * 1.85;
        percentGroup.rotation.x = Math.sin(elapsedTime * 1.6) * 0.18 + 0.14;
        percentGroup.rotation.z = Math.cos(elapsedTime * 1.3) * 0.08;
        percentGroup.position.y = Math.sin(elapsedTime * 2.2) * 0.07;

        renderer?.render(scene, camera);
      };

      animationFrameId = requestAnimationFrame(animate);

      // 7. Temizlik
      return () => {
        isDisposed = true;
        cancelAnimationFrame(animationFrameId);
        observer.disconnect();

        barGeometry.dispose();
        torusGeometry.dispose();
        goldMaterial.dispose();

        renderer?.dispose();
        renderer?.forceContextLoss();
      };
    } catch (err) {
      console.warn('[ThreeDDiscountCoin WebGL init error, using SVG fallback]', err);
      setWebGlFailed(true);
    }
  }, [size]);

  const [webGlFailed, setWebGlFailed] = React.useState(false);

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center justify-center select-none pointer-events-none ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
      }}
      aria-hidden="true"
    >
      {/* 1. Lüks Arka Plan Spot Işığı / Amber-Altın Ambient Işıltı */}
      <div
        className="absolute inset-0 rounded-full animate-elite-aura pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at center, rgba(251, 191, 36, 0.4) 0%, rgba(249, 115, 22, 0.22) 45%, transparent 70%)',
          transform: 'scale(1.28)',
          filter: 'blur(4px)',
        }}
      />

      {/* 2. Zemin 3D Gölgesi */}
      <div
        className="absolute bottom-0 w-3/4 h-2.5 rounded-full pointer-events-none animate-elite-shadow"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(0, 0, 0, 0.75) 0%, rgba(245, 158, 11, 0.25) 45%, transparent 75%)',
          filter: 'blur(2px)',
        }}
      />

      {/* 3. Gerçek Three.js WebGL 3D Tuvali veya Fallback */}
      {webGlFailed ? (
        <div className="relative z-10 w-full h-full flex items-center justify-center animate-elite-discount-spin">
          <svg viewBox="0 0 100 100" className="w-[80%] h-[80%] fill-none drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]">
            <line x1="76" y1="24" x2="24" y2="76" stroke="#f59e0b" strokeWidth="16" strokeLinecap="square" />
            <circle cx="30" cy="30" r="14" stroke="#f59e0b" strokeWidth="8.5" />
            <circle cx="70" cy="70" r="14" stroke="#f59e0b" strokeWidth="8.5" />
          </svg>
        </div>
      ) : (
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          className="relative z-10 w-full h-full drop-shadow-[0_4px_10px_rgba(0,0,0,0.65)]"
        />
      )}
    </div>
  );
};
