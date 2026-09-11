export type SensorProduct =
  | '압력센서'
  | '차압센서'
  | '디지털 압력계'
  | '진공센서'
  | '로드셀';

export interface QuestionGoal {
  number: number;
  goalTitle: string;
  goalDesc: string;
  question: string;
}

export interface SheetSavePayload {
  product: SensorProduct;
  questions: string;
  memo: string;
  date: string;
}

export interface SheetSaveResult {
  success: boolean;
  message?: string;
  dateStr?: string;
}
