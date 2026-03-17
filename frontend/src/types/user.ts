export type Role = "ADMIN" | "USER";

export type User = { 
    id: number; 
    name: string; 
    email: string; 
    role?: "ADMIN" | "USER" 
};

export type UserRow = {
  id: number;
  name: string;
  email: string;
  role: Role;
  created_at?: string;
};

export type Props = {
  page: number;
  pageSize: number;
  onTotalPages?: (n: number) => void;
};

export type ModalProps = {
  open: boolean;
  taskId: number | null;
  users: User[];
  onClose: () => void;
  onSaved: () => void;
};

