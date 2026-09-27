"use client";

import { useEffect, useState, useTransition } from "react";
import { getPersonDetail, deletePerson } from "@/app/actions/people";
import { deleteRelationship } from "@/app/actions/relationships";
import { PersonForm } from "@/components/PersonForm";
import { RelationshipPicker } from "@/components/RelationshipPicker";
import { Person } from "@/types";
import {
  X,
  ChevronLeft,
  Edit2,
  Trash2,
  Heart,
  Users,
  UserCheck,
  MapPin,
  Briefcase,
  Droplet,
  Phone,
  Mail,
  Calendar,
  FileText,
  Loader2,
} from "lucide-react";

interface PersonDetailPanelProps {
  personId: string | null;
  initialMode?: "view" | "create";
  onClose: () => void;
  onPersonUpdated?: () => void;
}

export function PersonDetailPanel({
  personId,
  initialMode = "view",
  onClose,
  onPersonUpdated,
}: PersonDetailPanelProps) {
  const [currentId, setCurrentId] = useState<string | null>(personId);
  const [history, setHistory] = useState<string[]>([]);
  const [mode, setMode] = useState<"view" | "edit" | "create">(
    initialMode === "create" ? "create" : "view"
  );
  const [personData, setPersonData] = useState<{
    person: Person;
    parents: Array<Person & { relationshipId: string }>;
    children: Array<Person & { relationshipId: string }>;
    spouses: Array<Person & { relationshipId: string; marriageDate?: Date | null; status?: any }>;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDeleting, startDeleteTransition] = useTransition();

  // Relationship picker state
  const [activePicker, setActivePicker] = useState<"SPOUSE" | "PARENT" | "CHILD" | null>(null);

  // Sync prop changes
  useEffect(() => {
    if (personId !== currentId) {
      setCurrentId(personId);
      setHistory([]);
      setMode(initialMode === "create" ? "create" : "view");
    }
  }, [personId, initialMode, currentId]);

  const fetchDetail = async (id: string) => {
    setLoading(true);
    try {
      const data = await getPersonDetail(id);
      if (data) {
        setPersonData(data);
      }
    } catch (err) {
      console.error("Failed to fetch person:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentId && mode !== "create") {
      fetchDetail(currentId);
    }
  }, [currentId, mode]);

  if (!currentId && mode !== "create") return null;

  const navigateTo = (newId: string) => {
    if (currentId) setHistory((prev) => [...prev, currentId]);
    setCurrentId(newId);
    setMode("view");
  };

  const handleBack = () => {
    if (history.length > 0) {
      const prev = history[history.length - 1];
      setHistory((h) => h.slice(0, -1));
      setCurrentId(prev);
      setMode("view");
    }
  };

  const handleDelete = () => {
    if (!currentId || !personData?.person) return;
    if (
      window.confirm(
        `Are you sure you want to delete ${personData.person.name}? This will remove all their relationships as well.`
      )
    ) {
      startDeleteTransition(async () => {
        await deletePerson(currentId);
        if (onPersonUpdated) onPersonUpdated();
        onClose();
      });
    }
  };

  const handleDeleteRel = async (relId: string) => {
    if (window.confirm("Remove this relationship link?")) {
      await deleteRelationship(relId);
      if (currentId) fetchDetail(currentId);
      if (onPersonUpdated) onPersonUpdated();
    }
  };

  const person = personData?.person;

  const initial = person?.name ? person.name.trim().charAt(0).toUpperCase() : "?";
  let avatarBg = "bg-accent/30 text-accent-dark";
  if (person?.gender === "MALE") avatarBg = "bg-male text-white";
  else if (person?.gender === "FEMALE") avatarBg = "bg-female text-white";

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity"
      />

      {/* Slide-over panel */}
      <aside className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-surface shadow-2xl flex flex-col border-l border-border transition-transform overflow-hidden">
        {/* Panel Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-bg/50">
          <div className="flex items-center gap-2">
            {history.length > 0 && mode === "view" && (
              <button
                onClick={handleBack}
                className="p-1 rounded-card text-textSecondary hover:text-textPrimary hover:bg-bg cursor-pointer"
                title="Back to previous person"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <h2 className="font-heading font-bold text-base text-textPrimary">
              {mode === "create"
                ? "Add New Person"
                : mode === "edit"
                ? "Edit Person"
                : "Person Details"}
            </h2>
          </div>

          <div className="flex items-center gap-1">
            {mode === "view" && (
              <button
                onClick={() => setMode("edit")}
                className="p-1.5 rounded-card text-textSecondary hover:text-primary hover:bg-bg cursor-pointer"
                title="Edit Details"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-card text-textSecondary hover:text-textPrimary hover:bg-bg cursor-pointer"
              title="Close Panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Panel Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {mode === "create" ? (
            <PersonForm
              onSuccess={(created) => {
                setCurrentId(created.id);
                setMode("edit"); // switch to edit mode as specified so photo upload becomes active
                if (onPersonUpdated) onPersonUpdated();
              }}
              onCancel={onClose}
            />
          ) : mode === "edit" ? (
            <PersonForm
              initialData={person}
              onSuccess={(updated) => {
                setPersonData((prev) => (prev ? { ...prev, person: updated } : null));
                setMode("view");
                if (onPersonUpdated) onPersonUpdated();
              }}
              onCancel={() => setMode("view")}
            />
          ) : loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-textSecondary">
              <Loader2 className="w-6 h-6 animate-spin mb-2 text-primary" />
              <p className="text-xs">Loading person details...</p>
            </div>
          ) : !person ? (
            <div className="text-center py-10 text-textSecondary text-xs">
              Person not found.
            </div>
          ) : (
            /* View Mode */
            <div className="space-y-6">
              {/* Photo & Name */}
              <div className="flex flex-col items-center text-center">
                {person.photoUrl ? (
                  <img
                    src={person.photoUrl}
                    alt={person.name}
                    className="w-24 h-24 rounded-full object-cover border-2 border-accent shadow-md mb-3"
                  />
                ) : (
                  <div
                    className={`w-24 h-24 rounded-full flex items-center justify-center font-heading font-bold text-3xl border-2 border-accent shadow-md mb-3 ${avatarBg}`}
                  >
                    {initial}
                  </div>
                )}
                <h3 className="font-heading font-bold text-lg text-textPrimary">
                  {person.name}
                </h3>
                {person.deceased && (
                  <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-accent/20 text-accent-dark">
                    Deceased
                  </span>
                )}
              </div>

              {/* Add Relationship Action Row */}
              <div className="bg-bg/60 p-2.5 rounded-card border border-border">
                <span className="block text-[11px] font-semibold text-textSecondary uppercase tracking-wider mb-2">
                  Add Relationship
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => setActivePicker("SPOUSE")}
                    className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-card text-xs font-medium bg-surface border border-border hover:border-primary hover:text-primary transition-colors cursor-pointer"
                  >
                    <Heart className="w-3.5 h-3.5 text-accent shrink-0" />
                    <span>Spouse</span>
                  </button>
                  <button
                    onClick={() => setActivePicker("PARENT")}
                    className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-card text-xs font-medium bg-surface border border-border hover:border-primary hover:text-primary transition-colors cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>Parent</span>
                  </button>
                  <button
                    onClick={() => setActivePicker("CHILD")}
                    className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-card text-xs font-medium bg-surface border border-border hover:border-primary hover:text-primary transition-colors cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5 text-male shrink-0" />
                    <span>Child</span>
                  </button>
                </div>
              </div>

              {/* Relationships Section */}
              <div className="space-y-3">
                <h4 className="font-heading font-semibold text-xs uppercase tracking-wider text-textSecondary border-b border-border pb-1">
                  Relationships
                </h4>

                {/* Spouses */}
                {personData.spouses.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-medium text-textSecondary">Spouse(s)</span>
                    {personData.spouses.map((s) => (
                      <div
                        key={s.id}
                        className="group flex items-center justify-between p-2 rounded-card bg-bg/50 border border-border hover:border-accent cursor-pointer transition-colors"
                      >
                        <div
                          onClick={() => navigateTo(s.id)}
                          className="flex items-center gap-2 flex-1 min-w-0"
                        >
                          <Heart className="w-3.5 h-3.5 text-accent shrink-0" />
                          <span className="font-heading font-medium text-xs text-textPrimary truncate">
                            {s.name}
                          </span>
                          {s.status && (
                            <span className="text-[10px] text-textSecondary">({s.status})</span>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteRel(s.relationshipId)}
                          className="p-1 rounded text-textSecondary hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          title="Unlink spouse"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Parents */}
                {personData.parents.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-medium text-textSecondary">Parents</span>
                    {personData.parents.map((p) => (
                      <div
                        key={p.id}
                        className="group flex items-center justify-between p-2 rounded-card bg-bg/50 border border-border hover:border-accent cursor-pointer transition-colors"
                      >
                        <div
                          onClick={() => navigateTo(p.id)}
                          className="flex items-center gap-2 flex-1 min-w-0"
                        >
                          <UserCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="font-heading font-medium text-xs text-textPrimary truncate">
                            {p.name}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteRel(p.relationshipId)}
                          className="p-1 rounded text-textSecondary hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          title="Unlink parent"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Children */}
                {personData.children.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-medium text-textSecondary">Children</span>
                    {personData.children.map((c) => (
                      <div
                        key={c.id}
                        className="group flex items-center justify-between p-2 rounded-card bg-bg/50 border border-border hover:border-accent cursor-pointer transition-colors"
                      >
                        <div
                          onClick={() => navigateTo(c.id)}
                          className="flex items-center gap-2 flex-1 min-w-0"
                        >
                          <Users className="w-3.5 h-3.5 text-male shrink-0" />
                          <span className="font-heading font-medium text-xs text-textPrimary truncate">
                            {c.name}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteRel(c.relationshipId)}
                          className="p-1 rounded text-textSecondary hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          title="Unlink child"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {personData.spouses.length === 0 &&
                  personData.parents.length === 0 &&
                  personData.children.length === 0 && (
                    <p className="text-xs text-textSecondary italic">No relationships linked yet.</p>
                  )}
              </div>

              {/* Definition list of fields */}
              <div className="space-y-3">
                <h4 className="font-heading font-semibold text-xs uppercase tracking-wider text-textSecondary border-b border-border pb-1">
                  Personal Information
                </h4>
                <dl className="grid grid-cols-1 gap-2.5 text-xs font-body">
                  {person.gender && (
                    <div className="flex justify-between py-1 border-b border-border/40">
                      <dt className="text-textSecondary">Gender</dt>
                      <dd className="font-medium text-textPrimary capitalize">
                        {person.gender.toLowerCase()}
                      </dd>
                    </div>
                  )}

                  {person.dob && (
                    <div className="flex justify-between py-1 border-b border-border/40">
                      <dt className="text-textSecondary flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-textSecondary" />
                        <span>Date of Birth</span>
                      </dt>
                      <dd className="font-medium text-textPrimary">
                        {new Date(person.dob).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                        {person.dobPrecision && person.dobPrecision !== "full" && (
                          <span className="text-[10px] text-textSecondary ml-1">
                            ({person.dobPrecision})
                          </span>
                        )}
                      </dd>
                    </div>
                  )}

                  {person.deceased && person.deathDate && (
                    <div className="flex justify-between py-1 border-b border-border/40">
                      <dt className="text-textSecondary">Date of Passing</dt>
                      <dd className="font-medium text-textPrimary">
                        {new Date(person.deathDate).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </dd>
                    </div>
                  )}

                  {person.phone && (
                    <div className="flex justify-between py-1 border-b border-border/40">
                      <dt className="text-textSecondary flex items-center gap-1">
                        <Phone className="w-3 h-3 text-textSecondary" />
                        <span>Phone</span>
                      </dt>
                      <dd className="font-medium text-textPrimary">
                        <a href={`tel:${person.phone}`} className="hover:text-primary underline">
                          {person.phone}
                        </a>
                      </dd>
                    </div>
                  )}

                  {person.email && (
                    <div className="flex justify-between py-1 border-b border-border/40">
                      <dt className="text-textSecondary flex items-center gap-1">
                        <Mail className="w-3 h-3 text-textSecondary" />
                        <span>Email</span>
                      </dt>
                      <dd className="font-medium text-textPrimary">
                        <a href={`mailto:${person.email}`} className="hover:text-primary underline">
                          {person.email}
                        </a>
                      </dd>
                    </div>
                  )}

                  {person.currentPlace && (
                    <div className="flex justify-between py-1 border-b border-border/40">
                      <dt className="text-textSecondary flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-textSecondary" />
                        <span>Current Place</span>
                      </dt>
                      <dd className="font-medium text-textPrimary">{person.currentPlace}</dd>
                    </div>
                  )}

                  {person.nativePlace && (
                    <div className="flex justify-between py-1 border-b border-border/40">
                      <dt className="text-textSecondary">Native Place</dt>
                      <dd className="font-medium text-textPrimary">{person.nativePlace}</dd>
                    </div>
                  )}

                  {person.occupation && (
                    <div className="flex justify-between py-1 border-b border-border/40">
                      <dt className="text-textSecondary flex items-center gap-1">
                        <Briefcase className="w-3 h-3 text-textSecondary" />
                        <span>Occupation</span>
                      </dt>
                      <dd className="font-medium text-textPrimary">{person.occupation}</dd>
                    </div>
                  )}

                  {person.bloodGroup && (
                    <div className="flex justify-between py-1 border-b border-border/40">
                      <dt className="text-textSecondary flex items-center gap-1">
                        <Droplet className="w-3 h-3 text-red-500" />
                        <span>Blood Group</span>
                      </dt>
                      <dd className="font-semibold text-textPrimary">{person.bloodGroup}</dd>
                    </div>
                  )}

                  {person.notes && (
                    <div className="pt-2">
                      <dt className="text-textSecondary flex items-center gap-1 mb-1">
                        <FileText className="w-3 h-3 text-textSecondary" />
                        <span>Notes</span>
                      </dt>
                      <dd className="p-2.5 rounded-card bg-bg text-textPrimary whitespace-pre-wrap leading-relaxed">
                        {person.notes}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Delete Button */}
              <div className="pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="w-full py-2 px-4 rounded-card border border-red-200 text-red-700 bg-red-50/50 hover:bg-red-50 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {isDeleting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  <span>Delete Person</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Relationship Picker Modal */}
        {activePicker && person && (
          <RelationshipPicker
            targetPersonId={person.id}
            targetPersonName={person.name}
            relationType={activePicker}
            onSuccess={() => {
              setActivePicker(null);
              if (currentId) fetchDetail(currentId);
              if (onPersonUpdated) onPersonUpdated();
            }}
            onClose={() => setActivePicker(null)}
          />
        )}
      </aside>
    </>
  );
}
