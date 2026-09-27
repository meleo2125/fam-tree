"use client";

import { useState, useTransition, useRef } from "react";
import { Download, Upload, CheckCircle2, AlertCircle, FileJson, Loader2 } from "lucide-react";
import { importTree } from "@/app/actions/relationships";

export default function SettingsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedData, setParsedData] = useState<{
    people: Record<string, unknown>[];
    relationships: Record<string, unknown>[];
  } | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!Array.isArray(json.people) || !Array.isArray(json.relationships)) {
          throw new Error("Invalid backup format: missing 'people' or 'relationships' arrays.");
        }
        setParsedData({
          people: json.people,
          relationships: json.relationships,
        });
      } catch (err: unknown) {
        const e = err as Error;
        setErrorMsg(e?.message || "Failed to parse JSON backup file.");
        setParsedData(null);
      }
    };
    reader.onerror = () => {
      setErrorMsg("Failed to read the file.");
      setParsedData(null);
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    if (!parsedData) return;
    setErrorMsg(null);
    startTransition(async () => {
      try {
        const result = await importTree(parsedData as any);
        setSuccessMsg(
          `Successfully imported ${result.peopleImported} people and ${result.relationshipsImported} relationships!`
        );
        setParsedData(null);
        setFileName(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } catch (err: unknown) {
        const e = err as Error;
        setErrorMsg(e?.message || "Failed to import tree data.");
      }
    });
  };

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-heading text-textPrimary">Data & Settings</h1>
        <p className="text-sm font-body text-textSecondary mt-1">
          Export your family tree data for offline backup or import an existing JSON archive.
        </p>
      </div>

      <div className="space-y-6">
        {/* Export Card */}
        <section className="bg-surface p-5 sm:p-6 rounded-card border border-border shadow-xs">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Download className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h2 className="font-heading font-semibold text-textPrimary text-base">
                Export Family Tree
              </h2>
              <p className="text-xs sm:text-sm font-body text-textSecondary mt-1 leading-relaxed">
                Download a complete JSON export of all individuals, photos, dates, and family connections.
              </p>
              <div className="mt-4">
                <a
                  href="/api/export"
                  download
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-card bg-primary hover:bg-primary/90 text-white font-medium text-xs sm:text-sm shadow-sm transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Backup (JSON)</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Import Card */}
        <section className="bg-surface p-5 sm:p-6 rounded-card border border-border shadow-xs">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent-dark shrink-0">
              <Upload className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h2 className="font-heading font-semibold text-textPrimary text-base">
                Import Family Tree
              </h2>
              <p className="text-xs sm:text-sm font-body text-textSecondary mt-1 leading-relaxed">
                Restore or append records from a previously exported JSON backup file.
              </p>

              {/* Status messages */}
              {errorMsg && (
                <div className="mt-3 p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-card flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="mt-3 p-3 text-xs text-green-700 bg-green-50 border border-green-200 rounded-card flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="mt-4 space-y-3">
                <label className="block">
                  <span className="sr-only">Choose backup file</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/json"
                    onChange={handleFileChange}
                    className="block w-full text-xs text-textSecondary file:mr-4 file:py-2 file:px-3 file:rounded-card file:border-0 file:text-xs file:font-semibold file:bg-bg file:text-textPrimary hover:file:bg-border/60 cursor-pointer"
                  />
                </label>

                {/* File Preview */}
                {parsedData && (
                  <div className="p-3.5 rounded-card bg-bg border border-border space-y-3">
                    <div className="flex items-center gap-2 text-xs font-medium text-textPrimary">
                      <FileJson className="w-4 h-4 text-primary" />
                      <span>{fileName}</span>
                    </div>

                    <div className="p-2.5 rounded bg-surface border border-accent/30 text-xs font-body text-textPrimary">
                      <span className="font-semibold text-primary">
                        {parsedData.people.length} people
                      </span>
                      ,{" "}
                      <span className="font-semibold text-accent-dark">
                        {parsedData.relationships.length} relationships
                      </span>{" "}
                      found in backup archive.
                    </div>

                    <button
                      type="button"
                      disabled={isPending}
                      onClick={handleConfirmImport}
                      className="w-full py-2.5 px-4 rounded-card bg-primary hover:bg-primary/90 text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>Confirm & Import Tree</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
