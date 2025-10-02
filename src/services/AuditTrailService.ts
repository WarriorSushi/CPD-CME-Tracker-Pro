import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Audit Trail Service
 * Tracks important user actions for debugging and compliance
 */

export interface AuditEvent {
  id: string;
  timestamp: string;
  action: string;
  entityType: 'cme_entry' | 'license' | 'certificate' | 'user' | 'export' | 'system';
  entityId?: string | number;
  details: Record<string, any>;
  success: boolean;
  error?: string;
}

export class AuditTrailService {
  private static readonly STORAGE_KEY = 'cme_audit_trail';
  private static readonly MAX_EVENTS = 1000; // Keep last 1000 events
  private static readonly RETENTION_DAYS = 90; // Keep events for 90 days

  /**
   * Logs an audit event
   */
  static async logEvent(
    action: string,
    entityType: AuditEvent['entityType'],
    details: Record<string, any>,
    success: boolean = true,
    entityId?: string | number,
    error?: string
  ): Promise<void> {
    try {
      const event: AuditEvent = {
        id: this.generateEventId(),
        timestamp: new Date().toISOString(),
        action,
        entityType,
        entityId,
        details: this.sanitizeDetails(details),
        success,
        error,
      };

      const events = await this.getEvents();
      events.push(event);

      // Cleanup old events
      const cleanedEvents = this.cleanupEvents(events);
      
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(cleanedEvents));
      
      // In development, also log to console
      if (__DEV__) {

      }
    } catch (error) {
      __DEV__ && console.error('Failed to log audit event:', error);
      // Don't throw - audit logging should never break the app
    }
  }

  /**
   * Retrieves all audit events
   */
  static async getEvents(): Promise<AuditEvent[]> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      __DEV__ && console.error('Failed to retrieve audit events:', error);
      return [];
    }
  }

  /**
   * Retrieves events filtered by criteria
   */
  static async getEventsByFilter(filter: {
    entityType?: AuditEvent['entityType'];
    action?: string;
    success?: boolean;
    fromDate?: Date;
    toDate?: Date;
    entityId?: string | number;
  }): Promise<AuditEvent[]> {
    const events = await this.getEvents();
    
    return events.filter(event => {
      if (filter.entityType && event.entityType !== filter.entityType) return false;
      if (filter.action && event.action !== filter.action) return false;
      if (filter.success !== undefined && event.success !== filter.success) return false;
      if (filter.entityId && event.entityId !== filter.entityId) return false;
      
      const eventDate = new Date(event.timestamp);
      if (filter.fromDate && eventDate < filter.fromDate) return false;
      if (filter.toDate && eventDate > filter.toDate) return false;
      
      return true;
    });
  }

  /**
   * Gets recent activity summary
   */
  static async getRecentActivity(limit: number = 50): Promise<AuditEvent[]> {
    const events = await this.getEvents();
    return events
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * Gets statistics about audit events
   */
  static async getAuditStatistics(): Promise<{
    totalEvents: number;
    successRate: number;
    entityBreakdown: Record<string, number>;
    actionBreakdown: Record<string, number>;
    recentErrors: AuditEvent[];
  }> {
    const events = await this.getEvents();
    
    const totalEvents = events.length;
    const successfulEvents = events.filter(e => e.success).length;
    const successRate = totalEvents > 0 ? (successfulEvents / totalEvents) * 100 : 100;
    
    const entityBreakdown: Record<string, number> = {};
    const actionBreakdown: Record<string, number> = {};
    
    events.forEach(event => {
      entityBreakdown[event.entityType] = (entityBreakdown[event.entityType] || 0) + 1;
      actionBreakdown[event.action] = (actionBreakdown[event.action] || 0) + 1;
    });
    
    const recentErrors = events
      .filter(e => !e.success)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    return {
      totalEvents,
      successRate,
      entityBreakdown,
      actionBreakdown,
      recentErrors,
    };
  }

  /**
   * Exports audit trail as text report
   */
  static async exportAuditTrail(): Promise<string> {
    const events = await this.getEvents();
    const stats = await this.getAuditStatistics();
    
    const lines: string[] = [];
    
    lines.push('=== CME TRACKER AUDIT TRAIL ===');
    lines.push(`Generated: ${new Date().toLocaleString()}`);
    lines.push(`Total Events: ${stats.totalEvents}`);
    lines.push(`Success Rate: ${stats.successRate.toFixed(1)}%`);
    lines.push('');
    
    lines.push('[DATA] ENTITY BREAKDOWN:');
    Object.entries(stats.entityBreakdown).forEach(([entity, count]) => {
      lines.push(`  ${entity}: ${count}`);
    });
    lines.push('');
    
    lines.push('[LIST] ACTION BREAKDOWN:');
    Object.entries(stats.actionBreakdown).forEach(([action, count]) => {
      lines.push(`  ${action}: ${count}`);
    });
    lines.push('');
    
    if (stats.recentErrors.length > 0) {
      lines.push('[ERROR] RECENT ERRORS:');
      stats.recentErrors.forEach(error => {
        lines.push(`  [${error.timestamp}] ${error.action} on ${error.entityType} - ${error.error}`);
      });
      lines.push('');
    }
    
    lines.push('[DETAILS] DETAILED EVENTS:');
    events
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .forEach(event => {
        const status = event.success ? '[OK]' : '[ERROR]';
        const entityInfo = event.entityId ? ` [${event.entityId}]` : '';
        lines.push(`${status} [${event.timestamp}] ${event.action} ${event.entityType}${entityInfo}`);
        if (event.error) {
          lines.push(`    Error: ${event.error}`);
        }
        if (Object.keys(event.details).length > 0) {
          lines.push(`    Details: ${JSON.stringify(event.details)}`);
        }
      });
    
    return lines.join('\n');
  }

  /**
   * Clears all audit events (use with caution)
   */
  static async clearAuditTrail(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      await this.logEvent('clear_audit_trail', 'system', { reason: 'manual_clear' });
    } catch (error) {
      __DEV__ && console.error('Failed to clear audit trail:', error);
      throw error;
    }
  }

  /**
   * Convenient logging methods for common actions
   */
  static async logCMEAction(action: string, entryId: number, details: any, success: boolean, error?: string) {
    await this.logEvent(action, 'cme_entry', details, success, entryId, error);
  }

  static async logLicenseAction(action: string, licenseId: number, details: any, success: boolean, error?: string) {
    await this.logEvent(action, 'license', details, success, licenseId, error);
  }

  static async logCertificateAction(action: string, certId: number, details: any, success: boolean, error?: string) {
    await this.logEvent(action, 'certificate', details, success, certId, error);
  }

  static async logUserAction(action: string, details: any, success: boolean, error?: string) {
    await this.logEvent(action, 'user', details, success, undefined, error);
  }

  static async logExportAction(exportType: string, details: any, success: boolean, error?: string) {
    await this.logEvent(`export_${exportType}`, 'export', details, success, undefined, error);
  }

  static async logSystemAction(action: string, details: any, success: boolean, error?: string) {
    await this.logEvent(action, 'system', details, success, undefined, error);
  }

  /**
   * Private helper methods
   */
  private static generateEventId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private static sanitizeDetails(details: Record<string, any>): Record<string, any> {
    // Remove sensitive information
    const sanitized = { ...details };
    
    // Remove potential passwords, tokens, etc.
    const sensitiveKeys = ['password', 'token', 'key', 'secret', 'credential'];
    sensitiveKeys.forEach(key => {
      if (key in sanitized) {
        sanitized[key] = '[REDACTED]';
      }
    });
    
    // Truncate long strings
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'string' && sanitized[key].length > 500) {
        sanitized[key] = sanitized[key].substring(0, 500) + '...[TRUNCATED]';
      }
    });
    
    return sanitized;
  }

  private static cleanupEvents(events: AuditEvent[]): AuditEvent[] {
    const now = new Date();
    const retentionDate = new Date(now.getTime() - (this.RETENTION_DAYS * 24 * 60 * 60 * 1000));
    
    // Filter out old events
    let filtered = events.filter(event => new Date(event.timestamp) > retentionDate);
    
    // Keep only the most recent events if still too many
    if (filtered.length > this.MAX_EVENTS) {
      filtered = filtered
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, this.MAX_EVENTS);
    }
    
    return filtered;
  }
}