# Graphics Assets

Place your 2D graphics assets in this directory.

## Required Assets

### Players
- **Player Team**: 4 outfield players + 1 goalkeeper
  - Suggested filenames: `player_1.png`, `player_2.png`, `player_3.png`, `player_4.png`, `player_gk.png`
  
- **Opponent Team**: 4 outfield players + 1 goalkeeper
  - Suggested filenames: `opponent_1.png`, `opponent_2.png`, `opponent_3.png`, `opponent_4.png`, `opponent_gk.png`

### Ball
- Football/soccer ball sprite
  - Suggested filename: `ball.png`

### Pitch
- Football field background
  - Suggested filename: `pitch.png` or `field.png`

### UI Elements (Optional)
- Buttons, icons, scoreboard elements
  - Place in subdirectories if needed: `ui/buttons/`, `ui/icons/`, etc.

## Asset Specifications

- **Format**: PNG with transparency (or SVG)
- **Resolution**: High resolution for crisp display on all devices
- **Style**: Kid-friendly, colorful, cartoon-like
- **Animation**: Sprite sheets can be used for animations (optional)

## Notes

- Assets will be referenced from `frontend/public/assets/` in the Vue components
- Use relative paths: `/assets/filename.png` in Vue templates
- Consider creating sprite sheets for animations if needed

