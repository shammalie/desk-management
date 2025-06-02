# Desk Booking App

A side project exploring React Flow as an option for an interactive
floor planner and desk booking app.

## Development

To start development run the `dev` command:

```bash
npm run dev
```

### Code Quality Tools

This project uses several tools to maintain code quality and consistency:

#### Pre-commit Hooks

The project is configured with [Husky](https://typicode.github.io/husky/) to run pre-commit hooks that automatically:

- **Lint** - Runs ESLint with auto-fix for JavaScript/TypeScript files
- **Format** - Applies Prettier formatting to all supported files
- **Type Check** - Runs TypeScript compiler to check for type errors

These hooks run automatically when you commit changes. You can also run them manually:

```bash
# Run all pre-commit checks
pnpm exec lint-staged

# Run individual tools
pnpm run lint          # ESLint
pnpm run format        # Prettier formatting
pnpm run format:check  # Check if files are formatted
pnpm run type-check    # TypeScript type checking
```

#### Supported File Types

- **Linting & Formatting**: `.js`, `.jsx`, `.ts`, `.tsx`
- **Formatting Only**: `.json`, `.md`, `.css`, `.scss`, `.yaml`, `.yml`

## Features

### Teams Management

The teams page provides two views for managing and visualizing team hierarchies:

#### Data Table View

- **Team List**: Displays all teams in a searchable, sortable table
- **Team Details**: Shows team names, member counts, and hierarchy relationships
- **Quick Navigation**: Click on any team to highlight it in the hierarchy view

#### Hierarchy Flow View

- **Interactive Visualization**: Visual representation of team structure using ReactFlow
- **Dynamic Layout**: Automatically positions teams in a hierarchical tree layout with vertical alignment for direct reporting relationships
- **Team Highlighting**:
  - Select teams from the table to highlight their position in the hierarchy
  - Shows highlighted team plus all parent and child teams
  - Auto-centers viewport on selected teams
- **Visual States**:
  - **Pulsing border**: Highlighted teams from table selection
  - **Ring highlight**: Currently selected/clicked teams
  - **Straight edges**: Connections between highlighted teams and one-to-one parent-child relationships
  - **Curved edges**: Normal team connections with multiple children or parents

**Navigation**:

- Use the data table to search and filter teams
- Click teams to highlight their hierarchy path
- Drag and zoom the flow view for better navigation
- Clear filters to see the complete team structure

## UI

### Adding items

Once the app has loaded you'll be presented with a blank room. Enter
edit mode by clicking on the pen icon. When entering edit you should
see a dotted background and a new tray below the middle bar, these
contain the following options:

1. Snap to grid - locks objects to a 5x5 pixle grid.
2. Add Desk - drag desktop icon into room to create a new desk.
3. Add Wall - not implemented, creates new desk.
4. Add Room - will add a new room, 400x200 px size, can be resizable
   by clicking the dragable handles on the sides.
5. Discard changes - not implemented.
