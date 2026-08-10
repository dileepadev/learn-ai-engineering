# Branch Naming Guidelines

When creating a new branch, please follow this naming convention to maintain consistency and clarity in communication regarding the nature of changes.

## Long-lived Branches

| Branch Name | Description                                                                            |
| ----------- | -------------------------------------------------------------------------------------- |
| `main`      | The stable, current version of the roadmap.                                            |
| `dev`       | The development branch containing features and bug fixes not yet ready for production. |

**The repository owner commits directly to `main`.** This is a solo learning repository, and
the overhead of a branch and a pull request for every change is not worth paying here.

**Outside contributors should not.** Fork the repository and open a pull request instead — see
[CONTRIBUTING.md](CONTRIBUTING.md) for the full flow. The naming conventions below apply to
those branches, and to any branch the owner chooses to create for a larger change.

## Contributing Branches

Follow these naming conventions when creating a new branch:

| Branch Name  | Description                                                                                            |
| ------------ | ------------------------------------------------------------------------------------------------------ |
| `feat/x`     | A branch for adding new features or enhancing functionality. Replace `x` with a short description.     |
| `fix/x`      | A branch for fixing bugs. Replace `x` with a description of the issue being addressed.                 |
| `docs/x`     | A branch for documentation updates. Replace `x` with a description of the documentation being updated. |
| `style/x`    | A branch for code style changes (formatting, spacing, etc.). Replace `x` with the style change.        |
| `refactor/x` | A branch for code refactoring that doesn’t change functionality. Replace `x` with a description.       |
| `perf/x`     | A branch for performance improvements. Replace `x` with the specific performance enhancement.          |
| `test/x`     | A branch for adding or modifying tests. Replace `x` with the test being added or modified.             |
| `chore/x`    | A branch for routine tasks or maintenance (e.g., upgrading dependencies). Replace `x` with the task.   |

## Examples

Here are a few examples of valid branch names:

- `feat/user-auth` - Add user authentication feature.
- `fix/login` - Bug fix for the login functionality.
- `docs/readme` - Update to the README documentation.
- `style/formatting` - Code style formatting changes.
- `refactor/database` - Refactor the database connection handling.
- `test/authentication` - Tests for the authentication service.
- `chore/dependencies` - Update dependencies.
