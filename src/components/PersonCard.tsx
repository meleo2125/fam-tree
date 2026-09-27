"use client";

import { PersonWithSpouseHint } from "@/types";
import { MapPin, Heart } from "lucide-react";

interface PersonCardProps {
  person: PersonWithSpouseHint;
  onClick: () => void;
}

function formatDobAndAge(
  dobVal?: Date | string | null,
  precision?: string | null,
  deceased?: boolean,
  deathDateVal?: Date | string | null
): string | null {
  if (!dobVal) return null;
  const dob = new Date(dobVal);
  if (isNaN(dob.getTime())) return null;

  const birthYear = dob.getFullYear();
  if (precision === "year") {
    if (deceased && deathDateVal) {
      const deathYear = new Date(deathDateVal).getFullYear();
      return `${birthYear} – ${deathYear}`;
    }
    return `b. ${birthYear}`;
  }

  const formattedDob = dob.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  if (deceased) {
    if (deathDateVal) {
      const dDate = new Date(deathDateVal);
      const formattedDeath = dDate.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      return `${formattedDob} – ${formattedDeath}`;
    }
    return `b. ${formattedDob} (Deceased)`;
  }

  // Calculate age
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  return `${formattedDob} (${age} yrs)`;
}

export function PersonCard({ person, onClick }: PersonCardProps) {
  const initial = person.name.trim().charAt(0).toUpperCase();
  let avatarBg = "bg-accent/30 text-accent-dark";
  if (person.gender === "MALE") avatarBg = "bg-male text-white";
  else if (person.gender === "FEMALE") avatarBg = "bg-female text-white";

  const dobDisplay = formatDobAndAge(
    person.dob,
    person.dobPrecision,
    person.deceased,
    person.deathDate
  );

  return (
    <div
      onClick={onClick}
      className={`group relative flex items-center gap-3 p-3.5 rounded-card bg-surface border transition-all cursor-pointer hover:shadow-md hover:border-accent ${
        person.deceased
          ? "border-accent/60 opacity-60 hover:opacity-80"
          : "border-border"
      }`}
    >
      {/* 40px circular thumbnail */}
      <div className="relative shrink-0">
        {person.photoUrl ? (
          <img
            src={person.photoUrl}
            alt={person.name}
            className="w-10 h-10 rounded-full object-cover border border-accent/40"
          />
        ) : (
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-heading font-semibold text-sm border border-accent/40 ${avatarBg}`}
          >
            {initial}
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-heading font-semibold text-textPrimary text-sm truncate group-hover:text-primary transition-colors">
            {person.name}
          </h3>
          {person.deceased && (
            <span className="text-[10px] uppercase tracking-wider font-semibold text-accent shrink-0">
              Deceased
            </span>
          )}
        </div>

        {dobDisplay && (
          <p className="text-xs font-body text-textSecondary truncate">{dobDisplay}</p>
        )}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs font-body text-textSecondary">
          {person.currentPlace && (
            <span className="flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3 text-textSecondary shrink-0" />
              <span>{person.currentPlace}</span>
            </span>
          )}
          {person.spouseHint && (
            <span className="flex items-center gap-1 text-accent font-medium truncate">
              <Heart className="w-3 h-3 text-accent shrink-0" />
              <span>{person.spouseHint}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
