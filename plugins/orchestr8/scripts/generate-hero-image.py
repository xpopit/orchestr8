#!/usr/bin/env python3
"""
Hero Image Generator for Medium Articles

Automatically generates professional hero images using AI image generation tools.
Supports DALL-E 3, Stable Diffusion (via Replicate), and fallback strategies.

Usage:
    python scripts/generate-hero-image.py --title "Article Title" --theme "main theme"
    python scripts/generate-hero-image.py --file medium/article.md
    python scripts/generate-hero-image.py --interactive

Requirements:
    pip install openai replicate Pillow requests pyyaml

Environment Variables:
    OPENAI_API_KEY - For DALL-E 3 generation
    REPLICATE_API_TOKEN - For Stable Diffusion generation
"""

import argparse
import os
import sys
import yaml
import re
from datetime import datetime
from pathlib import Path

try:
    import requests
    from PIL import Image
    from io import BytesIO
except ImportError:
    print("Error: Required packages not installed")
    print("Run: pip install Pillow requests pyyaml")
    sys.exit(1)


def get_mood_from_theme(theme):
    """Map article theme to visual mood"""
    theme_lower = theme.lower()

    mood_map = {
        "technical": "Professional, clean, modern, analytical",
        "programming": "Professional, clean, modern, technical",
        "productivity": "Energetic, focused, organized, efficient",
        "personal": "Inspirational, hopeful, uplifting, warm",
        "growth": "Inspirational, hopeful, uplifting, progressive",
        "business": "Professional, confident, sophisticated, authoritative",
        "data": "Analytical, precise, informative, structured",
        "creative": "Vibrant, imaginative, artistic, expressive",
        "ai": "Futuristic, intelligent, clean, cutting-edge",
        "automation": "Efficient, streamlined, modern, systematic"
    }

    for key, mood in mood_map.items():
        if key in theme_lower:
            return mood

    return "Professional, modern, engaging, clean"


def generate_with_dalle(title, theme, output_dir):
    """Generate hero image using DALL-E 3"""
    try:
        import openai
    except ImportError:
        print("Error: openai package not installed. Run: pip install openai")
        return None

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("Error: OPENAI_API_KEY environment variable not set")
        return None

    client = openai.OpenAI(api_key=api_key)
    mood = get_mood_from_theme(theme)

    prompt = f"""
    Create a professional hero image for a Medium article titled "{title}".

    Style requirements:
    - Clean, modern, minimalist aesthetic
    - Abstract or conceptual representation of: {theme}
    - Suitable for professional publication
    - Landscape orientation (16:9)
    - High contrast for readability at small sizes
    - No text or words in the image

    Visual style: Professional stock photography meets abstract art
    Color palette: Modern, not oversaturated
    Mood: {mood}
    """

    print(f"Generating image with DALL-E 3...")
    print(f"Theme: {theme}")
    print(f"Mood: {mood}")

    try:
        response = client.images.generate(
            model="dall-e-3",
            prompt=prompt.strip(),
            size="1792x1024",
            quality="standard",
            n=1
        )

        image_url = response.data[0].url
        print(f"Image generated successfully!")

        # Download image
        print("Downloading image...")
        image_data = requests.get(image_url).content
        image = Image.open(BytesIO(image_data))

        # Save image
        filepath = save_image(image, title, output_dir)
        print(f"✓ Image saved to: {filepath}")

        return filepath

    except Exception as e:
        print(f"Error generating image with DALL-E: {e}")
        return None


def generate_with_replicate(title, theme, output_dir):
    """Generate hero image using Stable Diffusion via Replicate"""
    try:
        import replicate
    except ImportError:
        print("Error: replicate package not installed. Run: pip install replicate")
        return None

    api_token = os.getenv("REPLICATE_API_TOKEN")
    if not api_token:
        print("Error: REPLICATE_API_TOKEN environment variable not set")
        return None

    mood = get_mood_from_theme(theme)

    prompt = f"""
    Professional hero image for article "{title}",
    theme: {theme},
    mood: {mood},
    style: minimal modern abstract photography,
    clean professional aesthetic,
    landscape 16:9,
    high quality,
    sharp focus,
    professional stock photo quality,
    no text, no words, no letters
    """

    negative_prompt = """
    text, words, letters, watermark, signature,
    low quality, blurry, distorted, ugly,
    cluttered, busy, chaotic, portrait orientation
    """

    print(f"Generating image with Stable Diffusion (Replicate)...")
    print(f"Theme: {theme}")
    print(f"Mood: {mood}")

    try:
        output = replicate.run(
            "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
            input={
                "prompt": prompt.strip(),
                "negative_prompt": negative_prompt.strip(),
                "width": 1920,
                "height": 1080,
                "num_outputs": 1,
                "guidance_scale": 7.5,
                "num_inference_steps": 50
            }
        )

        print("Image generated successfully!")

        # Download image
        print("Downloading image...")
        image_data = requests.get(output[0]).content
        image = Image.open(BytesIO(image_data))

        # Save image
        filepath = save_image(image, title, output_dir)
        print(f"✓ Image saved to: {filepath}")

        return filepath

    except Exception as e:
        print(f"Error generating image with Replicate: {e}")
        return None


