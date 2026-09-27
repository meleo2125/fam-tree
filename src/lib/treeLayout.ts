export type PersonNode = {
  id: string;
  name: string;
  gender: string | null;
  deceased: boolean;
  dob?: string | null;
  dobPrecision?: string | null;
  photoUrl?: string | null;
  parentIds: string[];
  spouseIds: string[];
};

export function computeTreeLayout(people: PersonNode[]) {
  const byId = new Map(people.map((p) => [p.id, p]));
  const level = new Map<string, number>();

  function getLevel(id: string, visiting = new Set<string>()): number {
    if (level.has(id)) return level.get(id)!;
    if (visiting.has(id)) return 0; // cycle guard against bad data
    visiting.add(id);
    const p = byId.get(id);
    if (!p || p.parentIds.length === 0) {
      level.set(id, 0);
      return 0;
    }
    let max = -1;
    for (const pid of p.parentIds) {
      if (byId.has(pid)) max = Math.max(max, getLevel(pid, visiting));
    }
    const lvl = max + 1;
    level.set(id, lvl);
    return lvl;
  }
  people.forEach((p) => getLevel(p.id));

  const byLevel = new Map<number, string[]>();
  const placed = new Set<string>();
  for (const p of people) {
    if (!byLevel.has(level.get(p.id)!)) byLevel.set(level.get(p.id)!, []);
  }
  for (const p of people) {
    if (placed.has(p.id)) continue;
    const lvl = level.get(p.id)!;
    byLevel.get(lvl)!.push(p.id);
    placed.add(p.id);
    for (const sid of p.spouseIds) {
      if (!placed.has(sid) && level.get(sid) === lvl) {
        byLevel.get(lvl)!.push(sid);
        placed.add(sid);
      }
    }
  }

  const NODE_WIDTH = 220;
  const LEVEL_HEIGHT = 160;
  const nodes: { id: string; position: { x: number; y: number }; data: PersonNode; type: "personNode" }[] = [];
  for (const [lvl, ids] of byLevel) {
    ids.forEach((id, i) => {
      nodes.push({ id, position: { x: i * NODE_WIDTH, y: lvl * LEVEL_HEIGHT }, data: byId.get(id)!, type: "personNode" });
    });
  }

  const edges: { id: string; source: string; target: string; type: "parentChild" | "spouse" }[] = [];
  for (const p of people) {
    for (const pid of p.parentIds) {
      if (byId.has(pid)) edges.push({ id: `pc-${pid}-${p.id}`, source: pid, target: p.id, type: "parentChild" });
    }
    for (const sid of p.spouseIds) {
      if (p.id < sid) edges.push({ id: `sp-${p.id}-${sid}`, source: p.id, target: sid, type: "spouse" });
    }
  }

  return { nodes, edges };
}
