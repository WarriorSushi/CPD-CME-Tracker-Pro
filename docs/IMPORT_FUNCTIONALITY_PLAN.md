# 📥 Import/Restore Functionality - Implementation Plan

## 🎯 Objective
Implement comprehensive data import and restore functionality to allow users to:
1. Import JSON backups created by the app
2. Restore complete app state from backups
3. Handle conflicts and data merging
4. Validate backup integrity before import
5. Provide clear feedback during the import process

---

## 📋 Current State Analysis

### ✅ What We Have:
- **Export Functions** (`dataExport.ts`):
  - `createBackup()` - Creates JSON backup with user, entries, and licenses
  - JSON format includes version stamp
  - Uses expo-sharing for file distribution

- **Database Operations** (`database/operations.ts`):
  - Full CRUD operations for CME entries
  - Full CRUD operations for licenses
  - User management functions
  - Certificate management

- **File System Access**:
  - `expo-file-system` (installed ✅)
  - `expo-document-picker` (installed ✅)
  - Can read/write local files

### ❌ What's Missing:
1. **No import validation** - Need to verify backup file structure
2. **No conflict resolution** - What happens if data already exists?
3. **No import UI** - Need user interface for import process
4. **No rollback mechanism** - If import fails midway
5. **No certificate restoration** - Images not included in JSON backup
6. **No version compatibility check** - Future-proofing

---

## 🏗️ Architecture Design

### File Structure
```
src/
├── services/
│   ├── import/
│   │   ├── importService.ts          # Main import orchestrator
│   │   ├── backupValidator.ts        # Validate backup file structure
│   │   ├── conflictResolver.ts       # Handle data conflicts
│   │   └── types.ts                  # Import-specific types
│   └── database/
│       └── operations.ts             # (existing - will extend)
├── screens/
│   └── settings/
│       └── ImportBackupScreen.tsx    # NEW: Import UI screen
└── utils/
    └── dataExport.ts                 # (existing - will extend)
```

---

## 📝 Detailed Implementation Steps

### **Phase 1: Core Import Service** (Day 1-2)

#### 1.1 Create Backup Validator (`backupValidator.ts`)

```typescript
export interface BackupValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metadata: {
    version: string;
    exportDate: string;
    entriesCount: number;
    licensesCount: number;
  };
}

export class BackupValidator {
  /**
   * Validates backup file structure and content
   */
  static async validateBackup(backupData: any): Promise<BackupValidationResult>

  /**
   * Checks if backup version is compatible with current app version
   */
  static isVersionCompatible(backupVersion: string): boolean

  /**
   * Validates individual CME entry structure
   */
  static validateCMEEntry(entry: any): { isValid: boolean; errors: string[] }

  /**
   * Validates license structure
   */
  static validateLicense(license: any): { isValid: boolean; errors: string[] }

  /**
   * Validates user data structure
   */
  static validateUser(user: any): { isValid: boolean; errors: string[] }
}
```

**Key Validations:**
- Required fields present (title, provider, dateAttended, etc.)
- Data types correct (numbers for credits, valid dates)
- No SQL injection attempts in strings
- Version compatibility check
- Reasonable data ranges (credits 0-100, dates not in far future)

#### 1.2 Create Conflict Resolver (`conflictResolver.ts`)

```typescript
export enum ConflictResolutionStrategy {
  REPLACE_ALL = 'replace_all',        // Delete existing, import all
  MERGE_SKIP_DUPLICATES = 'merge_skip', // Keep existing, add new only
  MERGE_UPDATE_EXISTING = 'merge_update', // Update existing, add new
  CANCEL = 'cancel'                   // User cancels import
}

export interface ConflictInfo {
  existingEntriesCount: number;
  existingLicensesCount: number;
  newEntriesCount: number;
  newLicensesCount: number;
  potentialDuplicates: {
    entries: Array<{ existing: CMEEntry; incoming: CMEEntry; similarity: number }>;
    licenses: Array<{ existing: LicenseRenewal; incoming: LicenseRenewal }>;
  };
}

export class ConflictResolver {
  /**
   * Analyzes conflicts between existing and incoming data
   */
  static async analyzeConflicts(
    backupData: BackupData,
    existingData: ExistingData
  ): Promise<ConflictInfo>

  /**
   * Detects duplicate CME entries (same title, date, provider)
   */
  static findDuplicateEntries(
    existing: CMEEntry[],
    incoming: CMEEntry[]
  ): Array<DuplicatePair>

  /**
   * Applies selected conflict resolution strategy
   */
  static async resolveConflicts(
    backupData: BackupData,
    strategy: ConflictResolutionStrategy
  ): Promise<{ success: boolean; message: string }>
}
```

