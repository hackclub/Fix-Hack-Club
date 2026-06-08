export interface HackClubProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  display_name: string;
  slack_id: string;
  verification_status: string;
  avatar: string;
}

export interface ListingDTO {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  url: string;
  github_url: string;
  status: string;
  completed_at: string | null;
}

export interface SubmissionDTO {
  id: string;
  title: string;
  url: string;
  repo: string;
  category: string;
  notes: string;
  status: string;
  points: number;
  created_at: string | null;
}
