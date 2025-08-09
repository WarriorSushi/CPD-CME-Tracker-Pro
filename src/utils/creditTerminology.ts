import { CreditSystem } from '../types';

// Maps credit system to appropriate terminology
export const getCreditTerminology = (creditSystem: CreditSystem) => {
  const terminologyMap = {
    'CME': {
      singular: 'credit',
      plural: 'credits', 
      unit: 'Credits',
      title: 'Credit Requirements',
      label: 'Number of Credits'
    },
    'CPD': {
      singular: 'point',
      plural: 'points',
      unit: 'Points', 
      title: 'Point Requirements',
      label: 'Number of Points'
    },
    'CE': {
      singular: 'unit',
      plural: 'units',
      unit: 'Units',
      title: 'Unit Requirements', 
      label: 'Number of Units'
    },
    'Hours': {
      singular: 'hour',
      plural: 'hours',
      unit: 'Hours',
      title: 'Hour Requirements',
      label: 'Number of Hours'
    },
    'Points': {
      singular: 'point',
      plural: 'points', 
      unit: 'Points',
      title: 'Point Requirements',
      label: 'Number of Points'
    }
  };

  return terminologyMap[creditSystem] || terminologyMap['CME'];
};

// Helper functions for common use cases
export const getCreditUnit = (creditSystem: CreditSystem): string => {
  const terminology = getCreditTerminology(creditSystem);
  console.log('🎯 getCreditUnit: creditSystem =', creditSystem, '→ unit =', terminology.unit);
  return terminology.unit;
};

export const getCreditSingular = (creditSystem: CreditSystem): string => {
  return getCreditTerminology(creditSystem).singular;
};

export const getCreditPlural = (creditSystem: CreditSystem): string => {
  return getCreditTerminology(creditSystem).plural;
};

export const getCreditTitle = (creditSystem: CreditSystem): string => {
  return getCreditTerminology(creditSystem).title;
};

export const getCreditLabel = (creditSystem: CreditSystem): string => {
  return getCreditTerminology(creditSystem).label;
};