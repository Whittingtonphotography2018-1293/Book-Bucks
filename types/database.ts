export interface Profile {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  updated_at: string;
}

export interface Child {
  id: string;
  parent_id: string;
  name: string;
  grade_level: number;
  avatar_color: string;
  created_at: string;
  updated_at: string;
}

export interface RewardSettings {
  id: string;
  child_id: string;
  reward_type: 'money' | 'points';
  amount_per_book: number;
  payout_threshold: number;
  created_at: string;
  updated_at: string;
}

export interface Book {
  id: string;
  child_id: string;
  title: string;
  author: string;
  summary: string;
  cover_url?: string;
  reading_level?: string;
  interest_level?: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  approved_at?: string;
  created_at: string;
}

export interface Prize {
  id: string;
  parent_id: string;
  child_id?: string;
  name: string;
  description: string;
  points_required: number;
  is_redeemed: boolean;
  created_at: string;
}

export interface Achievement {
  id: string;
  child_id: string;
  achievement_type: string;
  title: string;
  description: string;
  earned_at: string;
}

export interface ChildWithStats extends Child {
  total_books: number;
  approved_books: number;
  pending_books: number;
  total_earned: number;
  reward_settings?: RewardSettings;
}
