# devrec

A CLI tool that analyzes git commits from multiple repositories, categorizes them,
and generates summaries in markdown.

## Installation

### From npm (when published)

```bash
npm install -g devrec
```

### From source

```bash
git clone <repo-url>
cd devrec
npm install
npm run build
npm link
```

### Verify installation

```bash
devrec --version
```

## Quick start

1. **Initialize configuration**

   ```bash
   devrec init
   ```

   This command interactively prompts you for:
   - Your git email addresses
   - Repository paths to track
   - Main branch name (default: main)
   - Branch scanning strategy (all or remote-only)

2. **View today's commits**

   ```bash
   devrec today
   ```

3. **Generate markdown summary**

   ```bash
   devrec today --format markdown --summary
   ```

## Usage

### Commands

#### `devrec init`

Create or update configuration interactively.

#### `devrec today`

Show commits from today (since midnight).

#### `devrec yesterday`

Show commits from yesterday (previous calendar day).

#### `devrec week`

Show commits from current week (Monday to today). On Monday, shows the previous
complete week (last Monday to Sunday).

#### `devrec sprint`

Show commits from current sprint. Sprint length is configurable (default: 2 weeks).

#### `devrec all`

Show all commits from all time.

### Flags

All time-range commands support these flags:

| Flag         | Description          | Values                      | Default |
| ------------ | -------------------- | --------------------------- | ------- |
| `--format`   | Output format        | `plain`, `markdown`         | `plain` |
| `--color`    | Color mode           | `always`, `never`, `auto`   | `auto`  |
| `--summary`  | Show statistics      | (boolean)                   | `false` |
| `--repo`     | Filter by repository | Repository name from config | All     |
| `--category` | Filter by category   | Category name               | All     |

### Categories

Commits are automatically categorized based on prefixes:

- **Feature**: `feat:`, `feat/`, `feat(`
- **Bug**: `fix:`, `fix/`, `fix(`, `bugfix:`
- **Refactor**: `refactor:`, `refactor/`, `refactor(`
- **Test**: `test:`, `test/`, `test(`
- **Chore**: `chore:`, `chore/`, `chore(`
- **Documentation**: `docs:`, `docs/`, `docs(`, `documentation:`
- **CI**: `ci:`, `ci/`, `ci(`
- **Other**: Commits not matching any pattern

Merge commits are automatically excluded. Jira-formatted commits (such as
`Resolve TICKET-123 "message"`) are handled by extracting the actual message for
categorization.

## Configuration

Configuration is stored at `~/.config/devrec/config.json`.

### Schema

```json
{
  "authorEmails": ["your-email@example.com"],
  "branchStrategy": "all",
  "groupBy": "repo",
  "locale": "en-US",
  "mainBranch": "main",
  "repos": [
    {
      "name": "my-project",
      "path": "/Users/you/projects/my-project"
    }
  ],
  "sprintLength": 2
}
```

### Fields

| Field            | Type                     | Description                                            | Default   |
| ---------------- | ------------------------ | ------------------------------------------------------ | --------- |
| `authorEmails`   | `string[]`               | Git email addresses to filter commits                  | Required  |
| `repos`          | `Repo[]`                 | Repositories to scan                                   | Required  |
| `sprintLength`   | `number`                 | Sprint duration in weeks                               | `2`       |
| `groupBy`        | `"repo"` \| `"category"` | How to group output                                    | `"repo"`  |
| `locale`         | `string`                 | Date formatting locale (for example, `en-US`, `it-IT`) | `"en-US"` |
| `mainBranch`     | `string`                 | Main branch name for merge tracking                    | `"main"`  |
| `branchStrategy` | `"all"` \| `"remote"`    | Which branches to scan                                 | `"all"`   |

### Repo schema

```json
{
  "mainBranch": "main",
  "name": "project-name",
  "path": "/absolute/path/to/repo"
}
```

The `mainBranch` field is optional and overrides the global `mainBranch` setting for
this specific repository.

### Branch strategy

- **`all`**: Scans all local and remote branches
- **`remote`**: Scans only remote branches (commits pushed to origin)

Use `remote` to exclude local work-in-progress commits.

## Examples

### Daily standup report

```bash
devrec today --format markdown --summary
```

**Output:**

```markdown
# Dev Log: February 17, 2026

## Summary

- **Total Commits**: 8
- **Merged to Main**: 5
- **In Progress**: 3
- **Repositories**: 2

---

## api

### Feature

- feat: add user authentication endpoint (8:30 AM)
- feat: implement rate limiting (9:15 AM)

### Bug

- fix: resolve login form validation (10:00 AM)

## web-app

### Feature

- feat: add dashboard analytics [feature/analytics] (11:00 AM)
```

### Sprint retrospective

```bash
devrec sprint --format markdown --summary > sprint-summary.md
```

This command generates a markdown file containing all commits from the current
sprint.

### Filter specific repository

```bash
devrec week --repo api
```

Shows only commits from the repository named "api" in your config.

### Filter by category

```bash
devrec week --repo api --category Feature
```

Shows only Feature commits from the "api" repository.

### View all commits

```bash
devrec all --summary
```

Shows all commits from all repositories with summary statistics.

## Troubleshooting

### Config not found

**Error:** `Config file not found`

**Solution:** Run `devrec init` to create configuration.

### Invalid repository path

**Error:** `Not a git repository`

**Solution:** Ensure the path in `config.json` points to a git repository root
(contains `.git/`).

### No commits found

**Possible causes:**

- Author email doesn't match git config
- No commits in date range
- Wrong branch strategy (try `"all"` instead of `"remote"`)

**Check your git email:**

```bash
git config user.email
```

Ensure this email matches one of the emails in your `authorEmails` array.

### Permission denied

**Error:** `No read permission`

**Solution:** Check file permissions on repository path:

```bash
ls -la /path/to/repo
```

### Colors not working

**Solution:** Force color mode:

```bash
devrec today --color always
```

### Slow performance with many repos

**Solutions:**

- Use `--repo` flag to filter to specific repositories
- Use `branchStrategy: "remote"` in config to scan fewer branches
- Reduce date range with specific commands (today versus all)

## Acknowledgments

Built with:

- [Commander.js](https://github.com/tj/commander.js) - CLI framework
- [simple-git](https://github.com/steveukx/git-js) - Git operations
- [Zod](https://github.com/colinhacks/zod) - Schema validation
- [Inquirer](https://github.com/SBoudrias/Inquirer.js) - Interactive prompts
- [Chalk](https://github.com/chalk/chalk) - Terminal colors
