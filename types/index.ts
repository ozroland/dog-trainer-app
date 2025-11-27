export interface Dog {
    id: string;
    owner_id: string;
    name: string;
    breed: string;
    age: number;
    gender: 'Male' | 'Female';
    weight?: number;
    photo_url?: string;
    created_at: string;
}

export interface Profile {
    id: string;
    full_name?: string;
    avatar_url?: string;
}

export interface Lesson {
    id: string;
    title: string;
    description: string;
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    duration_minutes: number;
    content_markdown: string;
    video_url?: string;
    created_at: string;
}

export interface Progress {
    id: string;
    dog_id: string;
    lesson_id: string;
    status: 'Started' | 'Completed';
    completed_at?: string;
    created_at: string;
}

export interface TrainingSession {
    id: string;
    dog_id: string;
    trained_at: string;
    created_at: string;
}

export interface WeightLog {
    id: string;
    dog_id: string;
    weight: number;
    date: string;
    created_at: string;
}

export type HealthRecordType = 'vaccination' | 'vet_visit' | 'medication';

export interface HealthRecord {
    id: string;
    dog_id: string;
    type: HealthRecordType;
    title: string;
    date: string;
    notes?: string;
    next_due_date?: string;
    created_at: string;
}

export interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string;
    sticker_url?: string;
    condition_type: 'lesson_count' | 'streak_days' | 'specific_lesson';
    condition_value: number;
}

export interface DogAchievement {
    id: string;
    dog_id: string;
    achievement_id: string;
    unlocked_at: string;
}

export interface Walk {
    id: string;
    user_id: string;
    dog_id: string;
    start_time: string;
    end_time?: string;
    duration_seconds: number;
    distance_meters: number;
    route_coordinates: { latitude: number; longitude: number }[];
    created_at: string;
}

export interface WalkEvent {
    id: string;
    walk_id: string;
    event_type: 'poop' | 'pee' | 'reaction' | 'sniff' | 'water';
    latitude: number;
    longitude: number;
    timestamp: string;
}
