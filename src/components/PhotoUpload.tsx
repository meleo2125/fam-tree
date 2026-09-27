"use client";

import { useRef, useState, useTransition } from "react";
import { Camera, Loader2 } from "lucide-react";
import { uploadPersonPhoto } from "@/app/actions/people";

interface PhotoUploadProps {
  personId?: string;
  currentUrl?: string | null;
  name?: string;
  gender?: string | null;
  onPhotoUploaded?: (url: string) => void;
}

export function PhotoUpload({
  personId,
  currentUrl,
  name,
  gender,
  onPhotoUploaded,
}: PhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [photoUrl, setPhotoUrl] = useState<string | null>(currentUrl ?? null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!personId) {
    return (
      <div className="flex flex-col items-center justify-center p-3 mb-4 bg-bg rounded-card border border-dashed border-border">
        <div className="w-24 h-24 rounded-full bg-border/40 flex items-center justify-center text-textSecondary text-xs text-center px-2">
          Save first to add a photo
        </div>
      </div>
    );
  }

  const initial = name ? name.trim().charAt(0).toUpperCase() : "?";
  let bgClass = "bg-accent/30 text-accent-dark";
  if (gender === "MALE") bgClass = "bg-male text-white";
  else if (gender === "FEMALE") bgClass = "bg-female text-white";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("File is larger than 5MB. Please choose a smaller photo.");
      return;
    }
    setErrorMsg(null);

    const formData = new FormData();
    formData.append("photo", file);

    startTransition(async () => {
      try {
        const url = await uploadPersonPhoto(personId, formData);
        setPhotoUrl(url);
        if (onPhotoUploaded) onPhotoUploaded(url);
      } catch (err: any) {
        setErrorMsg(err?.message || "Failed to upload photo.");
      }
    });
  };

  return (
    <div className="flex flex-col items-center justify-center mb-4">
      <div className="relative group w-24 h-24">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={name ?? "Person"}
            className="w-24 h-24 rounded-full object-cover border-2 border-accent shadow-sm"
          />
        ) : (
          <div
            className={`w-24 h-24 rounded-full flex items-center justify-center font-heading font-bold text-2xl border-2 border-accent shadow-sm ${bgClass}`}
          >
            {initial}
          </div>
        )}

        {isPending ? (
          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-white hover:bg-primary/90 shadow-md transition-transform hover:scale-105 cursor-pointer"
            title="Upload photo"
          >
            <Camera className="w-4 h-4" />
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {errorMsg && (
        <p className="mt-2 text-xs text-red-600 font-body text-center">{errorMsg}</p>
      )}
    </div>
  );
}
