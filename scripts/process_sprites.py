#!/usr/bin/env python3
"""
Script to extract sprites from sprite sheets and color them for teams.
"""

from PIL import Image, ImageEnhance, ImageColor, ImageOps
import os
import sys

# Add parent directory to path for imports if needed
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def extract_sprite_sheet(spritesheet_path, output_dir, rows=2, cols=3):
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
    Uses exact color matching with tolerance for variations.
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
        
        # Also check if it's a similar light blue/sky blue color
        # This background is light sky blue: high blue, medium red/green
        is_similar_blue = (
            abs(r - bg_r) < tolerance and
            abs(g - bg_g) < tolerance and
            abs(b - bg_b) < tolerance
        )
        
        # Additional check: light blue pixels (blue is dominant, high brightness)
        is_light_blue_bg = (
            b > 180 and  # High blue component
            r > 100 and r < 180 and  # Medium red
            g > 150 and g < 220 and  # Medium-high green
            abs(b - r) > 40 and  # Blue significantly higher than red
            abs(b - g) > 20  # Blue higher than green
        )
        
        # If pixel matches background color, make it transparent
        if distance < tolerance or is_similar_blue or is_light_blue_bg:
            new_data.append((0, 0, 0, 0))  # Fully transparent
        else:
            new_data.append(item)
    
    img.putdata(new_data)
    return img

def extract_stances(stance_path, output_dir):
    """
    Extract two stances from the Cartoon Soccer Team Stance image.
    Left side: defending, Right side: standing
    """
    img = Image.open(stance_path)
    
    # Convert to RGBA if not already
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    width, height = img.size
    
    # Split image in half
    sprite_width = width // 2
    
    defending = img.crop((0, 0, sprite_width, height))
    standing = img.crop((sprite_width, 0, width, height))
    
    # Remove blue backgrounds - using the exact color found in the image
    # The actual background color is RGB(138, 197, 228) - light sky blue
    defending = remove_background(defending, bg_color=(138, 197, 228), tolerance=40)
    standing = remove_background(standing, bg_color=(139, 198, 229), tolerance=40)
    
    return [defending, standing], sprite_width, height

def colorize_jersey(img, color_rgb):
    """
    Colorize the jersey area of a player sprite.
    This is a simplified approach - we'll enhance blue/red areas.
    """
    # Convert to RGBA if not already
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    # Create a new image with the same size
    colored = Image.new('RGBA', img.size, (0, 0, 0, 0))
    
    # Get pixel data
    pixels = img.load()
    colored_pixels = colored.load()
    
    # Process each pixel
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = pixels[x, y]
            
            # If pixel is not transparent
            if a > 0:
                # Check if pixel is in jersey area (rough heuristic)
                # Look for pixels that are not too dark (skin/features) and not white
                # This is a simplified approach - in production you'd use a mask
                if r < 200 and g < 200 and b < 200 and (r + g + b) > 100:
                    # This might be jersey area - blend with team color
                    # More sophisticated: use color detection or mask
                    colored_pixels[x, y] = (
                        int(r * 0.3 + color_rgb[0] * 0.7),
                        int(g * 0.3 + color_rgb[1] * 0.7),
                        int(b * 0.3 + color_rgb[2] * 0.7),
                        a
                    )
                else:
                    # Keep original pixel
                    colored_pixels[x, y] = (r, g, b, a)
            else:
                colored_pixels[x, y] = (0, 0, 0, 0)
    
    return colored

def colorize_jersey_simple(img, color_rgb):
    """
    Simpler colorization: enhance existing blue/red tones in the image.
    """
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    # Create a tinted version
    # Create a color overlay
    overlay = Image.new('RGBA', img.size, (*color_rgb, 128))
    
    # Blend with original
    colored = Image.blend(img, overlay, 0.3)
    
    # More sophisticated: use image enhancement
    enhancer = ImageEnhance.Color(img)
    colored = enhancer.enhance(1.5)
    
    return colored