**Conflict Detection:**
- CME Entry duplicates: Same title + date + provider + credits
- License duplicates: Same type + authority + license number
- User data: Only one user, so always replace

#### 1.3 Create Main Import Service (`importService.ts`)

```typescript
export interface ImportProgress {
  step: 'reading' | 'validating' | 'analyzing' | 'importing' | 'complete' | 'error';
  progress: number; // 0-100
  message: string;
}

export interface ImportResult {
  success: boolean;
  message: string;
  stats: {
    entriesImported: number;
    entriesSkipped: number;
    licensesImported: number;
    licensesSkipped: number;
    userUpdated: boolean;
  };
}

export class ImportService {
  /**
   * Main import orchestrator - handles entire import flow
   */
  static async importBackup(
    fileUri: string,
    strategy: ConflictResolutionStrategy,
    onProgress?: (progress: ImportProgress) => void
  ): Promise<ImportResult>

  /**
   * Reads and parses backup file
   */
  static async readBackupFile(fileUri: string): Promise<BackupData>

  /**
   * Creates database snapshot before import (for rollback)
   */
  static async createSnapshot(): Promise<string>

  /**
   * Restores from snapshot if import fails
   */
  static async rollbackToSnapshot(snapshotId: string): Promise<boolean>

  /**
   * Imports user data
   */
  private static async importUserData(user: User): Promise<boolean>

  /**
   * Imports CME entries
   */
  private static async importCMEEntries(
    entries: CMEEntry[],
    strategy: ConflictResolutionStrategy
  ): Promise<{ imported: number; skipped: number }>

  /**
   * Imports licenses
   */
  private static async importLicenses(
    licenses: LicenseRenewal[],
    strategy: ConflictResolutionStrategy
  ): Promise<{ imported: number; skipped: number }>
}
```

**Import Flow:**
1. Read file → Parse JSON
2. Validate structure → Show errors if invalid
3. Analyze conflicts → Show conflict summary
4. User chooses strategy → Apply strategy
5. Create snapshot → Safety backup
6. Import data → Progress updates
7. Success → Show stats
8. Error → Rollback → Show error

---

### **Phase 2: User Interface** (Day 3)

#### 2.1 Create Import Backup Screen (`ImportBackupScreen.tsx`)

**UI Components:**

1. **File Picker Section**
   - Button: "Select Backup File"
   - Uses `expo-document-picker`
   - Filters: `.json` files only

2. **Validation Status Display**
   - ✅ Valid backup file
   - ⚠️ Warnings (version mismatch, missing fields)
   - ❌ Invalid file (show errors)
   - Backup metadata preview (date, version, counts)

3. **Conflict Analysis Section**
   - Show existing data counts
   - Show incoming data counts
   - Highlight potential duplicates
   - Visual comparison table

4. **Strategy Selection**
   - Radio buttons:
     - ⚠️ **Replace All Data** (destructive - show warning)
     - ✅ **Merge - Skip Duplicates** (safe - recommended)
     - 🔄 **Merge - Update Existing** (moderate)
   - Clear explanation of each strategy

5. **Import Progress**
   - Progress bar (0-100%)
   - Current step indicator
   - Cancel button (only before import starts)

6. **Results Screen**
   - Success summary
   - Stats breakdown
   - "Done" button

**UI Flow:**
```
[Select File]
   ↓
[Validating...]
   ↓
[Show Validation Results] → If invalid: [Show Errors] → [Cancel]
   ↓
[Analyzing Conflicts...]
   ↓
[Show Conflict Summary] → [Choose Strategy]
   ↓
[Confirm Import?] → [Cancel] or [Import]
   ↓
[Importing... Progress Bar]
   ↓
[Success! Show Stats] or [Error! Show Message]
   ↓
[Done]
```

---

### **Phase 3: Integration** (Day 4)

#### 3.1 Add Import Button to Settings Screen

**Location:** Settings Screen → Data Management Section

**Update `SettingsScreen.tsx`:**
```typescript
<View style={styles.modernButtonGrid}>
  {/* Existing Export Data button */}
  <TouchableOpacity
    style={styles.modernActionButton}
    onPress={handleExportData}
    disabled={isExporting}
  >
    <SvgIcon name="export" size={28} color="#1e40af" />
    <Text style={styles.modernActionText}>Export Data</Text>
    <Text style={styles.modernActionSubtext}>CSV & PDF</Text>
  </TouchableOpacity>

  {/* NEW: Import Data button */}
  <TouchableOpacity
    style={styles.modernActionButton}
    onPress={() => navigation.navigate('ImportBackup')}
  >
    <SvgIcon name="import" size={28} color="#1e40af" />
    <Text style={styles.modernActionText}>Import Data</Text>
    <Text style={styles.modernActionSubtext}>Restore Backup</Text>
  </TouchableOpacity>

  {/* Existing Create Backup button */}
  <TouchableOpacity
    style={styles.modernActionButton}
    onPress={handleCreateBackup}
    disabled={isExporting}
  >
    <SvgIcon name="backup" size={28} color="#1e40af" />
    <Text style={styles.modernActionText}>Create Backup</Text>
    <Text style={styles.modernActionSubtext}>Full Backup</Text>
  </TouchableOpacity>
</View>
```

