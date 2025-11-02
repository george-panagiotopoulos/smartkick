#!/usr/bin/env python3
"""
Script to generate player sprites for multiple international teams.
Creates sprites with different jersey and sock colors for each team.
"""

from PIL import Image, ImageOps
import os
import sys

# Add parent directory to path for imports if needed
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def extract_sprite_sheet(spritesheet_path, rows=2, cols=3):
    """
    Extract individual sprites from a sprite sheet.
    Assumes a 2x3 grid layout (2 rows, 3 columns).
    """
    img = Image.open(spritesheet_path)
    # Ensure RGBA mode for transparency
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    width, height = img.size
    
    # Calculate dimensions of each sprite
    sprite_width = width // cols
    sprite_height = height // rows
    
    sprites = []
    
    # Extract each sprite
    for row in range(rows):
        for col in range(cols):
            left = col * sprite_width
            top = row * sprite_height
            right = left + sprite_width
            bottom = top + sprite_height
            
            sprite = img.crop((left, top, right, bottom))
            sprites.append(sprite)
    
    return sprites, sprite_width, sprite_height

def remove_background(img, bg_color=(138, 197, 228), tolerance=40):
    """
    Remove background color (typically blue) and make it transparent.
    """
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    data = img.getdata()
    new_data = []
    
    bg_r, bg_g, bg_b = bg_color
    
    for item in data:
        r, g, b, a = item
        
        # Calculate distance from background color
        distance = ((r - bg_r) ** 2 + (g - bg_g) ** 2 + (b - bg_b) ** 2) ** 0.5
        
        is_similar_blue = (
            abs(r - bg_r) < tolerance and
            abs(g - bg_g) < tolerance and
            abs(b - bg_b) < tolerance
        )
        
        is_light_blue_bg = (
            b > 180 and
            r > 100 and r < 180 and
            g > 150 and g < 220 and
            abs(b - r) > 40 and
            abs(b - g) > 20
        )
        
        if distance < tolerance or is_similar_blue or is_light_blue_bg:
            new_data.append((0, 0, 0, 0))
        else:
            new_data.append(item)
    
    img.putdata(new_data)
    return img

def extract_stances(stance_path):
    """
    Extract two stances from the Cartoon Soccer Team Stance image.
    Left side: defending, Right side: standing
    """
    img = Image.open(stance_path)
    
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    width, height = img.size
    
    # Split image in half
    sprite_width = width // 2
    
    defending = img.crop((0, 0, sprite_width, height))
    standing = img.crop((sprite_width, 0, width, height))
    
    defending = remove_background(defending, bg_color=(138, 197, 228), tolerance=40)
    standing = remove_background(standing, bg_color=(139, 198, 229), tolerance=40)
    
    return [defending, standing], sprite_width, height

def colorize_jersey_and_socks(img, jersey_color_rgb, sock_color_rgb, threshold=100):
    """
    Colorize jersey, pants, and socks. Pants match socks color.
    """
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    # Convert to RGB for HSV conversion
    rgb_img = Image.new('RGB', img.size, (255, 255, 255))
    rgb_img.paste(img, mask=img.split()[3])
    
    # Convert to HSV for better color detection
    hsv_img = rgb_img.convert('HSV')
    
    colored = Image.new('RGBA', img.size, (0, 0, 0, 0))
    pixels = img.load()
    hsv_pixels = hsv_img.load()
    colored_pixels = colored.load()
    
    width, height = img.size
    
    # Define vertical zones
    # Jersey zone: upper 25-65% of image (torso/chest area)
    jersey_top = int(height * 0.25)
    jersey_bottom = int(height * 0.62)
    
    # Pants zone: 62-90% of image (thighs/legs area) - expanded for better coverage
    pants_top = int(height * 0.62)
    pants_bottom = int(height * 0.90)
    
    # Socks zone: lower 10% of image (feet/ankles area)
    socks_top = int(height * 0.90)
    socks_bottom = height
    
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            h, s, v = hsv_pixels[x, y]
            
            if a > 0:
                variance = abs(r - g) + abs(g - b) + abs(r - b)
                brightness = (r + g + b) / 3
                
                in_jersey_zone = jersey_top <= y <= jersey_bottom
                in_pants_zone = pants_top <= y <= pants_bottom
                in_socks_zone = socks_top <= y <= socks_bottom
                
                should_color_jersey = False
                should_color_pants = False
                should_color_socks = False
                
                if in_jersey_zone:
                    # Jersey detection
                    is_skin = (0 <= h <= 40) and s > 40 and v > 100
                    is_hair = brightness < 60 or (s < 15 and brightness < 80)
                    is_feature = s > 150 and v < 150
                    
                    is_light_jersey = brightness > 180 and s < 50
                    is_colored_jersey = (
                        80 < brightness < 200 and
                        variance < threshold and
                        s < 120
                    )
                    
                    if (is_light_jersey or is_colored_jersey) and not is_skin and not is_hair and not is_feature:
                        should_color_jersey = True
                
                elif in_pants_zone:
                    # Pants detection - be very aggressive: colorize everything that's not skin/hair/shoes
                    is_skin = (0 <= h <= 40) and s > 40 and v > 100
                    is_hair = brightness < 60 or (s < 15 and brightness < 80)
                    is_shoe = brightness < 50  # Shoes are very dark
                    is_very_dark = brightness < 30
                    
                    # Colorize pants if it's not skin, hair, or shoes
                    # This is more aggressive and should catch all pants pixels
                    if not is_skin and not is_hair and not is_shoe and not is_very_dark:
                        # Additional check: exclude very bright areas that might be highlights/reflections
                        # but include most uniform areas
                        if brightness > 220 and variance > 50:
                            # Very bright with high variance might be highlights, skip
                            pass
                        else:
                            should_color_pants = True
                
                elif in_socks_zone:
                    # Socks detection
                    is_skin = (0 <= h <= 40) and s > 40 and v > 100
                    is_shoe = brightness < 50
                    is_very_dark = brightness < 30
                    
                    is_sock = (
                        50 < brightness < 180 and
                        variance < threshold and
                        not is_skin and
                        not is_shoe and
                        not is_very_dark
                    )
                    
                    if is_sock:
                        should_color_socks = True
                
                if should_color_jersey:
                    # Color jersey
                    blend_factor = 0.85
                    colored_pixels[x, y] = (
                        int(r * (1 - blend_factor) + jersey_color_rgb[0] * blend_factor),
                        int(g * (1 - blend_factor) + jersey_color_rgb[1] * blend_factor),
                        int(b * (1 - blend_factor) + jersey_color_rgb[2] * blend_factor),
                        a
                    )
                elif should_color_pants:
                    # Color pants (same color as socks) - use stronger blend for visibility
                    blend_factor = 0.85  # Stronger blend to ensure pants are visible
                    colored_pixels[x, y] = (
                        int(r * (1 - blend_factor) + sock_color_rgb[0] * blend_factor),
                        int(g * (1 - blend_factor) + sock_color_rgb[1] * blend_factor),
                        int(b * (1 - blend_factor) + sock_color_rgb[2] * blend_factor),
                        a
                    )
                elif should_color_socks:
                    # Color socks
                    blend_factor = 0.75
                    colored_pixels[x, y] = (
                        int(r * (1 - blend_factor) + sock_color_rgb[0] * blend_factor),
                        int(g * (1 - blend_factor) + sock_color_rgb[1] * blend_factor),
                        int(b * (1 - blend_factor) + sock_color_rgb[2] * blend_factor),
                        a
                    )
                else:
                    # Keep original
                    colored_pixels[x, y] = (r, g, b, a)
            else:
                colored_pixels[x, y] = (0, 0, 0, 0)
    
    return colored

