import { TreeView } from "@/components/TreeView";

export const metadata = {
  title: "Visual Tree | Family Tree",
  description: "Interactive genealogy tree view",
};

export default function TreePage() {
  return (
    <main className="w-full h-[calc(100vh-3.5rem)] relative overflow-hidden">
      <TreeView />
    </main>
  );
}