def colorize_jersey_mask(img, color_rgb, threshold=100):
    """
    Colorize ONLY the jersey/t-shirt and socks using color replacement.
    Detects jersey and sock areas by looking for typical jersey colors (white, light colors, uniform areas).
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
    jersey_bottom = int(height * 0.65)
    
    # Socks zone: lower 12% of image (feet/ankles area)
    socks_top = int(height * 0.88)
    socks_bottom = height
    
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            h, s, v = hsv_pixels[x, y]
            
            if a > 0:
                variance = abs(r - g) + abs(g - b) + abs(r - b)
                brightness = (r + g + b) / 3
                
                in_jersey_zone = jersey_top <= y <= jersey_bottom
                in_socks_zone = socks_top <= y <= socks_bottom
                
                should_color = False
                
                if in_jersey_zone:
                    # Jersey detection strategy:
                    # 1. Look for white/light colors (typical jersey base)
                    # 2. Look for uniform colored areas (not skin, not hair)
                    # 3. Exclude skin tones (orange/pink: h 0-40)
                    # 4. Exclude very dark (hair) and very saturated colors (features)
                    
                    is_skin = (0 <= h <= 40) and s > 40 and v > 100
                    is_hair = brightness < 60 or (s < 15 and brightness < 80)
                    is_very_light = brightness > 220  # Might be white jersey, but we'll color it
                    is_feature = s > 150 and v < 150  # Highly saturated colors (logos, etc.)
                    
                    # Jersey pixels are typically:
                    # - Light colored (white/light jerseys) OR
                    # - Uniform mid-brightness colors (colored jerseys)
                    # - Not skin, not hair, not highly saturated features
                    is_light_jersey = brightness > 180 and s < 50  # White/light jersey
                    is_colored_jersey = (
                        80 < brightness < 200 and
                        variance < threshold and
                        s < 120  # Not too saturated
                    )
                    
                    if (is_light_jersey or is_colored_jersey) and not is_skin and not is_hair and not is_feature:
                        should_color = True
                
                elif in_socks_zone:
                    # Socks detection:
                    # - Typically darker uniform areas
                    # - Not skin (feet)
                    # - Not shoes (very dark)
                    is_skin = (0 <= h <= 40) and s > 40 and v > 100
                    is_shoe = brightness < 50
                    is_very_dark = brightness < 30
                    
                    # Socks are usually mid-dark, somewhat uniform
                    is_sock = (
                        50 < brightness < 180 and
                        variance < threshold and
                        not is_skin and
                        not is_shoe and
                        not is_very_dark
                    )
                    
                    if is_sock:
                        should_color = True
                
                if should_color:
                    # Strong color replacement for jerseys, moderate for socks
                    if in_jersey_zone:
                        blend_factor = 0.85  # Strong replacement for jersey
                    else:
                        blend_factor = 0.70  # Moderate for socks
                    
                    colored_pixels[x, y] = (
                        int(r * (1 - blend_factor) + color_rgb[0] * blend_factor),
                        int(g * (1 - blend_factor) + color_rgb[1] * blend_factor),
                        int(b * (1 - blend_factor) + color_rgb[2] * blend_factor),
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
    
    # Team colors
    blue_team = (30, 100, 200)  # Blue jersey
    red_team = (200, 30, 30)    # Red jersey
    
    # Pose names from sprite sheet (2x3 grid)
    # Top row: passing, shooting, tackling
    # Bottom row: dribbling, blocking shot, celebration
    pose_names = [
        'passing', 'shooting', 'tackling',
        'dribbling', 'blocking', 'celebration'
    ]
    
    print("Extracting sprites from sprite sheet...")
    sprites, sprite_w, sprite_h = extract_sprite_sheet(spritesheet_path, output_dir)
    
    print(f"Extracted {len(sprites)} sprites ({sprite_w}x{sprite_h} each)")
    
    # Process each sprite for both teams
    for i, (sprite, pose_name) in enumerate(zip(sprites, pose_names)):
        # Blue team - faces right (default orientation)
        blue_sprite = colorize_jersey_mask(sprite.copy(), blue_team)
        blue_path = os.path.join(output_dir, f'blue_{pose_name}.png')
        blue_sprite.save(blue_path, 'PNG')
        print(f"Saved: {blue_path}")
        
        # Red team - faces left (flip horizontally)
        red_sprite = colorize_jersey_mask(sprite.copy(), red_team)
        red_sprite = ImageOps.mirror(red_sprite)  # Flip horizontally to face left
        red_path = os.path.join(output_dir, f'red_{pose_name}.png')
        red_sprite.save(red_path, 'PNG')
        print(f"Saved: {red_path}")
    
    # Extract stances
    print("\nExtracting stances...")
    stances, stance_w, stance_h = extract_stances(stance_path, output_dir)
    stance_names = ['defending', 'standing']
    
    for stance, stance_name in zip(stances, stance_names):
        # Blue team - faces right (default orientation)
        blue_stance = colorize_jersey_mask(stance.copy(), blue_team)
        blue_path = os.path.join(output_dir, f'blue_{stance_name}.png')
        blue_stance.save(blue_path, 'PNG')
        print(f"Saved: {blue_path}")
        
        # Red team - faces left (flip horizontally)
        red_stance = colorize_jersey_mask(stance.copy(), red_team)
        red_stance = ImageOps.mirror(red_stance)  # Flip horizontally to face left
        red_path = os.path.join(output_dir, f'red_{stance_name}.png')
        red_stance.save(red_path, 'PNG')
        print(f"Saved: {red_path}")
    
    print(f"\nAll sprites processed and saved to: {output_dir}")
    print(f"Total files created: {len(sprites) * 2 + len(stances) * 2}")

if __name__ == '__main__':
    main()

