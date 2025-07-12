export interface JobSeeker {
  id: string;
  name: string;
  email: string;
  phone: string;
  grade: string;
  school: string;
  resumeUrl?: string;
  skills: string[];
  availability: 'full-time' | 'part-time' | 'volunteer';
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface JobPosting {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string[];
  salary?: string;
  jobType: 'full-time' | 'part-time' | 'volunteer';
  contactEmail: string;
  contactPhone?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Reference {
  id: string;
  studentName: string;
  studentEmail: string;
  teacherName: string;
  teacherEmail: string;
  subject: string;
  relationship: string;
  referenceText: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: Date;
  location: string;
  type: 'job-fair' | 'workshop' | 'seminar';
  maxParticipants?: number;
  currentParticipants: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContactForm {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  resolved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'teacher' | 'employer' | 'admin';
  createdAt: Date;
  updatedAt: Date;
} 