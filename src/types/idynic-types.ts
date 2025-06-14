export interface TraitAnalysis {
  traits: Trait[];
  confidence: number;
  metadata: {
    documentLength: number;
    processingTime: number;
    modelVersion: string;
  };
}

export interface Trait {
  id: string;
  name: string;
  description: string;
  category: string;
  confidence: number;
  evidence: Evidence[];
}

export interface Evidence {
  id: string;
  text: string;
  source: string;
  relevanceScore: number;
  timestamp: string;
  traitIds: string[];
}

export interface JobAnalysis {
  id: string;
  title: string;
  requiredTraits: Trait[];
  preferredTraits: Trait[];
  skills: Skill[];
  experienceLevel: ExperienceLevel;
  metadata: {
    industry: string;
    location?: string;
    salaryRange?: SalaryRange;
    companySize?: string;
  };
}

export interface Skill {
  name: string;
  category: string;
  required: boolean;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

export interface ExperienceLevel {
  minimum: number;
  preferred: number;
  unit: 'months' | 'years';
}

export interface SalaryRange {
  min: number;
  max: number;
  currency: string;
  period: 'hourly' | 'monthly' | 'yearly';
}

export interface PersonProfile {
  id: string;
  traits: Trait[];
  skills: Skill[];
  experience: {
    totalYears: number;
    positions: WorkExperience[];
  };
  preferences: {
    industries: string[];
    locations: string[];
    remoteWork: boolean;
    salaryExpectation?: SalaryRange;
  };
}

export interface WorkExperience {
  title: string;
  company: string;
  duration: {
    start: string;
    end?: string;
  };
  description: string;
  skills: string[];
}

export interface MatchResult {
  jobId: string;
  personId: string;
  overallScore: number;
  traitAlignment: {
    matching: Trait[];
    missing: Trait[];
    score: number;
  };
  skillAlignment: {
    matching: Skill[];
    missing: Skill[];
    score: number;
  };
  experienceAlignment: {
    meets: boolean;
    gap: number;
    score: number;
  };
  recommendations: string[];
}