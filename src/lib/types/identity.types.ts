export interface Identity {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export type IdentityType = 'programmer' | 'designer' | 'business' | 'student';
