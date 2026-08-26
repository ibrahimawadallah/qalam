"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from 'next-intl';
import { Compass } from "lucide-react";

interface QiblaCompassProps {
  lat: number;
  lng: number;
}

const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;
const R_EARTH = 6371;

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

function toDeg(rad: number) {
  return (rad * 180) / Math.PI;
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R_EARTH * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calculateQibla(lat: number, lng: number): number {
  const phi1 = toRad(lat);
  const phi2 = toRad(KAABA_LAT);
  const dLng = toRad(KAABA_LNG - lng);

  const y = Math.sin(dLng);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLng);

  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

export default function QiblaCompass({ lat, lng }: QiblaCompassProps) {
  const t = useTranslations('qiblaCompass');

  const [heading, setHeading] = useState<number | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [permissionRequested, setPermissionRequested] = useState(false);
  const qiblaBearing = useMemo(() => calculateQibla(lat, lng), [lat, lng]);
  const distanceKm = useMemo(() => haversine(lat, lng, KAABA_LAT, KAABA_LNG), [lat, lng]);
  const headingRef = useRef<number>(0);
  const hasPermissionRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("DeviceOrientationEvent" in window)) {
      setHasPermission(false);
      return;
    }
  }, []);

  const startListening = () => {
    setPermissionRequested(true);

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.alpha === null) return;
      if (!hasPermissionRef.current) {
        hasPermissionRef.current = true;
        setHasPermission(true);
      }

      let compassHeading: number;

      // iOS provides webkitCompassHeading (clockwise from north)
      if ((e as any).webkitCompassHeading !== undefined) {
        compassHeading = (e as any).webkitCompassHeading;
      } else if (e.absolute) {
        // Android absolute: alpha is CCW from north
        compassHeading = (360 - e.alpha) % 360;
      } else {
        // Relative orientation — not usable as compass heading
        return;
      }

      headingRef.current = compassHeading;
      setHeading(compassHeading);
    };

    const requestPermission = (
      DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<string>;
      }
    ).requestPermission;

    if (typeof requestPermission === "function") {
      requestPermission()
        .then((response: string) => {
          if (response === "granted") {
            setHasPermission(true);
            window.addEventListener(
              "deviceorientation",
              handleOrientation as EventListener,
              true
            );
          } else {
            setHasPermission(false);
          }
        })
        .catch(() => setHasPermission(false));
    } else if ("DeviceOrientationEvent" in window) {
      setHasPermission(true);
      window.addEventListener(
        "deviceorientation",
        handleOrientation as EventListener,
        true
      );
    } else {
      setHasPermission(false);
    }
  };

  useEffect(() => {
    return () => {
      window.removeEventListener(
        "deviceorientation",
        () => {},
        true
      );
    };
  }, []);

  const deviation = useMemo(() => {
    if (heading === null) return null;
    const diff = ((qiblaBearing - heading) % 360 + 360) % 360;
    return diff > 180 ? 360 - diff : diff;
  }, [heading, qiblaBearing]);

  const isAligned = deviation !== null && deviation < 20;

  const markerRotation = useMemo(() => {
    if (heading === null) return 0;
    return ((qiblaBearing - heading + 360) % 360);
  }, [heading, qiblaBearing]);

  const arrowColor =
    deviation === null
      ? "text-muted-foreground"
      : isAligned
        ? "text-[#4a9ebb]"
        : "text-destructive";

  const statusText =
    deviation === null
      ? t('rotateDevice')
      : isAligned
        ? t('facingQibla')
        : t.rich('offQibla', { n: Math.round(deviation) });

  // No geolocation passed yet
  if (!lat || !lng) return null;

  return (
    <div className="mt-6 mx-auto max-w-lg rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Compass className={`w-4 h-4 ${arrowColor}`} />
        <span className="text-xs font-semibold text-foreground">
          {t('title')}
        </span>
      </div>
      <p className="text-[11px] text-muted-foreground mb-2">
        {statusText} — Distance to Kaaba: ~{Math.round(distanceKm).toLocaleString()} km
      </p>

      {/* Permission button (iOS needs user gesture) */}
      {hasPermission === false && (
        <button
          onClick={startListening}
         className="mb-3 w-full rounded-sm border border-gold bg-emerald-deep px-4 py-3 font-ui text-sm font-semibold text-ivory transition-colors hover:bg-emerald-mid"
       >
         {t('enableCompass')}
       </button>
      )}

      {/* Compass dial */}
      <div className="relative w-48 h-48 mx-auto mb-3">
        <div className="absolute inset-0 rounded-full border-2 border-border" />

        {/* N label */}
         <div className="absolute inset-x-0 bottom-2 flex justify-center">
           <span className="text-[10px] text-muted-foreground font-semibold">{t('north')}</span>
         </div>

        {/* Qibla arrow — rotates by relative bearing */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-full relative">
            <div
              className="absolute left-0 right-0 top-1 flex justify-center transition-transform duration-300"
              style={{ transform: `rotate(${markerRotation}deg)` }}
            >
              <div className={`flex flex-col items-center ${arrowColor}`}>
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l5 9h-3v7h-4v-7h-3l5-9z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Center dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={`w-3 h-3 rounded-full ${
              isAligned
                ? "bg-[#4a9ebb] shadow-lg shadow-[#4a9ebb]/50"
                : "bg-muted"
            }`}
          />
        </div>

        {/* Top bearing readout */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground font-semibold">
           {isAligned ? (
             <span className="text-[#4a9ebb]">{t('qiblaAligned')}</span>
           ) : heading !== null ? (
            <span>{markerRotation.toFixed(0)}°</span>
          ) : (
            <span>N</span>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-destructive" />
           <span>
             {t.rich('notAligned', { n: qiblaBearing.toFixed(0) })}
           </span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-[#4a9ebb]">
          <span className="w-2 h-2 rounded-full bg-[#4a9ebb]" />
           <span>{t('aligned')}</span>
        </div>
      </div>

       <p className="mt-2 text-[10px] text-muted-foreground/60 leading-relaxed">
         {t.rich('kaabaInfo', { lat: KAABA_LAT, lng: KAABA_LNG, n: qiblaBearing.toFixed(1) })}
       </p>
    </div>
  );
}
