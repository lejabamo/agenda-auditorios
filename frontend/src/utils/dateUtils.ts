/**
 * Parses a naive ISO date string (YYYY-MM-DDTHH:mm:ss) into a local Date object.
 * This prevents the browser or Javascript engines from treating the ISO string
 * as UTC (which introduces a 5-hour offset in Colombia time) and ensures the rendered
 * calendar times match the exact values stored in the database.
 */
export function parseNaiveISO(isoString: string | Date | null | undefined): Date {
    if (!isoString) return new Date();
    if (isoString instanceof Date) return isoString;
    
    // If it already has an explicit offset or timezone, parse natively
    if (isoString.includes('Z') || isoString.includes('+') || (isoString.includes('-') && isoString.split('-').length > 3)) {
        return new Date(isoString);
    }
    
    try {
        const parts = isoString.split('T');
        const dateParts = parts[0].split('-');
        const timeParts = parts[1] ? parts[1].split(':') : ['00', '00', '00'];
        
        const year = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1; // 0-indexed month
        const day = parseInt(dateParts[2], 10);
        
        const hours = parseInt(timeParts[0], 10);
        const minutes = parseInt(timeParts[1], 10);
        
        // Handle optional seconds and milliseconds
        const secondsStr = timeParts[2] || '00';
        const secondsParts = secondsStr.split('.');
        const seconds = parseInt(secondsParts[0], 10);
        const ms = secondsParts[1] ? parseInt(secondsParts[1].substring(0, 3).padEnd(3, '0'), 10) : 0;
        
        return new Date(year, month, day, hours, minutes, seconds, ms);
    } catch (e) {
        console.error("Error parsing naive ISO date string:", isoString, e);
        return new Date(isoString);
    }
}
