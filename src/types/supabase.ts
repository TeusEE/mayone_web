type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type StoredRecordRow = {
  id: string;
  data: Json;
  created_at: string;
  updated_at: string;
};

type StoredRecordInsert = {
  id: string;
  data: Json;
  created_at?: string;
  updated_at?: string;
};

type StoredRecordUpdate = {
  id?: string;
  data?: Json;
  updated_at?: string;
};

type StoredRecordTable = {
  Row: StoredRecordRow;
  Insert: StoredRecordInsert;
  Update: StoredRecordUpdate;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      mayone_branches: StoredRecordTable;
      mayone_class_offers: StoredRecordTable;
      mayone_enrollments: StoredRecordTable;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
