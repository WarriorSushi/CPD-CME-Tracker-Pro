import { theme } from '../constants/theme';

/**
 * Get greeting based on time of day
 */
export const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

/**
 * Get color based on progress status
 */
export const getProgressColor = (status: string): string => {
  switch (status) {
    case 'completed':
      return theme.colors.success;
    case 'on_track':
      return theme.colors.primary;
    case 'behind':
      return theme.colors.warning;
    case 'overdue':
      return theme.colors.error;
    default:
      return theme.colors.gray.medium;
  }
};

/**
 * Get urgent license renewals (expiring within 60 days)
 */
export const getUrgentLicenseRenewals = (licenses: any[]): any[] => {
  if (!licenses || licenses.length === 0) return [];

  const today = new Date();
  const sixtyDaysFromNow = new Date();
  sixtyDaysFromNow.setDate(today.getDate() + 60);

  return licenses.filter(license => {
    const expirationDate = new Date(license.expirationDate);
    return expirationDate <= sixtyDaysFromNow && expirationDate >= today;
  }).sort((a, b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime());
};

/**
 * Get upcoming renewals (within 3 months)
 */
export const getUpcomingRenewals = (licenses: any[]): any[] => {
  if (!licenses || licenses.length === 0) return [];

  const today = new Date();
  const threeMonthsFromNow = new Date();
  threeMonthsFromNow.setMonth(today.getMonth() + 3);

  return licenses.filter(license => {
    const expirationDate = new Date(license.expirationDate);
    return expirationDate <= threeMonthsFromNow && expirationDate >= today;
  }).sort((a, b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime());
};
