import React, { createContext, useContext, useState, useEffect } from 'react';
import type { SelectedSlot } from '@/types/evento';

interface BookingContextType {
    selectedSlot: SelectedSlot | null;
    isInitialized: boolean;
    setBookingSlot: (slot: SelectedSlot | null) => void;
    clearBooking: () => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    const setBookingSlot = (slot: SelectedSlot | null) => {
        console.log("BookingContext: Setting slot", slot);
        setSelectedSlot(slot);
        if (slot) {
            sessionStorage.setItem('activeBooking', JSON.stringify(slot));
        } else {
            sessionStorage.removeItem('activeBooking');
        }
    };

    const clearBooking = () => {
        setSelectedSlot(null);
        sessionStorage.removeItem('activeBooking');
    };

    useEffect(() => {
        const stored = sessionStorage.getItem('activeBooking');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setSelectedSlot(parsed);
            } catch (e) {
                console.error("Failed to parse stored booking", e);
                sessionStorage.removeItem('activeBooking');
            }
        }
        setIsInitialized(true);
    }, []);

    return (
        <BookingContext.Provider value={{ selectedSlot, setBookingSlot, clearBooking, isInitialized }}>
            {children}
        </BookingContext.Provider>
    );
};

export const useBooking = () => {
    const context = useContext(BookingContext);
    if (context === undefined) {
        throw new Error('useBooking must be used within a BookingProvider');
    }
    return context;
};
