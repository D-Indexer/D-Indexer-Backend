export interface Folder {
  owner: string;
  name: string;
  cid: string;
  templateId: number;
  updatedAt: Date;
}

export interface Credential {
  owner: string;
  platform: string;
  proofHash: string;
  linkedAt: Date;
}

export interface Template {
  id: number;
  metadataCid: string;
  deprecated: boolean;
  createdAt: Date;
}

export interface SorobanEvent {
  type: string;
  contractId: string;
  ledger: number;
  data: Record<string, unknown>;
}
