import { Person, Relationship, Gender, RelationshipType, MarriageStatus } from "@prisma/client";

export type { Person, Relationship, Gender, RelationshipType, MarriageStatus };

export type PersonWithSpouseHint = Person & {
  spouseHint?: string | null;
};

export type PersonWithRelationships = Person & {
  parents: Person[];
  spouses: (Person & { marriageDate?: Date | null; status?: MarriageStatus | null; relationshipId: string })[];
  children: Person[];
};

export type TreeGraphData = {
  nodes: {
    id: string;
    position: { x: number; y: number };
    data: {
      id: string;
      name: string;
      gender: string | null;
      deceased: boolean;
      dob?: string | null;
      photoUrl?: string | null;
      parentIds: string[];
      spouseIds: string[];
    };
    type: "personNode";
  }[];
  edges: {
    id: string;
    source: string;
    target: string;
    type: "parentChild" | "spouse";
  }[];
};