#### 3.2 Add Navigation Route

**Update navigation stack:**
```typescript
// In MainTabNavigator.tsx or SettingsNavigator.tsx
<Stack.Screen
  name="ImportBackup"
  component={ImportBackupScreen}
  options={{
    title: 'Import Backup',
    headerShown: true
  }}
/>
```

#### 3.3 Add Import Icon to SvgIcon Component

**Update `SvgIcon.tsx`:**
```typescript
case 'import':
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2L12 15M12 15L8 11M12 15L16 11"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4 17V19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19V17"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
```

---

### **Phase 4: Testing & Error Handling** (Day 5)

#### 4.1 Test Cases

**Valid Scenarios:**
1. ✅ Import empty backup (no entries, no licenses)
2. ✅ Import backup with only entries
3. ✅ Import backup with only licenses
4. ✅ Import full backup (user + entries + licenses)
5. ✅ Import into empty app (first-time restore)
6. ✅ Import into app with existing data (merge)

**Invalid Scenarios:**
1. ❌ Corrupted JSON file
2. ❌ Non-JSON file (.txt, .pdf)
3. ❌ JSON with missing required fields
4. ❌ Incompatible version (future version)
5. ❌ Invalid data types (string for credits)
6. ❌ SQL injection attempts in strings

**Edge Cases:**
1. 🔸 Import same backup twice
2. 🔸 Import during active operation
3. 🔸 Import very large backup (1000+ entries)
4. 🔸 Import interrupted (user closes app)
5. 🔸 Low storage space
6. 🔸 File permissions issues

#### 4.2 Error Messages

**User-Friendly Error Messages:**
```typescript
const ERROR_MESSAGES = {
  FILE_NOT_FOUND: 'Could not find the backup file. Please try again.',
  INVALID_JSON: 'The selected file is not a valid backup file.',
  CORRUPTED_FILE: 'The backup file appears to be corrupted or incomplete.',
  VERSION_TOO_NEW: 'This backup was created with a newer version of the app. Please update the app to restore this backup.',
  VERSION_TOO_OLD: 'This backup is from an older version and cannot be imported. Please create a new backup from the source device.',
  MISSING_FIELDS: 'The backup file is missing required information.',
  IMPORT_FAILED: 'Import failed. Your existing data has been preserved.',
  STORAGE_FULL: 'Not enough storage space to import backup.',
  PERMISSION_DENIED: 'Unable to access the backup file. Please check file permissions.',
};
```

#### 4.3 Logging & Debugging

**Add audit trail logging:**
```typescript
await AuditTrailService.logImportAction('backup_import_started', {
  fileName: fileUri,
  strategy: strategy,
});

// ... import process ...

await AuditTrailService.logImportAction('backup_import_completed', {
  entriesImported: stats.entriesImported,
  licensesImported: stats.licensesImported,
  duration: Date.now() - startTime,
}, success);
```

---

## 🎨 UI/UX Specifications

### Design Principles
1. **Safety First**: Multiple confirmations for destructive actions
2. **Transparency**: Show exactly what will happen before it happens
3. **Progress Feedback**: Clear progress indicators during import
4. **Error Recovery**: Always provide a way to recover from errors

