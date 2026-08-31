"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from 'next-intl';
import { Compass, Navigation } from "lucide-react";

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
  const handleOrientationRef = useRef<EventListener | null>(null);

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
      if (hasPermissionRef.current === false) {
        hasPermissionRef.current = true;
        setHasPermission(true);
      }

      let compassHeading: number;

      if ((e as any).webkitCompassHeading !== undefined) {
        compassHeading = (e as any).webkitCompassHeading;
      } else if (e.absolute) {
        compassHeading = (360 - e.alpha) % 360;
      } else {
        return;
      }

      headingRef.current = compassHeading;
      setHeading(compassHeading);
    };

    handleOrientationRef.current = handleOrientation;

    const requestPermission = (
      DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<string>;
      }
    ).requestPermission;

    if (typeof requestPermission === "function") {
      requestPermission()
        .then((response: string) => {
          if (response === "granted") {
            hasPermissionRef.current = true;
            setHasPermission(true);
            window.addEventListener(
              "deviceorientation",
              handleOrientation,
              true
            );
          } else {
            setHasPermission(false);
          }
        })
        .catch(() => setHasPermission(false));
    } else if ("DeviceOrientationEvent" in window) {
      hasPermissionRef.current = true;
      setHasPermission(true);
      window.addEventListener(
        "deviceorientation",
        handleOrientation,
        true
      );
    } else {
      setHasPermission(false);
    }
  };

  useEffect(() => {
    return () => {
      if (handleOrientationRef.current) {
        window.removeEventListener(
          "deviceorientation",
          handleOrientationRef.current,
          true
        );
      }
    };
  }, []);

  const deviation = useMemo(() => {
    if (heading === null) return null;
    const diff = ((qiblaBearing - heading) % 360 + 360) % 360;
    return diff > 180 ? 360 - diff : diff;
  }, [heading, qiblaBearing]);

  const isAligned = deviation !== null && deviation < 20;

  const markerRotation = useMemo(() => {
    if (heading === null) return qiblaBearing;
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

  const isMobile = typeof window !== "undefined" && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  const hasOrientationSensor = typeof window !== "undefined" && "DeviceOrientationEvent" in window;

  if (!lat || !lng) return null;

  return (
    <div className="mt-6 mx-auto max-w-lg rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <Compass className={`w-4 h-4 ${arrowColor}`} />
        <span className="text-xs font-semibold text-foreground">
          {t('title')}
        </span>
      </div>
      <p className="text-[11px] text-muted-foreground mb-3">
        {statusText} — Distance to Kaaba: ~{Math.round(distanceKm).toLocaleString()} km
      </p>

      {!isMobile && hasOrientationSensor && !permissionRequested && (
        <button
          onClick={startListening}
          className="mb-3 w-full rounded-sm border border-gold bg-navy px-4 py-3 font-ui text-sm font-semibold text-cream transition-colors hover:bg-navy-light"
        >
          <span className="flex items-center justify-center gap-2">
            <Navigation className="w-4 h-4" />
            {t('enableCompass')}
          </span>
        </button>
      )}

      {hasPermission === false && !permissionRequested && (
        <button
          onClick={startListening}
          className="mb-3 w-full rounded-sm border border-gold bg-navy px-4 py-3 font-ui text-sm font-semibold text-cream transition-colors hover:bg-navy-light"
        >
          <span className="flex items-center justify-center gap-2">
            <Navigation className="w-4 h-4" />
            {t('enableCompass')}
          </span>
        </button>
      )}

      {hasPermission === false && permissionRequested && (
        <p className="mb-3 text-center text-xs text-destructive">
          Compass access denied. Please enable device orientation in your browser settings.
        </p>
      )}

      {!hasOrientationSensor && (
        <div className="mb-3 rounded-lg border border-dashed border-border bg-muted/30 p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">
            Compass sensor not available on this device
          </p>
          <p className="text-[10px] text-muted-foreground/70">
            Qibla direction: {qiblaBearing.toFixed(0)}° from North
          </p>
        </div>
      )}

      {(heading !== null || hasPermission === true) && (
        <>
          {/* Compass dial */}
          <div className="relative w-56 h-56 mx-auto mb-3">
            {/* Outer ring with degree markers */}
            <div className="absolute inset-0 rounded-full border-[3px] border-border shadow-lg" />

            {/* Degree markers */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
              const angle = (deg - 90) * (Math.PI / 180);
              const radius = 48;
              const x = 50 + radius * Math.cos(angle);
              const y = 50 + radius * Math.sin(angle);
              return (
                <div
                  key={deg}
                  className="absolute text-[9px] font-semibold text-muted-foreground"
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  {deg === 0 ? 'N' : deg === 90 ? 'E' : deg === 180 ? 'S' : deg === 270 ? 'W' : ''}
                </div>
              );
            })}

            {/* N label */}
            <div className="absolute inset-x-0 top-1.5 flex justify-center">
              <span className="text-[10px] font-bold text-crimson">N</span>
            </div>

            {/* Qibla direction indicator (static arc) */}
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                transform: `rotate(${qiblaBearing}deg)`,
                transformOrigin: 'center',
              }}
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1">
                <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[10px] border-l-transparent border-r-transparent border-b-crimson" />
              </div>
            </div>

            {/* Qibla arrow — rotates by relative bearing */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="transition-transform duration-300"
                style={{ transform: `rotate(${markerRotation}deg)` }}
              >
                <div className={`flex flex-col items-center ${arrowColor}`}>
                  <svg className="w-10 h-10 drop-shadow-lg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l5 9h-3v7h-4v-7h-3l5-9z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Center dot */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className={`w-4 h-4 rounded-full border-2 ${
                  isAligned
                    ? "bg-[#4a9ebb] border-[#4a9ebb] shadow-lg shadow-[#4a9ebb]/50"
                    : "bg-card border-border"
                }`}
              />
            </div>

            {/* Top bearing readout */}
            <div className="absolute top-10 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground font-semibold bg-card/80 px-1.5 py-0.5 rounded">
              {isAligned ? (
                <span className="text-[#4a9ebb] font-bold">{t('qiblaAligned')}</span>
              ) : heading !== null ? (
                <span>{markerRotation.toFixed(0)}°</span>
              ) : (
                <span>N</span>
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-between gap-3 mb-2">
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

          <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
            {t.rich('kaabaInfo', { lat: KAABA_LAT, lng: KAABA_LNG, n: qiblaBearing.toFixed(1) })}
          </p>
        </>
      )}
    </div>
  );
}
