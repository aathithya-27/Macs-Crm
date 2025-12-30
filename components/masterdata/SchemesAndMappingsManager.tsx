import React from 'react';
import { 
    SchemeMaster, InsuranceAgency, Member, InsuranceTypeMaster, 
    AMC, MutualFundScheme, BusinessVertical 
} from '../../types';
import UnifiedAgencySchemeManager from './UnifiedAgencySchemeManager';

interface SchemesAndMappingsManagerProps {
    schemes: SchemeMaster[];
    onUpdateSchemes: (data: SchemeMaster[]) => void;
    agencies: InsuranceAgency[];
    onUpdateAgencies: (data: InsuranceAgency[]) => void;
    
    // Add mutual fund props
    amcs: AMC[];
    onUpdateAmcs: (data: AMC[]) => void;
    mutualFundSchemes: MutualFundScheme[];
    onUpdateMutualFundSchemes: (data: MutualFundScheme[]) => void;
    
    businessVerticals: BusinessVertical[];
    addToast: (message: string, type?: 'success' | 'error') => void;
    allMembers: Member[];
    insuranceTypes: InsuranceTypeMaster[];
    canCreate: boolean;
    canModify: boolean;
}

const SchemesAndMappingsManager: React.FC<SchemesAndMappingsManagerProps> = (props) => {
    return (
        <UnifiedAgencySchemeManager
            {...props}
        />
    );
};

export default SchemesAndMappingsManager;