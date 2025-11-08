import React from 'react';
import { Route as RouteType, Member } from '../../types';
import GenericMasterManager from './GenericMasterManager';

interface RoutesManagerProps {
    routes: RouteType[];
    onUpdateRoutes: (data: RouteType[]) => void;
    addToast: (message: string, type?: 'success' | 'error') => void;
    allMembers: Member[];
    canCreate: boolean;
    canModify: boolean;
}

const RoutesManager: React.FC<RoutesManagerProps> = ({
    routes,
    onUpdateRoutes,
    addToast,
    allMembers,
    canCreate,
    canModify,
}) => {
    return (
        <GenericMasterManager
            title="Manage Route"
            items={routes}
            onUpdate={onUpdateRoutes}
            addToast={addToast}
            noun="Route"

            reorderable={true}
            showSearchBar={true}
            codeColumnDisplay="hidden"

            dependencyCheck={(id) => {
                return allMembers
                    .filter(member => member.routeId === id)
                    .map(member => ({ name: `Customer: ${member.name}`, type: 'member' }));
            }}

            canCreate={canCreate}
            canModify={canModify}
        />
    );
};

export default RoutesManager;