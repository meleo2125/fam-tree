"use client";

import { useState, useTransition } from "react";
import { personSchema } from "@/lib/validation";
import { createPerson, updatePerson } from "@/app/actions/people";
import { PhotoUpload } from "@/components/PhotoUpload";
import { Loader2 } from "lucide-react";
import { Person } from "@/types";

interface PersonFormProps {
  initialData?: Partial<Person> | null;
  onSuccess?: (person: Person) => void;
  onCancel?: () => void;
}

function formatDate(dateVal?: Date | string | null): string {
  if (!dateVal) return "";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

export function PersonForm({ initialData, onSuccess, onCancel }: PersonFormProps) {
  const isEditing = Boolean(initialData?.id);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState(initialData?.name ?? "");
  const [gender, setGender] = useState<string>(initialData?.gender ?? "");
  const [dob, setDob] = useState(formatDate(initialData?.dob));
  const [dobPrecision, setDobPrecision] = useState(initialData?.dobPrecision ?? "full");
  const [phone, setPhone] = useState(initialData?.phone ?? "");
  const [email, setEmail] = useState(initialData?.email ?? "");
  const [currentPlace, setCurrentPlace] = useState(initialData?.currentPlace ?? "");
  const [nativePlace, setNativePlace] = useState(initialData?.nativePlace ?? "");
  const [occupation, setOccupation] = useState(initialData?.occupation ?? "");
  const [bloodGroup, setBloodGroup] = useState(initialData?.bloodGroup ?? "");
  const [deceased, setDeceased] = useState(initialData?.deceased ?? false);
  const [deathDate, setDeathDate] = useState(formatDate(initialData?.deathDate));
  const [notes, setNotes] = useState(initialData?.notes ?? "");
  const [photoUrl, setPhotoUrl] = useState(initialData?.photoUrl ?? null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const payload = {
      name: name.trim(),
      gender: gender ? gender : undefined,
      dob: dob || undefined,
      dobPrecision: dobPrecision as any,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      currentPlace: currentPlace.trim() || undefined,
      nativePlace: nativePlace.trim() || undefined,
      occupation: occupation.trim() || undefined,
      bloodGroup: bloodGroup || undefined,
      deceased,
      deathDate: deceased && deathDate ? deathDate : undefined,
      notes: notes.trim() || undefined,
    };

    const result = personSchema.safeParse(payload);
    if (!result.success) {
      const issue = result.error.issues[0];
      setErrorMsg(issue ? issue.message : "Validation failed");
      return;
    }

    startTransition(async () => {
      try {
        let saved: Person;
        if (isEditing && initialData?.id) {
          saved = (await updatePerson(initialData.id, payload)) as Person;
        } else {
          saved = (await createPerson(payload)) as Person;
        }
        if (onSuccess) onSuccess(saved);
      } catch (err: any) {
        setErrorMsg(err?.message || "Failed to save person.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 font-body text-sm">
      <PhotoUpload
        personId={initialData?.id}
        currentUrl={photoUrl}
        name={name}
        gender={gender}
        onPhotoUploaded={(url) => setPhotoUrl(url)}
      />

      {errorMsg && (
        <div className="p-2.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded-card">
          {errorMsg}
        </div>
      )}

      {/* 1. Name */}
      <div>
        <label className="block text-xs font-semibold text-textSecondary mb-1">
          Full Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Ramesh Kumar"
          className="w-full px-3 py-2 rounded-card border border-border bg-surface text-textPrimary placeholder:text-textSecondary/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      {/* 2. Gender */}
      <div>
        <label className="block text-xs font-semibold text-textSecondary mb-1">Gender</label>
        <select
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          className="w-full px-3 py-2 rounded-card border border-border bg-surface text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="">Unset</option>
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
          <option value="OTHER">Other</option>
        </select>
      </div>

      {/* 3. DOB + dobPrecision */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-semibold text-textSecondary mb-1">
            Date of Birth
          </label>
          <input
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            className="w-full px-3 py-2 rounded-card border border-border bg-surface text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-textSecondary mb-1">
            DOB Precision
          </label>
          <select
            value={dobPrecision}
            onChange={(e) => setDobPrecision(e.target.value)}
            className="w-full px-3 py-2 rounded-card border border-border bg-surface text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="full">Full date</option>
            <option value="year">Year only</option>
            <option value="unknown">Unknown</option>
          </select>
        </div>
      </div>

      {/* 4. Phone */}
      <div>
        <label className="block text-xs font-semibold text-textSecondary mb-1">Phone</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+91 9876543210"
          className="w-full px-3 py-2 rounded-card border border-border bg-surface text-textPrimary placeholder:text-textSecondary/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      {/* 5. Email */}
      <div>
        <label className="block text-xs font-semibold text-textSecondary mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ramesh@example.com"
          className="w-full px-3 py-2 rounded-card border border-border bg-surface text-textPrimary placeholder:text-textSecondary/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      {/* 6. Current Place */}
      <div>
        <label className="block text-xs font-semibold text-textSecondary mb-1">
          Current Place / City
        </label>
        <input
          type="text"
          value={currentPlace}
          onChange={(e) => setCurrentPlace(e.target.value)}
          placeholder="e.g. Bengaluru, Karnataka"
          className="w-full px-3 py-2 rounded-card border border-border bg-surface text-textPrimary placeholder:text-textSecondary/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      {/* 7. Native Place */}
      <div>
        <label className="block text-xs font-semibold text-textSecondary mb-1">Native Place</label>
        <input
          type="text"
          value={nativePlace}
          onChange={(e) => setNativePlace(e.target.value)}
          placeholder="e.g. Mysuru, Karnataka"
          className="w-full px-3 py-2 rounded-card border border-border bg-surface text-textPrimary placeholder:text-textSecondary/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      {/* 8. Occupation */}
      <div>
        <label className="block text-xs font-semibold text-textSecondary mb-1">Occupation</label>
        <input
          type="text"
          value={occupation}
          onChange={(e) => setOccupation(e.target.value)}
          placeholder="e.g. Civil Engineer"
          className="w-full px-3 py-2 rounded-card border border-border bg-surface text-textPrimary placeholder:text-textSecondary/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      {/* 9. Blood Group */}
      <div>
        <label className="block text-xs font-semibold text-textSecondary mb-1">Blood Group</label>
        <select
          value={bloodGroup}
          onChange={(e) => setBloodGroup(e.target.value)}
          className="w-full px-3 py-2 rounded-card border border-border bg-surface text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="">Unknown</option>
          <option value="A+">A+</option>
          <option value="A-">A-</option>
          <option value="B+">B+</option>
          <option value="B-">B-</option>
          <option value="AB+">AB+</option>
          <option value="AB-">AB-</option>
          <option value="O+">O+</option>
          <option value="O-">O-</option>
        </select>
      </div>

      {/* 10. Deceased & Death Date */}
      <div className="pt-1">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={deceased}
            onChange={(e) => setDeceased(e.target.checked)}
            className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
          />
          <span className="text-xs font-semibold text-textPrimary">Deceased</span>
        </label>

        {deceased && (
          <div className="mt-2.5">
            <label className="block text-xs font-semibold text-textSecondary mb-1">
              Date of Passing
            </label>
            <input
              type="date"
              value={deathDate}
              onChange={(e) => setDeathDate(e.target.value)}
              className="w-full px-3 py-2 rounded-card border border-border bg-surface text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        )}
      </div>

      {/* 11. Notes */}
      <div>
        <label className="block text-xs font-semibold text-textSecondary mb-1">Notes</label>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Additional family background, achievements..."
          className="w-full px-3 py-2 rounded-card border border-border bg-surface text-textPrimary placeholder:text-textSecondary/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-y"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="px-4 py-2 rounded-card border border-border text-textSecondary hover:text-textPrimary hover:bg-bg transition-colors cursor-pointer"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-1.5 px-4 py-2 rounded-card bg-primary hover:bg-primary/90 text-white font-medium shadow-sm transition-colors cursor-pointer disabled:opacity-50"
        >
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>{isEditing ? "Save Changes" : "Create Person"}</span>
        </button>
      </div>
    </form>
  );
}
