import { ReactNode } from 'react';

// Models
export interface Entity {
    id: string;
    name: string;
    acronym?: string;
    type: 'GOVERNMENT' | 'PRIVATE' | 'NGO';
}

export interface Contact {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    role: string; // Cargo
}

export interface Auditorium {
    id: string;
    name: string;
    capacity: number;
    location: string;
    resources: string[]; // ['PROJECTOR', 'SOUND', 'WIFI']
}

export interface BookingRequest {
    id: string;
    entityId: string;
    contactId: string;
    auditoriumId: string;
    title: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
    attendeesEstimate: number;
}

// UI State Types for the Wizard
export interface WizardState {
    step: number;
    selectedEntity: Entity | null;
    newEntityDraft?: Partial<Entity>;
    selectedAuditorium: Auditorium | null;
    selectedDate: Date | null;
    timeSlot: { start: string; end: string } | null;
    eventDetails: Partial<BookingRequest>;
    contactDetails: Partial<Contact>;
}
