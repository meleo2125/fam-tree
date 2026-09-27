"use client";

import { useState, useEffect, useTransition } from "react";
import { SearchBar } from "@/components/SearchBar";
import { PersonForm } from "@/components/PersonForm";
import { createRelationship } from "@/app/actions/relationships";
import { Person } from "@/types";
import { X, UserPlus, Users, Loader2 } from "lucide-react";

interface RelationshipPickerProps {
  targetPersonId: string;
  targetPersonName: string;
  relationType: "SPOUSE" | "PARENT" | "CHILD";
  onSuccess: () => void;
  onClose: () => void;
}

export function RelationshipPicker({
  targetPersonId,
  targetPersonName,
  relationType,
  onSuccess,
  onClose,
}: RelationshipPickerProps) {
  const [tab, setTab] = useState<"search" | "create">("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Person[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  // Spouse-specific fields
  const [marriageDate, setMarriageDate] = useState("");
  const [status, setStatus] = useState<"MARRIED" | "DIVORCED" | "WIDOWED">("MARRIED");

  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const titleMap = {
    SPOUSE: `Add Spouse for ${targetPersonName}`,
    PARENT: `Add Parent for ${targetPersonName}`,
    CHILD: `Add Child for ${targetPersonName}`,
  };

  // Debounced search
  useEffect(() => {
    if (tab !== "search") return;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/people?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data: Person[] = await res.json();
          // Filter out the current target person
          setResults(data.filter((p) => p.id !== targetPersonId));
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, tab, targetPersonId]);

  const handleLinkRelationship = (chosenPersonId: string) => {
    setErrorMsg(null);
    startTransition(async () => {
      try {
        if (relationType === "SPOUSE") {
          await createRelationship({
            type: "SPOUSE",
            personAId: targetPersonId,
            personBId: chosenPersonId,
            marriageDate: marriageDate || undefined,
            status,
          });
        } else if (relationType === "PARENT") {
          // Parent is chosenPersonId, Child is targetPersonId
          await createRelationship({
            type: "PARENT_CHILD",
            personAId: chosenPersonId,
            personBId: targetPersonId,
          });
        } else if (relationType === "CHILD") {
          // Parent is targetPersonId, Child is chosenPersonId
          await createRelationship({
            type: "PARENT_CHILD",
            personAId: targetPersonId,
            personBId: chosenPersonId,
          });
        }
        onSuccess();
      } catch (err: any) {
        setErrorMsg(err?.message || "Failed to link relationship.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-surface rounded-card border border-border shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-bg/50">
          <div>
            <h2 className="font-heading font-bold text-base text-textPrimary">
              {titleMap[relationType]}
            </h2>
            <p className="text-xs font-body text-textSecondary">
              Select an existing relative or create a new entry
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-card text-textSecondary hover:text-textPrimary hover:bg-bg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-border px-4 pt-2 gap-2 bg-surface">
          <button
            type="button"
            onClick={() => setTab("search")}
            className={`flex items-center gap-1.5 pb-2 px-3 text-xs font-semibold border-b-2 cursor-pointer transition-colors ${
              tab === "search"
                ? "border-primary text-primary"
                : "border-transparent text-textSecondary hover:text-textPrimary"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Find Existing</span>
          </button>
          <button
            type="button"
            onClick={() => setTab("create")}
            className={`flex items-center gap-1.5 pb-2 px-3 text-xs font-semibold border-b-2 cursor-pointer transition-colors ${
              tab === "create"
                ? "border-primary text-primary"
                : "border-transparent text-textSecondary hover:text-textPrimary"
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create New Person</span>
          </button>
        </div>

        {/* Content body */}
        <div className="p-4 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-2.5 mb-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-card">
              {errorMsg}
            </div>
          )}

          {tab === "search" ? (
            <div className="space-y-4">
              <SearchBar
                value={query}
                onChange={setQuery}
                placeholder="Search person by name..."
                isLoading={searching}
              />

              {/* Selected person details + spouse options */}
              {selectedPerson ? (
                <div className="p-3 rounded-card bg-primary/5 border border-primary/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-textSecondary">Selected Person:</span>
                      <h4 className="font-heading font-semibold text-textPrimary text-sm">
                        {selectedPerson.name}
                      </h4>
                      {selectedPerson.currentPlace && (
                        <p className="text-xs text-textSecondary">{selectedPerson.currentPlace}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedPerson(null)}
                      className="text-xs text-primary underline cursor-pointer"
                    >
                      Change
                    </button>
                  </div>

                  {relationType === "SPOUSE" && (
                    <div className="pt-2 border-t border-primary/10 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block font-medium text-textSecondary mb-1">
                          Marriage Date (Optional)
                        </label>
                        <input
                          type="date"
                          value={marriageDate}
                          onChange={(e) => setMarriageDate(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-card border border-border bg-surface text-textPrimary focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="block font-medium text-textSecondary mb-1">
                          Marriage Status
                        </label>
                        <select
                          value={status}
                          onChange={(e) => setStatus(e.target.value as any)}
                          className="w-full px-2.5 py-1.5 rounded-card border border-border bg-surface text-textPrimary focus:ring-1 focus:ring-primary"
                        >
                          <option value="MARRIED">Married</option>
                          <option value="DIVORCED">Divorced</option>
                          <option value="WIDOWED">Widowed</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleLinkRelationship(selectedPerson.id)}
                    className="w-full py-2 rounded-card bg-primary hover:bg-primary/90 text-white font-medium text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Confirm & Link Relationship</span>
                  </button>
                </div>
              ) : (
                /* Results list */
                <div className="divide-y divide-border border border-border rounded-card max-h-60 overflow-y-auto">
                  {results.length > 0 ? (
                    results.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => setSelectedPerson(p)}
                        className="p-2.5 flex items-center justify-between hover:bg-bg cursor-pointer transition-colors text-xs"
                      >
                        <div>
                          <p className="font-heading font-semibold text-textPrimary">{p.name}</p>
                          <p className="text-textSecondary">
                            {p.gender || "Unspecified"}
                            {p.currentPlace ? ` • ${p.currentPlace}` : ""}
                          </p>
                        </div>
                        <span className="text-primary font-medium text-[11px]">Select</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-textSecondary text-xs">
                      {searching ? "Searching..." : "No people found. Try typing a name or create a new person."}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Create new person tab */
            <div>
              <PersonForm
                onSuccess={(newPerson) => {
                  handleLinkRelationship(newPerson.id);
                }}
                onCancel={onClose}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
