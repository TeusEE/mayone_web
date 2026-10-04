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

type AdminUserRow = {
  user_id: string;
  created_at: string;
};

type AdminUserInsert = {
  user_id: string;
  created_at?: string;
};

type AdminEmailRow = {
  email: string;
  created_at: string;
};

type AdminEmailInsert = {
  email: string;
  created_at?: string;
};

export type Database = {
  public: {
    Tables: {
      mayone_branches: StoredRecordTable;
      mayone_class_offers: StoredRecordTable;
      mayone_enrollments: StoredRecordTable;
      mayone_admin_users: {
        Row: AdminUserRow;
        Insert: AdminUserInsert;
        Update: never;
        Relationships: [];
      };
      mayone_admin_emails: {
        Row: AdminEmailRow;
        Insert: AdminEmailInsert;
        Update: Partial<AdminEmailInsert>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
