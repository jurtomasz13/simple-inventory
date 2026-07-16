import { BrowserCodeReader, BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";
import { Camera, ImageUp, LoaderCircle, ScanLine } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { productCodeFromScan } from "@/utils/barcode";
import { cn } from "@/utils/cn";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";

const supportedFormats = [
  BarcodeFormat.QR_CODE,
  BarcodeFormat.DATA_MATRIX,
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
  BarcodeFormat.CODE_128,
  BarcodeFormat.CODE_39,
  BarcodeFormat.ITF,
];

const createReader = () => {
  const hints = new Map<DecodeHintType, unknown>();
  hints.set(DecodeHintType.POSSIBLE_FORMATS, supportedFormats);
  hints.set(DecodeHintType.TRY_HARDER, true);
  return new BrowserMultiFormatReader(hints, {
    delayBetweenScanAttempts: 120,
    delayBetweenScanSuccess: 800,
    tryPlayVideoTimeout: 5000,
  });
};

type BarcodeScannerButtonProps = {
  onDetected: (code: string) => void;
  label?: string;
  iconOnly?: boolean;
  className?: string;
  disabled?: boolean;
};

export function BarcodeScannerButton({
  onDetected,
  label = "Skanuj kod",
  iconOnly = false,
  className,
  disabled,
}: BarcodeScannerButtonProps) {
  const [open, setOpen] = useState(false);

  const acceptCode = (rawValue: string) => {
    const code = productCodeFromScan(rawValue);
    if (!code) return;
    setOpen(false);
    onDetected(code);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size={iconOnly ? "icon" : "default"}
          className={className}
          disabled={disabled}
          aria-label={label}
        >
          <ScanLine />
          {!iconOnly && label}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-1rem)] overflow-y-auto rounded-xl p-4 sm:max-w-2xl sm:p-6">
        <DialogHeader className="pr-8">
          <DialogTitle className="text-2xl">Zeskanuj kod produktu</DialogTitle>
          <DialogDescription>Skieruj tylny aparat na QR, EAN, UPC lub Code 128. Kod zostanie przyjęty automatycznie.</DialogDescription>
        </DialogHeader>
        {open && <ScannerCamera onDetected={acceptCode} />}
      </DialogContent>
    </Dialog>
  );
}

function ScannerCamera({ onDetected }: { onDetected: (value: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const resultAcceptedRef = useRef(false);
  const activeRef = useRef(true);
  const onDetectedRef = useRef(onDetected);
  const [cameraError, setCameraError] = useState("");
  const [isCameraStarting, setIsCameraStarting] = useState(true);
  const [isPhotoScanning, setIsPhotoScanning] = useState(false);
  const [photoError, setPhotoError] = useState("");

  useEffect(() => {
    onDetectedRef.current = onDetected;
  }, [onDetected]);

  const finish = useCallback((value: string) => {
    if (!activeRef.current || resultAcceptedRef.current) return;
    resultAcceptedRef.current = true;
    controlsRef.current?.stop();
    onDetectedRef.current(value);
  }, []);

  useEffect(() => {
    let cancelled = false;
    activeRef.current = true;
    const videoElement = videoRef.current;

    const startCamera = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("Ta przeglądarka nie udostępnia aparatu stronie. Użyj zdjęcia kodu poniżej.");
        setIsCameraStarting(false);
        return;
      }

      if (!window.isSecureContext) {
        setCameraError("Podgląd aparatu wymaga połączenia HTTPS. Nadal możesz zrobić zdjęcie kodu przyciskiem poniżej.");
        setIsCameraStarting(false);
        return;
      }

      try {
        const reader = createReader();
        const controls = await reader.decodeFromConstraints(
          {
            audio: false,
            video: {
              facingMode: { ideal: "environment" },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          },
          videoElement ?? undefined,
          (result) => {
            if (result) finish(result.getText());
          }
        );

        if (cancelled) controls.stop();
        else controlsRef.current = controls;
      } catch (error) {
        if (cancelled) return;
        const name = error instanceof DOMException ? error.name : "";
        setCameraError(
          name === "NotAllowedError"
            ? "Dostęp do aparatu został zablokowany. Zezwól na aparat w ustawieniach strony albo użyj zdjęcia."
            : "Nie udało się uruchomić aparatu. Sprawdź uprawnienia lub użyj zdjęcia kodu."
        );
      } finally {
        if (!cancelled) setIsCameraStarting(false);
      }
    };

    void startCamera();

    return () => {
      cancelled = true;
      activeRef.current = false;
      controlsRef.current?.stop();
      controlsRef.current = null;
      if (videoElement) BrowserCodeReader.cleanVideoSource(videoElement);
    };
  }, [finish]);

  const scanPhoto = async (file?: File) => {
    if (!file) return;
    setIsPhotoScanning(true);
    setPhotoError("");
    const imageUrl = URL.createObjectURL(file);

    try {
      const result = await createReader().decodeFromImageUrl(imageUrl);
      finish(result.getText());
    } catch {
      if (activeRef.current) setPhotoError("Nie rozpoznano kodu. Zrób wyraźne zdjęcie z całym kodem w kadrze i spróbuj ponownie.");
    } finally {
      URL.revokeObjectURL(imageUrl);
      if (activeRef.current) {
        setIsPhotoScanning(false);
        if (fileRef.current) fileRef.current.value = "";
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative aspect-[4/3] max-h-[58dvh] overflow-hidden rounded-xl bg-slate-950">
        <video ref={videoRef} muted playsInline className={cn("size-full object-cover", cameraError && "opacity-20")} />
        {!cameraError && <div className="pointer-events-none absolute inset-[14%] rounded-lg border-2 border-white/90 shadow-[0_0_0_999px_rgba(0,0,0,0.25)]"><span className="absolute inset-x-5 top-1/2 h-0.5 bg-red-400/90 shadow-[0_0_10px_rgba(248,113,113,0.9)]" /></div>}
        {isCameraStarting && <div className="absolute inset-0 grid place-items-center text-white"><div className="text-center"><LoaderCircle className="mx-auto size-8 animate-spin" /><p className="mt-3 text-sm font-semibold">Uruchamiam aparat…</p></div></div>}
        {cameraError && !isCameraStarting && <div className="absolute inset-0 grid place-items-center p-6 text-center text-white"><div><Camera className="mx-auto size-9 text-white/70" /><p className="mt-3 max-w-md text-sm font-semibold leading-6">{cameraError}</p></div></div>}
      </div>

      <div className="rounded-2xl border bg-muted/60 p-3">
        <p className="text-sm font-bold">Aparat nie łapie kodu?</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">Zrób zdjęcie z bliska. Ta opcja działa także wtedy, gdy podgląd na żywo jest zablokowany.</p>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="sr-only" onChange={(event) => void scanPhoto(event.target.files?.[0])} />
        <Button type="button" variant="outline" className="mt-3 w-full bg-white" onClick={() => fileRef.current?.click()} disabled={isPhotoScanning}>
          {isPhotoScanning ? <LoaderCircle className="animate-spin" /> : <ImageUp />}
          {isPhotoScanning ? "Odczytuję zdjęcie…" : "Zrób lub wybierz zdjęcie"}
        </Button>
        {photoError && <p className="mt-2 text-sm font-medium text-red-700">{photoError}</p>}
      </div>
    </div>
  );
}
