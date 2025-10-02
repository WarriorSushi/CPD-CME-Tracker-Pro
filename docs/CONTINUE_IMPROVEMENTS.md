# 🚀 Continue Improvements - Quick Start Guide

Use this prompt when starting a new Claude Code session to continue improvements:

---

## 📋 COPY-PASTE PROMPT:

```
I need you to implement the improvements from our comprehensive app analysis.

CONTEXT:
- Project: CME Tracker (React Native/Expo app)
- Location: /mnt/c/cmetracker/app/cme-tracker/
- Current branch: feature/app-improvements

INSTRUCTIONS:
1. Read the Master Roadmap: /mnt/c/cmetracker/app/cme-tracker/docs/MASTER_IMPROVEMENT_ROADMAP.md
2. Read all analysis reports in: /mnt/c/cmetracker/app/cme-tracker/docs/analysis/
3. Check git status to see what's been completed
4. Continue with next priority item from the roadmap
5. Use TodoWrite to track progress
6. Commit changes as you complete each item
7. DO NOT push to GitHub unless I explicitly tell you

IMPORTANT RULES:
- Always explain what you're doing (ELI5 style)
- Test changes work before moving to next item
- No git pushes unless I say so
- Save any new markdown documentation to /docs/ folder
- Ask before making major architectural changes

Check the roadmap and tell me:
1. What's been completed so far
2. What should we work on next
3. Estimated time for next item

Ready to continue!
```

---

## 🔍 Alternative: Check Progress First

If you want to know where you left off:

```
Check CME Tracker improvement progress:

1. Read: /mnt/c/cmetracker/app/cme-tracker/docs/MASTER_IMPROVEMENT_ROADMAP.md
2. Check git log to see completed items
3. Tell me what's done and what's next

Branch: feature/app-improvements
```

---

## 📂 Key Files to Reference:

- **Master Plan**: `/docs/MASTER_IMPROVEMENT_ROADMAP.md`
- **UI/UX Details**: `/docs/analysis/UI_UX_ANALYSIS.md`
- **Code Quality**: `/docs/analysis/CODE_QUALITY_ANALYSIS.md`
- **Architecture**: `/docs/analysis/COMPONENT_ARCHITECTURE_ANALYSIS.md`
- **User Flows**: `/docs/analysis/USER_FLOW_ANALYSIS.md`

---

## ⚠️ Remember:

- Working directory: `/mnt/c/cmetracker/app/cme-tracker/`
- Feature branch: `feature/app-improvements`
- Never push without explicit permission
- All docs go in `/docs/` folder
- ELI5 explanations always

---

**Last Updated:** October 2, 2025
