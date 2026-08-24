export type RequestStatus = 'pending' | 'approved' | 'declined';
export type Priority = 'Low' | 'Medium' | 'High';
export type Category = 'Machinery' | 'Equipment' | 'Materials' | 'Office supplies';
export type Role = 'staff' | 'admin';
export type ByOption = 'This week' | 'This month' | 'Next month';
export type RequirementsFilter = 'all' | 'pending' | 'high' | 'mine';
export type RequirementsView = 'list' | 'detail';

export interface Requirement {
  id: string;
  ref: string;
  item: string;
  cat: Category;
  amount: number;
  priority: Priority;
  status: RequestStatus;
  who: string;
  init: string;
  team: string;
  date: string;
  by: string;
  quote: string;
  note: string;
  decidedBy?: string;
}

export interface RequirementDraft {
  cat: Category;
  item: string;
  amount: string;
  priority: Priority;
  by: ByOption;
  note: string;
  quote: boolean;
}
