# Technical Debt Tracker - Noyola Games

> Track "fix later" items so they don't get lost.

## How to Use

1. **Add items** when you make a conscious decision to defer work
2. **Reference in code** with `// DEBT: #TD-XXX` comments
3. **Review regularly** during planning or before releases
4. **Move to Resolved** when completed (don't delete - keep history)

### Quick Add Template
```
| TD-XXX | [Description] | `path/to/file.js:XX` | YYYY-MM-DD | High/Med/Low |
```

---

## Active Debt

### Critical (blocking deployment or major risk)
| ID | Description | Location | Added | Owner | Notes |
|----|-------------|----------|-------|-------|-------|
| | | | | | |

### High Priority (should fix in next sprint)
| ID | Description | Location | Added | Owner | Notes |
|----|-------------|----------|-------|-------|-------|
| | | | | | |

### Medium Priority (fix when touching this code)
| ID | Description | Location | Added | Owner | Notes |
|----|-------------|----------|-------|-------|-------|
| | | | | | |

### Low Priority (nice to have / someday)
| ID | Description | Location | Added | Owner | Notes |
|----|-------------|----------|-------|-------|-------|
| | | | | | |

---

## Categories

Use these tags in the Notes column:

| Tag | Meaning |
|-----|---------|
| `#refactor` | Code needs restructuring |
| `#performance` | Performance/frame rate improvements |
| `#audio` | Audio issues or improvements |
| `#assets` | Missing or placeholder assets |
| `#testing` | Missing tests |
| `#mobile` | Mobile/touch improvements |
| `#cleanup` | Dead code, unused imports, etc. |
| `#juice` | Game feel improvements |
| `#balance` | Game balance tweaks needed |

---

## Resolved Debt

| ID | Description | Added | Resolved | Resolution |
|----|-------------|-------|----------|------------|
| | | | | |
