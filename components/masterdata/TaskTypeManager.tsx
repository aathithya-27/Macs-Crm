import React from 'react';
import { TaskMaster, Task } from '../../types';
import GenericMasterManager from './GenericMasterManager';

interface TaskTypeManagerProps {
    taskMasters: TaskMaster[];
    onUpdateTaskMasters: (data: TaskMaster[]) => void;
    addToast: (message: string, type?: 'success' | 'error') => void;
    allTasks: Task[];
    canCreate: boolean;
    canModify: boolean;
}

const TaskTypeManager: React.FC<TaskTypeManagerProps> = ({
    taskMasters,
    onUpdateTaskMasters,
    addToast,
    allTasks,
    canCreate,
    canModify,
}) => {
    return (
        <GenericMasterManager
            title="Manage Task Type"
            items={taskMasters}
            onUpdate={onUpdateTaskMasters}
            addToast={addToast}
            noun="Task Type"
            reorderable={true}
            showSearchBar={true}
            showAddButton={false}
            codeColumnDisplay="hidden"
            dependencyCheck={(id) => {
                const taskType = taskMasters.find(t => t.id === id);
                if (!taskType) return [];

                return allTasks
                    .filter(task => task.taskType === taskType.name)
                    .map(task => ({ name: `Task: ${task.taskDescription}`, type: 'task' }));
            }}
            canCreate={canCreate}
            canModify={canModify}
        />
    );
};

export default TaskTypeManager;