def main():
    # Paths
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    assets_dir = os.path.join(base_dir, 'frontend', 'public', 'assets')
    spritesheet_path = os.path.join(assets_dir, 'Players-spriteSheet.png')
    stance_path = os.path.join(assets_dir, 'Cartoon Soccer Team Stance.png')
    output_dir = os.path.join(assets_dir, 'players')
    
    # Create output directory
    os.makedirs(output_dir, exist_ok=True)
    
    # Team definitions: (team_id, jersey_color_rgb, sock_color_rgb)
    teams = {
        'brazil': {
            'jersey': (255, 215, 0),      # Yellow
            'socks': (0, 156, 59)          # Green
        },
        'germany': {
            'jersey': (255, 140, 0),      # Orange
            'socks': (0, 0, 0)             # Black
        },
        'england': {
            'jersey': (255, 255, 255),    # White
            'socks': (220, 20, 60)         # Red
        },
        'spain': {
            'jersey': (255, 215, 0),      # Yellow
            'socks': (255, 140, 0)         # Orange
        },
        'greece': {
            'jersey': (0, 100, 200),      # Blue
            'socks': (255, 255, 255)       # White
        },
        'italy': {
            'jersey': (0, 100, 200),      # Blue
            'socks': (0, 156, 59)         # Green
        },
        'argentina': {
            'jersey': (135, 206, 250),    # Light blue
            'socks': (255, 255, 255)       # White
        },
        'france': {
            'jersey': (255, 255, 255),    # White
            'socks': (0, 100, 200)         # Blue
        },
        'netherlands': {
            'jersey': (255, 140, 0),      # Orange
            'socks': (255, 140, 0)         # Orange
        }
    }
    
    # Pose names from sprite sheet (2x3 grid)
    pose_names = [
        'passing', 'shooting', 'tackling',
        'dribbling', 'blocking', 'celebration'
    ]
    
    print("Extracting sprites from sprite sheet...")
    sprites, sprite_w, sprite_h = extract_sprite_sheet(spritesheet_path)
    print(f"Extracted {len(sprites)} sprites ({sprite_w}x{sprite_h} each)")
    
    print("\nExtracting stances...")
    stances, stance_w, stance_h = extract_stances(stance_path)
    stance_names = ['defending', 'standing']
    
    total_files = 0
    
    # Process each team
    for team_id, colors in teams.items():
        print(f"\nProcessing {team_id.upper()} team...")
        jersey_color = colors['jersey']
        sock_color = colors['socks']
        
        # Process sprite sheet poses
        for sprite, pose_name in zip(sprites, pose_names):
            colored_sprite = colorize_jersey_and_socks(
                sprite.copy(),
                jersey_color,
                sock_color
            )
            
            # Save sprite (facing right by default)
            output_path = os.path.join(output_dir, f'{team_id}_{pose_name}.png')
            colored_sprite.save(output_path, 'PNG')
            print(f"  Saved: {output_path}")
            total_files += 1
        
        # Process stances
        for stance, stance_name in zip(stances, stance_names):
            colored_stance = colorize_jersey_and_socks(
                stance.copy(),
                jersey_color,
                sock_color
            )
            
            output_path = os.path.join(output_dir, f'{team_id}_{stance_name}.png')
            colored_stance.save(output_path, 'PNG')
            print(f"  Saved: {output_path}")
            total_files += 1
    
    print(f"\n{'='*60}")
    print(f"All sprites processed and saved to: {output_dir}")
    print(f"Total files created: {total_files}")
    print(f"Teams created: {len(teams)}")
    print(f"Sprites per team: {len(pose_names) + len(stance_names)}")
    print(f"{'='*60}")

if __name__ == '__main__':
    main()