### Visual Design
- **Colors**:
  - Safe actions: Primary blue (#003087)
  - Warnings: Amber (#f59e0b)
  - Destructive: Red (#ef4444)
  - Success: Green (#10b981)

- **Icons**:
  - Import: Download arrow into tray
  - Validation: Checkmark or X
  - Progress: Circular progress indicator
  - Warning: Triangle with exclamation

### Accessibility
- Large touch targets (minimum 44x44pt)
- High contrast text
- Screen reader support for all states
- Clear error messages
- No time-based interactions

---

## 🔒 Security Considerations

### Data Validation
- **Sanitize all inputs** - Prevent SQL injection
- **Type checking** - Validate data types before insertion
- **Range validation** - Credits 0-1000, dates within reasonable range
- **String length limits** - Prevent memory overflow

### File Security
- **Verify file source** - Only accept .json files
- **Size limits** - Max 50MB backup file
- **No executable content** - Strip any script tags
- **Read-only operations** - Never execute imported code

### Privacy
- **No telemetry** - Don't track import operations externally
- **Local-only** - All operations happen on device
- **No cloud upload** - Maintain offline-first principle

---

## 📊 Success Metrics

### Functionality Goals
- ✅ Successfully import valid backups 99% of the time
- ✅ Detect invalid backups 100% of the time
- ✅ Rollback on failure 100% of the time
- ✅ Import time < 5 seconds for typical backup (100 entries)

### User Experience Goals
- ✅ Clear progress feedback at all times
- ✅ No data loss during failed imports
- ✅ Intuitive conflict resolution choices
- ✅ < 5 taps to complete import

---

## 🚀 Implementation Timeline

### **Day 1: Core Validation**
- [ ] Create `backupValidator.ts`
- [ ] Implement validation functions
- [ ] Write unit tests for validation
- [ ] Test with sample backup files

### **Day 2: Import Service & Conflict Resolution**
- [ ] Create `conflictResolver.ts`
- [ ] Implement conflict detection
- [ ] Create `importService.ts`
- [ ] Implement import orchestration
- [ ] Add rollback mechanism

### **Day 3: User Interface**
- [ ] Create `ImportBackupScreen.tsx`
- [ ] Implement file picker integration
- [ ] Build validation results display
- [ ] Create conflict resolution UI
- [ ] Add progress indicator

### **Day 4: Integration**
- [ ] Add import button to Settings
- [ ] Update navigation routes
- [ ] Add import icon to SvgIcon
- [ ] Connect all screens
- [ ] Test complete flow

### **Day 5: Testing & Polish**
- [ ] Test all valid scenarios
- [ ] Test all invalid scenarios
- [ ] Test edge cases
- [ ] Fix bugs
- [ ] Polish UI/UX
- [ ] Add error messages
- [ ] Final integration test

---

## 🔄 Future Enhancements (v2)

### Certificate Import (Complex)
**Challenge**: JSON backup doesn't include image files

**Solution Options:**
1. **ZIP Archive**: Create backup as .zip with /data.json + /certificates/
2. **Base64 Encoding**: Include images as base64 in JSON (increases file size 30%)
3. **Separate Import**: Import data first, then prompt to import certificates separately

**Recommended**: ZIP Archive approach for v2

### Selective Import
- Allow user to choose what to import (entries only, licenses only, etc.)
- Import specific date ranges
- Import specific categories

### Cloud Sync (Future - Privacy Concerns)
- Optional encrypted cloud backup
- Device-to-device sync via encrypted cloud
- Requires user consent and encryption key management

### Incremental Backup/Restore
- Only backup/restore changed data since last backup
- Reduces file size and import time
- Requires timestamp tracking

---

## 📝 Code Quality Standards

### TypeScript
- ✅ Strict type checking enabled
- ✅ No `any` types (use proper interfaces)
- ✅ Comprehensive error handling
- ✅ Async/await for all I/O operations

### Testing
- ✅ Unit tests for validation logic
- ✅ Integration tests for import flow
- ✅ Mock database for testing
- ✅ 80%+ code coverage goal

### Documentation
- ✅ JSDoc comments for all public functions
- ✅ Inline comments for complex logic
- ✅ README for import service
- ✅ User-facing help documentation

---

## ✅ Definition of Done

The import functionality is complete when:

1. ✅ User can select a JSON backup file
2. ✅ App validates backup file structure
3. ✅ App shows clear validation results (pass/fail with errors)
4. ✅ App detects conflicts with existing data
5. ✅ User can choose conflict resolution strategy
6. ✅ App imports data with progress feedback
7. ✅ App shows detailed import results
8. ✅ Failed imports rollback without data loss
9. ✅ All test cases pass
10. ✅ Code reviewed and merged to feature branch

---

## 🆘 Support & Troubleshooting

### Common User Issues

**"Import failed - file corrupted"**
- Solution: Re-create backup from source device
- Prevention: Add checksum validation in future

**"Some entries were skipped"**
- Solution: This is normal with "Skip Duplicates" strategy
- Show user which entries were skipped and why

**"Import taking too long"**
- Solution: Show progress bar, allow background import
- Prevention: Optimize database batch inserts

---

## 📚 References

- Expo FileSystem: https://docs.expo.dev/versions/latest/sdk/filesystem/
- Expo DocumentPicker: https://docs.expo.dev/versions/latest/sdk/document-picker/
- SQLite Transactions: For atomic rollback
- React Native AsyncStorage: For import state persistence

---

**Generated:** ${new Date().toISOString()}
**Version:** 1.0
**Status:** Ready for Implementation
