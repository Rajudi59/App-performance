
export enum TrainingGoal {
  BODYBUILDING = 'BODYBUILDING',
  HYPERTROPHY = 'HYPERTROPHY',
  RESISTANCE = 'RESISTANCE'
}

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  weight: string;
  observation: string;
  isCompleted: boolean;
  completedSets: number;
  restTime: number; // in seconds
  photo?: string;
}

export interface Workout {
  id: string;
  letter: string; // A, B, C...
  exercises: Exercise[];
  generalObservation: string;
}

export interface EvolutionPhoto {
  id: string;
  date: string;
  dataUrl: string;
}

export interface AppState {
  goal: TrainingGoal;
  startDate: string;
  endDate: string;
  workouts: Workout[];
  evolutionGallery: EvolutionPhoto[];
  language: 'pt' | 'en' | 'es';
}

export type TranslationKeys = 
  | 'title' 
  | 'goal' 
  | 'startDate' 
  | 'endDate' 
  | 'bodybuilding' 
  | 'hypertrophy' 
  | 'resistance' 
  | 'addWorkout' 
  | 'importText' 
  | 'pasteTextPrompt' 
  | 'cancel' 
  | 'process' 
  | 'workout' 
  | 'addExercise' 
  | 'observation' 
  | 'rest' 
  | 'sets' 
  | 'completed' 
  | 'delete' 
  | 'photo' 
  | 'timer' 
  | 'language' 
  | 'save'
  | 'noWorkouts'
  | 'gallery'
  | 'evolution'
  | 'download'
  | 'addProgress'
  | 'takePhoto'
  | 'noPhotos';
