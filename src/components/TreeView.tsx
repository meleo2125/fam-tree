"use client";

import { useEffect, useState, useCallback } from "react";
import ReactFlow, {
  Background,
  Controls,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  useReactFlow,
  Node,
  Edge,
} from "reactflow";
import { TreeNode } from "@/components/TreeNode";
import { SpouseEdge, ParentChildEdge } from "@/components/CustomEdges";
import { PersonDetailPanel } from "@/components/PersonDetailPanel";
import { Person } from "@/types";
import { Loader2, Users, RefreshCw } from "lucide-react";

const nodeTypes = {
  personNode: TreeNode,
};

const edgeTypes = {
  spouse: SpouseEdge,
  parentChild: ParentChildEdge,
};

function TreeCanvas({
  rawNodes,
  rawEdges,
  people,
  onNodeSelect,
  onRefresh,
}: {
  rawNodes: Node[];
  rawEdges: Edge[];
  people: Person[];
  onNodeSelect: (id: string) => void;
  onRefresh: () => void;
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { fitView } = useReactFlow();

  // Attach onNodeClick handler to node data
  useEffect(() => {
    const formattedNodes: Node[] = rawNodes.map((n) => ({
      ...n,
      data: {
        ...n.data,
        onNodeClick: onNodeSelect,
      },
    }));
    setNodes(formattedNodes);
    setEdges(rawEdges);
    setTimeout(() => {
      fitView({ padding: 0.2 });
    }, 100);
  }, [rawNodes, rawEdges, onNodeSelect, fitView, setNodes, setEdges]);

  const handleSelectPerson = (personId: string) => {
    if (!personId) {
      fitView({ duration: 800, padding: 0.2 });
      return;
    }
    const target = nodes.find((n) => n.id === personId);
    if (target) {
      fitView({
        nodes: [{ id: personId }],
        duration: 800,
        maxZoom: 1.5,
      });
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-3.5rem)] bg-bg overflow-hidden">
      {/* Top control bar: Person select dropdown and refresh button */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-surface/90 backdrop-blur p-2 rounded-card border border-border shadow-sm max-w-sm">
        <label htmlFor="jump-person" className="text-xs font-semibold text-textSecondary shrink-0 flex items-center gap-1">
          <Users className="w-3.5 h-3.5 text-primary" />
          <span>Jump to:</span>
        </label>
        <select
          id="jump-person"
          onChange={(e) => handleSelectPerson(e.target.value)}
          defaultValue=""
          className="w-full text-xs font-body py-1.5 px-2 rounded border border-border bg-surface text-textPrimary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">All Branches</option>
          {people.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} {p.deceased ? "(Deceased)" : ""}
            </option>
          ))}
        </select>
        <button
          onClick={onRefresh}
          className="p-1.5 rounded text-textSecondary hover:text-textPrimary hover:bg-bg cursor-pointer transition-colors"
          title="Reload tree data"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
      >
        <Background color="#C79A3C" gap={20} size={1} />
        <Controls className="!bg-surface !border-border !rounded-card !shadow-md" />
      </ReactFlow>
    </div>
  );
}

export function TreeView() {
  const [data, setData] = useState<{ nodes: Node[]; edges: Edge[]; people: Person[] }>({
    nodes: [],
    edges: [],
    people: [],
  });
  const [loading, setLoading] = useState(true);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);

  const fetchTree = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tree");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Error loading tree:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  if (loading && data.nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-textSecondary">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
        <p className="font-body text-sm">Building family tree visualization...</p>
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <TreeCanvas
        rawNodes={data.nodes}
        rawEdges={data.edges}
        people={data.people}
        onNodeSelect={(id) => setSelectedPersonId(id)}
        onRefresh={fetchTree}
      />

      {selectedPersonId && (
        <PersonDetailPanel
          personId={selectedPersonId}
          onClose={() => setSelectedPersonId(null)}
          onPersonUpdated={fetchTree}
        />
      )}
    </ReactFlowProvider>
  );
}
