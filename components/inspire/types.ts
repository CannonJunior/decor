export type AnalysisResult = {
  colors: string[];
  mood: string;
  style: string;
  materials: string[];
  furniture: string[];
  lighting: string;
  essence: string;
  isRoom: boolean;
  roomType?: string | null;
};

export type Mode = 'shop' | 'rearrange' | 'style' | 'brief';

export type ShopChoices = { roomId: string; budget: string; existing: string };
export type RearrangeChoices = { roomId: string; priority: string };
export type StyleChoices = { scope: 'room' | 'home'; roomId?: string; changes: string[]; boldness: number };
export type BriefChoices = { roomIds: string[]; timeline: string; diy: string; budget: string };

export type Room = { id: string; name: string; type: string | null; widthFt: number | null; lengthFt: number | null; heightFt: number | null; style: string | null };
export type CatalogItem = { id: string; name: string; category: string | null; style: string | null; roomId: string | null };

export type WizardState = 'upload' | 'analyzing' | 'analyzed' | 'mode-selected' | 'generating' | 'complete';