def create_gradient_fallback(title, theme, output_dir):
    """Create a simple gradient as fallback"""
    print("Creating gradient fallback image...")

    # Theme-based color palettes
    color_palettes = {
        "technical": [(41, 128, 185), (142, 68, 173)],  # Blue to purple
        "productivity": [(26, 188, 156), (46, 204, 113)],  # Teal to green
        "personal": [(241, 196, 15), (230, 126, 34)],  # Yellow to orange
        "business": [(52, 73, 94), (44, 62, 80)],  # Dark blue gradient
        "creative": [(155, 89, 182), (52, 152, 219)],  # Purple to blue
        "data": [(41, 128, 185), (109, 213, 250)],  # Blue gradient
    }

    # Select color palette based on theme
    theme_lower = theme.lower()
    colors = None
    for key, palette in color_palettes.items():
        if key in theme_lower:
            colors = palette
            break

    if not colors:
        colors = [(52, 152, 219), (41, 128, 185)]  # Default blue

    width, height = 1920, 1080
    image = Image.new('RGB', (width, height))

    for y in range(height):
        ratio = y / height
        r = int(colors[0][0] * (1 - ratio) + colors[1][0] * ratio)
        g = int(colors[0][1] * (1 - ratio) + colors[1][1] * ratio)
        b = int(colors[0][2] * (1 - ratio) + colors[1][2] * ratio)

        for x in range(width):
            image.putpixel((x, y), (r, g, b))

    filepath = save_image(image, title, output_dir)
    print(f"✓ Gradient image saved to: {filepath}")

    return filepath


def save_image(image, title, output_dir):
    """Save image with proper naming and optimization"""
    os.makedirs(output_dir, exist_ok=True)

    # Create safe filename from title
    safe_title = re.sub(r'[^\w\s-]', '', title)
    safe_title = re.sub(r'[-\s]+', '-', safe_title).strip('-').lower()[:50]

    filename = f"{datetime.now().strftime('%Y-%m-%d')}-{safe_title}-hero.png"
    filepath = os.path.join(output_dir, filename)

    # Save with optimization
    image.save(filepath, "PNG", optimize=True, quality=95)

    return filepath


def extract_metadata_from_file(filepath):
    """Extract title and theme from Medium markdown file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Extract frontmatter
        if content.startswith('---'):
            parts = content.split('---', 2)
            if len(parts) >= 3:
                frontmatter = yaml.safe_load(parts[1])
                title = frontmatter.get('title', '')
                tags = frontmatter.get('tags', [])

                # Use first tag as theme if available
                theme = tags[0] if tags else ''

                # Try to extract theme from content
                if not theme:
                    # Look for topic mentions in first paragraph
                    body = parts[2].strip()
                    paragraphs = [p.strip() for p in body.split('\n\n') if p.strip()]
                    if paragraphs:
                        theme = paragraphs[0][:100]  # First 100 chars

                return title, theme

        return None, None

    except Exception as e:
        print(f"Error reading file: {e}")
        return None, None


def update_markdown_frontmatter(filepath, image_path):
    """Update markdown file frontmatter with generated image path"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        if not content.startswith('---'):
            print("Warning: File doesn't have frontmatter, cannot update")
            return False

        parts = content.split('---', 2)
        if len(parts) < 3:
            return False

        frontmatter = yaml.safe_load(parts[1])

        # Update hero_image field
        frontmatter['hero_image'] = image_path

        # Write back
        new_frontmatter = yaml.dump(frontmatter, default_flow_style=False, allow_unicode=True)
        new_content = f"---\n{new_frontmatter}---{parts[2]}"

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)

        print(f"✓ Updated frontmatter in {filepath}")
        return True

    except Exception as e:
        print(f"Error updating frontmatter: {e}")
        return False


