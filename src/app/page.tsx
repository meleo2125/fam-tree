"use client";

import { useEffect, useState, useCallback } from "react";
import { SearchBar } from "@/components/SearchBar";
import { PersonCard } from "@/components/PersonCard";
import { PersonDetailPanel } from "@/components/PersonDetailPanel";
import { PersonWithSpouseHint } from "@/types";
import { Plus, Users, UserPlus } from "lucide-react";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PersonWithSpouseHint[]>([]);
  const [loading, setLoading] = useState(true);

  // Panel state
  const [activePersonId, setActivePersonId] = useState<string | null>(null);
  const [panelMode, setPanelMode] = useState<"view" | "create">("view");
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const fetchPeople = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/people?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch (err) {
      console.error("Failed to load people:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPeople(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, fetchPeople]);

  const handleOpenPerson = (id: string) => {
    setActivePersonId(id);
    setPanelMode("view");
    setIsPanelOpen(true);
  };

  const handleCreateNew = () => {
    setActivePersonId(null);
    setPanelMode("create");
    setIsPanelOpen(true);
  };

  return (
    <main className="max-w-4xl mx-auto px-4 py-6 sm:py-8 pb-24">
      {/* Page Title & Search Header */}
      <div className="mb-6 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold font-heading text-textPrimary">
              Family Directory
            </h1>
            <p className="text-xs sm:text-sm font-body text-textSecondary mt-0.5">
              Search relatives by name, phone number, native town, or current city
            </p>
          </div>
          <button
            onClick={handleCreateNew}
            className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-card bg-primary hover:bg-primary/90 text-white font-medium font-body text-sm shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Person</span>
          </button>
        </div>

        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search by name, phone number, place..."
          isLoading={loading}
        />
      </div>

      {/* Results Section */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-textSecondary">
            {query.trim() ? "Search Results" : "All Members"} ({results.length})
          </span>
        </div>

        {results.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {results.map((person) => (
              <PersonCard
                key={person.id}
                person={person}
                onClick={() => handleOpenPerson(person.id)}
              />
            ))}
          </div>
        ) : !loading ? (
          <div className="text-center py-16 px-4 bg-surface rounded-card border border-dashed border-border">
            <div className="w-12 h-12 rounded-full bg-bg flex items-center justify-center text-textSecondary mx-auto mb-3">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-semibold text-textPrimary text-sm mb-1">
              No family members found
            </h3>
            <p className="font-body text-xs text-textSecondary max-w-sm mx-auto mb-4">
              {query.trim()
                ? `No relatives matched "${query}". Check spelling or add a new entry.`
                : "Your family tree is currently empty. Start by adding your first family member!"}
            </p>
            <button
              onClick={handleCreateNew}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-card bg-primary text-white text-xs font-medium hover:bg-primary/90 transition-colors cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add First Person</span>
            </button>
          </div>
        ) : null}
      </section>

      {/* Floating "+ Add Person" button (bottom-right, bg-primary) */}
      <button
        onClick={handleCreateNew}
        className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-30 flex items-center gap-2 px-4 py-3.5 rounded-full bg-primary hover:bg-primary/90 text-white shadow-xl hover:shadow-2xl transition-all cursor-pointer font-medium text-sm group"
        title="Add Person"
      >
        <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" />
        <span className="font-heading font-semibold pr-1">Add Person</span>
      </button>

      {/* Slide-over panel */}
      {isPanelOpen && (
        <PersonDetailPanel
          personId={activePersonId}
          initialMode={panelMode}
          onClose={() => setIsPanelOpen(false)}
          onPersonUpdated={() => fetchPeople(query)}
        />
      )}
    </main>
  );
}
