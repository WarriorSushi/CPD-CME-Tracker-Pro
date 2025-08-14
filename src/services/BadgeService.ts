import { CERTIFICATION_BADGES, BadgeLevel } from '../components/common/CertificationBadge';
import { CMEEntry, User, Certificate } from '../types';
import { databaseOperations } from './database';

export interface BadgeProgress {
  badge: BadgeLevel;
  earned: boolean;
  progress: number; // 0-1
  earnedDate?: string;
}

export class BadgeService {
  /**
   * Calculates badge progress for a user
   */
  static async calculateBadgeProgress(
    user: User, 
    entries: CMEEntry[], 
    certificates: Certificate[]
  ): Promise<BadgeProgress[]> {
    const badgeProgress: BadgeProgress[] = [];
    
    // Calculate total credits
    const totalCredits = entries.reduce((sum, entry) => sum + entry.creditsEarned, 0);
    
    // Calculate unique categories
    const uniqueCategories = new Set(entries.map(entry => entry.category)).size;
    
    // Calculate certificate count
    const certificateCount = certificates.length;
    
    // Calculate annual progress
    const annualProgress = user.annualRequirement > 0 ? totalCredits / user.annualRequirement : 0;
    
    for (const badge of CERTIFICATION_BADGES) {
      let progress = 0;
      let earned = false;
      
      switch (badge.type) {
        case 'credits':
          progress = Math.min(totalCredits / badge.requirement, 1);
          earned = totalCredits >= badge.requirement;
          break;
          
        case 'milestone':
          if (badge.id === 'annual_achiever') {
            progress = Math.min(annualProgress, 1);
            earned = annualProgress >= 1;
          } else if (badge.id === 'early_bird') {
            // Check if completed 6 months early (simplified)
            progress = annualProgress >= 1 ? 1 : 0;
            earned = this.checkEarlyCompletion(user, entries);
          } else if (badge.id === 'overachiever') {
            progress = Math.min(annualProgress / 1.5, 1);
            earned = annualProgress >= 1.5;
          }
          break;
          
        case 'streak':
          // Simplified streak calculation (would need more sophisticated tracking)
          const recentDays = this.calculateRecentActivityDays(entries);
          progress = Math.min(recentDays / badge.requirement, 1);
          earned = recentDays >= badge.requirement;
          break;
          
        case 'special':
          if (badge.id === 'category_explorer') {
            progress = Math.min(uniqueCategories / badge.requirement, 1);
            earned = uniqueCategories >= badge.requirement;
          } else if (badge.id === 'certificate_collector') {
            progress = Math.min(certificateCount / badge.requirement, 1);
            earned = certificateCount >= badge.requirement;
          }
          break;
      }
      
      badgeProgress.push({
        badge,
        earned,
        progress,
        earnedDate: earned ? this.calculateEarnedDate(badge, entries, user) : undefined
      });
    }
    
    return badgeProgress.sort((a, b) => {
      // Sort by: earned first, then by progress, then by requirement
      if (a.earned !== b.earned) return a.earned ? -1 : 1;
      if (a.progress !== b.progress) return b.progress - a.progress;
      return a.badge.requirement - b.badge.requirement;
    });
  }
  
  /**
   * Gets newly earned badges since last check
   */
  static async getNewlyEarnedBadges(
    user: User, 
    entries: CMEEntry[], 
    certificates: Certificate[],
    lastCheckDate?: string
  ): Promise<BadgeProgress[]> {
    const allProgress = await this.calculateBadgeProgress(user, entries, certificates);
    const newlyEarned = allProgress.filter(bp => 
      bp.earned && 
      bp.earnedDate && 
      (!lastCheckDate || bp.earnedDate > lastCheckDate)
    );
    
    return newlyEarned;
  }
  
  /**
   * Gets badges that are close to being earned (>= 80% progress)
   */
  static async getAlmostEarnedBadges(
    user: User, 
    entries: CMEEntry[], 
    certificates: Certificate[]
  ): Promise<BadgeProgress[]> {
    const allProgress = await this.calculateBadgeProgress(user, entries, certificates);
    return allProgress.filter(bp => !bp.earned && bp.progress >= 0.8);
  }
  