def interactive_mode():
    """Interactive mode for generating hero images"""
    print("\n=== Hero Image Generator (Interactive Mode) ===\n")

    title = input("Article title: ").strip()
    if not title:
        print("Error: Title is required")
        return

    theme = input("Article theme/topic: ").strip()
    if not theme:
        print("Error: Theme is required")
        return

    output_dir = input("Output directory [medium/images]: ").strip()
    if not output_dir:
        output_dir = "medium/images"

    print("\nGeneration method:")
    print("  1. DALL-E 3 (requires OPENAI_API_KEY)")
    print("  2. Stable Diffusion via Replicate (requires REPLICATE_API_TOKEN)")
    print("  3. Gradient fallback (free, no API required)")

    choice = input("\nSelect method [1/2/3]: ").strip()

    if choice == "1":
        filepath = generate_with_dalle(title, theme, output_dir)
    elif choice == "2":
        filepath = generate_with_replicate(title, theme, output_dir)
    elif choice == "3":
        filepath = create_gradient_fallback(title, theme, output_dir)
    else:
        print("Invalid choice")
        return

    if filepath:
        print(f"\n✓ Success! Image generated: {filepath}")

        update = input("\nUpdate markdown file frontmatter? [y/N]: ").strip().lower()
        if update == 'y':
            md_file = input("Path to markdown file: ").strip()
            if md_file and os.path.exists(md_file):
                update_markdown_frontmatter(md_file, filepath)


def main():
    parser = argparse.ArgumentParser(
        description="Generate hero images for Medium articles",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Generate from title and theme
  python generate-hero-image.py --title "My Article" --theme "productivity"

  # Generate from existing markdown file
  python generate-hero-image.py --file medium/2025-11-11-article.md

  # Interactive mode
  python generate-hero-image.py --interactive

  # Specify method
  python generate-hero-image.py --title "My Article" --theme "tech" --method dalle
        """
    )

    parser.add_argument('--title', help='Article title')
    parser.add_argument('--theme', help='Article theme/topic')
    parser.add_argument('--file', help='Path to markdown file (extracts title/theme)')
    parser.add_argument('--output', default='medium/images', help='Output directory')
    parser.add_argument('--method', choices=['dalle', 'replicate', 'gradient', 'auto'],
                       default='auto', help='Generation method')
    parser.add_argument('--interactive', action='store_true', help='Interactive mode')
    parser.add_argument('--update', action='store_true',
                       help='Update markdown frontmatter with image path')

    args = parser.parse_args()

    if args.interactive:
        interactive_mode()
        return

    # Extract metadata from file if provided
    if args.file:
        if not os.path.exists(args.file):
            print(f"Error: File not found: {args.file}")
            sys.exit(1)

        title, theme = extract_metadata_from_file(args.file)
        if not title:
            print("Error: Could not extract title from file")
            sys.exit(1)

        print(f"Extracted from file:")
        print(f"  Title: {title}")
        print(f"  Theme: {theme}")
        print()
    else:
        title = args.title
        theme = args.theme

    if not title or not theme:
        print("Error: Both --title and --theme are required (or use --file or --interactive)")
        parser.print_help()
        sys.exit(1)

    # Determine generation method
    method = args.method
    if method == 'auto':
        if os.getenv('OPENAI_API_KEY'):
            method = 'dalle'
        elif os.getenv('REPLICATE_API_TOKEN'):
            method = 'replicate'
        else:
            method = 'gradient'
            print("No API keys found, using gradient fallback")

    # Generate image
    filepath = None
    if method == 'dalle':
        filepath = generate_with_dalle(title, theme, args.output)
    elif method == 'replicate':
        filepath = generate_with_replicate(title, theme, args.output)
    elif method == 'gradient':
        filepath = create_gradient_fallback(title, theme, args.output)

    if not filepath:
        print("\nError: Image generation failed")
        sys.exit(1)

    print(f"\n✓ Success! Image generated: {filepath}")

    # Update markdown file if requested
    if args.update and args.file:
        update_markdown_frontmatter(args.file, filepath)


if __name__ == '__main__':
    main()
