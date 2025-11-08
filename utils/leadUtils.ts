import { Lead, LeadActivityLog } from '../types.ts';

export const generateLeadActivityLog = (oldLead: Partial<Lead>, newLead: Partial<Lead>, userId: string): LeadActivityLog[] => {
    const logs: LeadActivityLog[] = [];
    const timestamp = new Date().toISOString();

    if (oldLead.status !== newLead.status) {
        logs.push({
            timestamp,
            action: 'Status Change',
            details: `Status changed from '${oldLead.status || 'None'}' to '${newLead.status}'.`,
            by: userId,
        });
    }

     if (oldLead.notes !== newLead.notes && newLead.notes) {
        logs.push({
            timestamp,
            action: 'Note Added',
            details: `A new note was added.`,
            by: userId,
        });
    }

    const detailsChanged = (
        oldLead.name !== newLead.name ||
        oldLead.phone !== newLead.phone ||
        oldLead.email !== newLead.email ||
        oldLead.estimatedValue !== newLead.estimatedValue ||
        oldLead.assignedTo !== newLead.assignedTo
    );

    if (detailsChanged && !logs.some(log => log.action === 'Status Change')) {
         logs.push({
            timestamp,
            action: 'Details Updated',
            details: `Lead details were updated.`,
            by: userId,
        });
    }

    return logs;
};