  /**
   * Private helper methods
   */
  private static checkEarlyCompletion(user: User, entries: CMEEntry[]): boolean {
    if (!user.cycleStartDate || !user.cycleEndDate) return false;
    
    const cycleStart = new Date(user.cycleStartDate);
    const cycleEnd = new Date(user.cycleEndDate);
    const sixMonthsEarly = new Date(cycleEnd);
    sixMonthsEarly.setMonth(sixMonthsEarly.getMonth() - 6);
    
    const totalCredits = entries.reduce((sum, entry) => sum + entry.creditsEarned, 0);
    
    // Check if requirement was met before the 6-months-early date
    if (totalCredits >= user.annualRequirement) {
      const sortedEntries = entries
        .filter(entry => entry.creditsEarned > 0)
        .sort((a, b) => new Date(a.dateAttended).getTime() - new Date(b.dateAttended).getTime());
      
      let runningTotal = 0;
      for (const entry of sortedEntries) {
        runningTotal += entry.creditsEarned;
        if (runningTotal >= user.annualRequirement) {
          const completionDate = new Date(entry.dateAttended);
          return completionDate <= sixMonthsEarly;
        }
      }
    }
    
    return false;
  }
  
  private static calculateRecentActivityDays(entries: CMEEntry[]): number {
    if (entries.length === 0) return 0;
    
    // Simplified: count unique days with activity in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentEntries = entries.filter(entry => 
      new Date(entry.dateAttended) >= thirtyDaysAgo
    );
    
    const uniqueDays = new Set(
      recentEntries.map(entry => entry.dateAttended.split('T')[0])
    );
    
    return uniqueDays.size;
  }
  
  private static calculateEarnedDate(badge: BadgeLevel, entries: CMEEntry[], user: User): string {
    const sortedEntries = entries
      .filter(entry => entry.creditsEarned > 0)
      .sort((a, b) => new Date(a.dateAttended).getTime() - new Date(b.dateAttended).getTime());
    
    switch (badge.type) {
      case 'credits':
        let runningTotal = 0;
        for (const entry of sortedEntries) {
          runningTotal += entry.creditsEarned;
          if (runningTotal >= badge.requirement) {
            return entry.dateAttended;
          }
        }
        break;
        
      case 'milestone':
        if (badge.id === 'annual_achiever' || badge.id === 'overachiever') {
          const targetCredits = badge.id === 'annual_achiever' 
            ? user.annualRequirement 
            : user.annualRequirement * 1.5;
          
          let runningTotal = 0;
          for (const entry of sortedEntries) {
            runningTotal += entry.creditsEarned;
            if (runningTotal >= targetCredits) {
              return entry.dateAttended;
            }
          }
        }
        break;
        
      default:
        // For other types, use the most recent entry date
        if (sortedEntries.length > 0) {
          return sortedEntries[sortedEntries.length - 1].dateAttended;
        }
    }
    
    // Fallback to current date
    return new Date().toISOString().split('T')[0];
  }
  
  /**
   * Badge statistics
   */
  static async getBadgeStatistics(
    user: User, 
    entries: CMEEntry[], 
    certificates: Certificate[]
  ): Promise<{
    totalBadges: number;
    earnedBadges: number;
    completionRate: number;
    nextBadge?: BadgeProgress;
    recentlyEarned: BadgeProgress[];
  }> {
    const progress = await this.calculateBadgeProgress(user, entries, certificates);
    
    const earnedCount = progress.filter(bp => bp.earned).length;
    const completionRate = (earnedCount / progress.length) * 100;
    
    // Find next badge (highest progress among unearned)
    const nextBadge = progress
      .filter(bp => !bp.earned)
      .sort((a, b) => b.progress - a.progress)[0];
    
    // Recently earned (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentlyEarned = progress.filter(bp => 
      bp.earned && 
      bp.earnedDate && 
      new Date(bp.earnedDate) >= thirtyDaysAgo
    );
    
    return {
      totalBadges: progress.length,
      earnedBadges: earnedCount,
      completionRate,
      nextBadge,
      recentlyEarned
    };
  }
}