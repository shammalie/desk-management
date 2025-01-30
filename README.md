# Desk Booking App

A side project exploring React Flow as an option for an interactive
floor planner and desk booking app.

## Development

To start development run the `dev` command:

```bash
npm run dev
```

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
