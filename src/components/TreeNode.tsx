"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";

export type TreeNodeData = {
  id: string;
  name: string;
  gender: string | null;
  deceased: boolean;
  dob?: string | null;
  dobPrecision?: string | null;
  photoUrl?: string | null;
  parentIds: string[];
  spouseIds: string[];
  onNodeClick?: (id: string) => void;
};

function TreeNodeComponent({ data, id }: NodeProps<TreeNodeData>) {
  const initial = data.name ? data.name.trim().charAt(0).toUpperCase() : "?";

  let avatarBg = "bg-accent/30 text-accent-dark";
  let genderBorder = "border-l-4 border-l-transparent";

  if (data.gender === "MALE") {
    avatarBg = "bg-male text-white";
    genderBorder = "border-l-4 border-l-male";
  } else if (data.gender === "FEMALE") {
    avatarBg = "bg-female text-white";
    genderBorder = "border-l-4 border-l-female";
  }

  let dobText: string | null = null;
  if (data.dob) {
    try {
      const d = new Date(data.dob);
      if (!isNaN(d.getTime())) {
        dobText =
          data.dobPrecision === "year"
            ? `b. ${d.getFullYear()}`
            : `b. ${d.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}`;
      }
    } catch {
      dobText = null;
    }
  }

  return (
    <div
      onClick={() => data.onNodeClick?.(data.id || id)}
      className={`w-48 rounded-card border-2 border-accent bg-surface shadow-md p-3 transition-transform hover:scale-105 cursor-pointer text-center relative ${genderBorder} ${
        data.deceased ? "opacity-60" : "opacity-100"
      }`}
    >
      {/* ReactFlow connection handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-2 h-2 bg-textSecondary border-none"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2 h-2 bg-textSecondary border-none"
      />
      <Handle
        type="target"
        id="left"
        position={Position.Left}
        className="w-2 h-2 bg-accent border-none"
      />
      <Handle
        type="source"
        id="right"
        position={Position.Right}
        className="w-2 h-2 bg-accent border-none"
      />

      {/* 32px circular thumbnail */}
      <div className="flex justify-center mb-1.5">
        {data.photoUrl ? (
          <img
            src={data.photoUrl}
            alt={data.name}
            className="w-8 h-8 rounded-full object-cover border border-accent/40"
          />
        ) : (
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center font-heading font-semibold text-xs border border-accent/40 ${avatarBg}`}
          >
            {initial}
          </div>
        )}
      </div>

      {/* Name */}
      <h4 className="font-heading font-semibold text-textPrimary text-xs truncate leading-snug">
        {data.name}
      </h4>

      {/* DOB */}
      {dobText && (
        <p className="font-body text-[11px] text-textSecondary mt-0.5 truncate">
          {dobText}
        </p>
      )}

      {data.deceased && (
        <span className="inline-block mt-0.5 text-[9px] font-semibold tracking-wider uppercase text-accent">
          Deceased
        </span>
      )}
    </div>
  );
}

export const TreeNode = memo(TreeNodeComponent);
