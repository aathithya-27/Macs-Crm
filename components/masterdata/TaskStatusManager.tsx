import React from 'react';
import { TaskStatusMaster, Task } from '../../types';
import GenericMasterManager from './GenericMasterManager';

interface TaskStatusManagerProps {
    taskStatuses: TaskStatusMaster[];
    onUpdateTaskStatuses: (data: TaskStatusMaster[]) => void;
    addToast: (message: string, type?: 'success' | 'error') => void;
    allTasks: Task[]; // Needed for dependency check
    canCreate: boolean;
    canModify: boolean;
}

const TaskStatusManager: React.FC<TaskStatusManagerProps> = ({
    taskStatuses,
    onUpdateTaskStatuses,
    addToast,
    allTasks,
    canCreate,
    canModify,
}) => {
    return (
        <GenericMasterManager
            title="Manage Task Status"
            items={taskStatuses}
            onUpdate={onUpdateTaskStatuses}
            addToast={addToast}
            noun="Task Status"

            reorderable={true}
            showSearchBar={true}
            codeColumnDisplay="hidden"

            initialStateKey="isInitialState" 
            endStateKey="isEndState"         

            onUpdateInitialState={(itemId) => {
                if (!canModify) return;
                const updatedStatuses = taskStatuses.map(status => ({
                    ...status,
                    isInitialState: status.id === itemId
                }));
                onUpdateTaskStatuses(updatedStatuses);
            }}

            dependencyCheck={(id) => {
                return allTasks
                    .filter(task => task.statusId === id)
                    .map(task => ({ name: `Task: ${task.taskDescription}`, type: 'task' }));
            }}

            canCreate={canCreate}
            canModify={canModify}
        />
    );
};

export default TaskStatusManager;