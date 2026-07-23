"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Compass } from "lucide-react";

interface QiblaCompassProps {
  lat: number;
  lng: number;
}

const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

function calculateQibla(lat: number, lng: number): number {
  const φ1 = toRad(lat);
  const φ2 = toRad(KAABA_LAT);
  const Δλ = toRad(KAABA_LNG - lng);
  const y = Math.sin(Δλ);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  let bearing = Math.atan2(y, x) * (180 / Math.PI);
  return (bearing + 360) % 360;
}

export default function QiblaCompass({ lat, lng }: QiblaCompassProps) {
  const [heading, setHeading] = useState<number | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [needsOrientation, setNeedsOrientation] = useState(false);
  const qiblaBearing = useMemo(() => calculateQibla(lat, lng), [lat, lng]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const alphaRef = useRef(0);
  const lastAlpha = useRef<number | null>(null);
  const enabled = hasPermission !== false;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (url.searchParams.get("qibla") !== "force") {
      setHasPermission(null);
      return;
    }
    setNeedsOrientation(true);
    setHasPermission(false);
  }, []);

  useEffect(() => {
    if (!enabled || heading !== null) return;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.alpha !== null) {
        setHasPermission(true);
        const alpha = e.alpha;
        const raw = alpha;
        if (lastAlpha.current !== null) {
          let delta = raw - lastAlpha.current;
          if (delta > 180) delta -= 360;
          if (delta < -180) delta += 360;
          alphaRef.current = (alphaRef.current + delta + 360) % 360;
        } else {
          alphaRef.current = raw;
        }
        lastAlpha.current = alphaRef.current;
        setHeading(alphaRef.current);
      }
    };

    const handleMotion = (e: DeviceMotionEvent) => {
      const rate = e.rotationRate;
      if (rate && rate.alpha !== null) {
        const dA = rate.alpha * 0.016;
        alphaRef.current = (alphaRef.current + dA + 360) % 360;
        setHeading(alphaRef.current);
      }
    };

    const requestPermission = (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission;

    if (typeof requestPermission === "function") {
      requestPermission()
        .then((response: string) => {
          if (response === "granted") {
            setHasPermission(true);
            window.addEventListener("deviceorientation", handleOrientation as any, true);
          } else {
            setHasPermission(false);
          }
        })
        .catch(() => {
          setHasPermission(false);
        });
    } else if ("DeviceOrientationEvent" in window) {
      setHasPermission(true);
      window.addEventListener("deviceorientation", handleOrientation as any, true);
    } else {
      setHasPermission(false);
    }

    return () => {
      window.removeEventListener("deviceorientation", handleOrientation as any, true);
      window.removeEventListener("devicemotion", handleMotion as any, true);
    };
  }, [enabled]);

  useEffect(() => {
    if (heading === null) return;
    const tick = () => setHeading((prev) => (prev !== null ? (prev + 0.05) % 360 : prev));
    const id = setInterval(tick, 50);
    return () => clearInterval(id);
  }, [heading === null ? "undef" : heading]);

  const deviation = useMemo(() => {
    if (heading === null) return null;
    const diff = ((qiblaBearing - heading) % 360 + 360) % 360;
    const dist = diff > 180 ? 360 - diff : diff;
    return dist;
  }, [heading, qiblaBearing]);

  const isAligned = deviation !== null && deviation < 20;

  const markerRotation = useMemo(() => {
    if (heading === null) return 0;
    return ((qiblaBearing - heading) % 360 + 360) % 360;
  }, [heading, qiblaBearing]);

  const arrowColor = deviation === null
    ? "text-amber-300/40"
    : isAligned
      ? "text-emerald-400"
      : "text-red-400";

  const statusText = deviation === null
    ? "Rotate your device to find Qibla direction"
    : isAligned
      ? "✓ You are facing Qibla"
      : `${Math.round(deviation)}° off Qibla direction`;

  return (
    <div className="mt-6 mx-auto max-w-lg rounded-2xl border border-amber-500/10 bg-amber-500/5 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Compass className={`w-4 h-4 ${arrowColor}`} />
        <span className="text-xs font-semibold text-amber-200">اتجاه القبلة — Qibla Direction</span>
      </div>
      <p className="text-[11px] text-amber-300/50 mb-2">
        {statusText} — Distance to Kaaba: ~2,250 km
      </p>

      <div className="relative w-48 h-48 mx-auto mb-3">
        <div className="absolute inset-0 rounded-full border-2 border-amber-500/20" />
        <div className="absolute inset-0 rounded-full border border-amber-500/5 border-dashed animate-[spin_60s_linear_infinite]" />

        <div className="absolute inset-x-0 bottom-2 flex justify-center">
          <span className="text-[10px] text-amber-300/40 font-semibold">N</span>
        </div>

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-full relative">
            <div
              className="absolute left-0 right-0 top-1 flex justify-center transition-transform duration-200"
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

        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`w-3 h-3 rounded-full ${isAligned ? "bg-emerald-400 shadow-lg shadow-emerald-400/50" : "bg-amber-400/30"}`} />
        </div>

        <div
          className={`absolute top-2 left-1/2 -translate-x-1/2 text-[10px] text-amber-300/60 font-semibold`}
        >
          {isAligned ? (
            <span className="text-emerald-400">QIBLA ✓</span>
          ) : (
            <span>{(markerRotation % 360).toFixed(0)}°</span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-[10px] text-amber-300/50">
          <span className="w-2 h-2 rounded-full bg-red-400" />
          <span>Not aligned (turn toward {qiblaBearing.toFixed(0)}° magnetic)</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Aligned (within 20°)</span>
        </div>
      </div>

      <p className="mt-2 text-[10px] text-amber-300/40 leading-relaxed">
        Kaaba: {KAABA_LAT}°N, {KAABA_LNG}°E · Qibla bearing from your location:{" "}
        {qiblaBearing.toFixed(1)}°
      </p>
    </div>
  );
}
