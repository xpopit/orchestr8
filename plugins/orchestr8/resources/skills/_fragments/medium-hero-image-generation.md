---
id: medium-hero-image-generation
category: skill
tags: [medium, hero-image, image-generation, ai-art, visual-content, automation, dall-e, midjourney, stable-diffusion]
capabilities:
  - Generate hero images for Medium articles using AI image generation tools
  - Create text-based prompts optimized for Medium's visual standards
  - Design abstract, minimal, and conceptual imagery matching article themes
  - Ensure proper image dimensions and quality (1400px+ width)
  - Provide fallback strategies when AI generation unavailable
useWhen:
  - Creating Medium articles requiring custom hero images with abstract/minimal aesthetic
  - Automating hero image creation for content publishing workflows
  - Need professional-looking visuals without stock photo licensing concerns
  - Generating thematic imagery matching article tone and content
  - Building consistent visual branding across Medium publication
estimatedTokens: 850
---

# Medium Hero Image Generation

Automatically generate professional hero images for Medium articles using AI image generation tools and best practices.

## Overview

Hero images are critical for Medium articles - they appear in feeds, search results, and at the top of your story. A compelling hero image increases click-through rates by 40-60%.

This skill covers:
1. **AI Image Generation**: Using DALL-E, Stable Diffusion, or Midjourney
2. **Prompt Engineering**: Crafting prompts that produce Medium-optimized visuals
3. **Fallback Strategies**: Alternative approaches when AI unavailable
4. **Technical Requirements**: Sizing, format, and quality standards

## Medium Hero Image Requirements

### Technical Specifications
- **Minimum width**: 1400px (1920px recommended for retina displays)
- **Aspect ratio**: 2:1 or 16:9 (landscape preferred)
- **File format**: JPEG or PNG (WebP for modern browsers)
- **File size**: Under 5MB (2-3MB ideal for loading speed)
- **Resolution**: 72-150 DPI for web

### Design Principles
- ✅ **Simple and clean**: Avoid clutter, focus on one concept
- ✅ **Abstract or conceptual**: Visual metaphor over literal representation
- ✅ **Professional**: High-quality, polished aesthetic
- ✅ **Readable thumbnails**: Looks good at small sizes
- ✅ **On-brand**: Matches article tone (technical, personal, inspirational)

### Common Hero Image Styles for Different Topics

| Article Type | Visual Style | Example Concepts |
|-------------|--------------|------------------|
| Technical/Dev | Minimal, geometric, code-inspired | Abstract data flows, geometric patterns, clean interfaces |
| Personal Growth | Inspirational, human-centric | Sunrise/paths, silhouettes, journey metaphors |
| Business/Career | Professional, modern | Office aesthetics, growth charts, collaboration |
| Creative/Design | Artistic, vibrant | Color gradients, creative tools, abstract art |
| Data/Analytics | Data visualization, clean | Charts, graphs, data patterns, infographics |

## AI Image Generation Tools

### Option 1: DALL-E 3 (OpenAI API)

**Pros**:
- Highest quality, photorealistic or artistic
- Best text understanding and prompt following
- Direct API integration possible
- Generates 1024x1024 or 1792x1024 (good for hero images)

**Cons**:
- Requires OpenAI API key
- Cost: ~$0.04-0.08 per image
- Content policy restrictions

**Implementation**:
```python
import openai
import os
from datetime import datetime

def generate_hero_image_dalle(article_title, article_theme, output_dir="medium/images"):
    """
    Generate hero image using DALL-E 3
    
    Args:
        article_title: Title of the Medium article
        article_theme: Main theme/concept (e.g., "AI automation", "productivity")
        output_dir: Directory to save generated image
    
    Returns:
        Path to generated image file
    """
    client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    
    # Craft optimized prompt
    prompt = f"""
    Create a professional hero image for a Medium article titled "{article_title}".
    
    Style requirements:
    - Clean, modern, minimalist aesthetic
    - Abstract or conceptual representation of: {article_theme}
    - Suitable for professional publication
    - Landscape orientation (16:9)
    - High contrast for readability at small sizes
    - No text or words in the image
    
    Visual style: Professional stock photography meets abstract art
    Color palette: Modern, not oversaturated
    Mood: {get_mood_from_theme(article_theme)}
    """
    
    try:
        response = client.images.generate(
            model="dall-e-3",
            prompt=prompt,
            size="1792x1024",  # Good for hero images
            quality="standard",  # or "hd" for $0.08
            n=1
        )
        
        image_url = response.data[0].url
        
        # Download and save image
        import requests
        from PIL import Image
        from io import BytesIO
        
        image_data = requests.get(image_url).content
        image = Image.open(BytesIO(image_data))
        
        # Ensure output directory exists
        os.makedirs(output_dir, exist_ok=True)
        
        # Generate filename from article title
        safe_title = "".join(c if c.isalnum() or c in (' ', '-') else '' for c in article_title)
        safe_title = safe_title.replace(' ', '-').lower()[:50]
        filename = f"{datetime.now().strftime('%Y-%m-%d')}-{safe_title}-hero.png"
        filepath = os.path.join(output_dir, filename)
        
        # Save image
        image.save(filepath, "PNG", optimize=True, quality=95)
        
        return filepath
        
    except Exception as e:
        print(f"Error generating image with DALL-E: {e}")
        return None

def get_mood_from_theme(theme):
    """Map article theme to visual mood"""
    mood_map = {
        "technical": "Professional, clean, modern",
        "productivity": "Energetic, focused, organized",
        "personal-growth": "Inspirational, hopeful, uplifting",
        "business": "Professional, confident, sophisticated",
        "data": "Analytical, precise, informative",
        "creative": "Vibrant, imaginative, artistic"
    }
    
    for key, mood in mood_map.items():
        if key in theme.lower():
            return mood
    
    return "Professional, modern, engaging"
```

### Option 2: Stable Diffusion (Local or API)

**Pros**:
- Free if run locally
- Highly customizable with models and LoRAs
- No content restrictions
- Fast generation

**Cons**:
- Requires GPU for local generation
- More complex prompt engineering
- Quality varies by model

**Implementation using Replicate API**:
```python
import replicate
import os

def generate_hero_image_sd(article_title, article_theme, output_dir="medium/images"):
    """
    Generate hero image using Stable Diffusion via Replicate
    
    Cost: ~$0.002-0.005 per image (much cheaper than DALL-E)
    """
    
    prompt = f"""
    Professional hero image for article "{article_title}", 
    theme: {article_theme}, 
    style: minimal modern abstract photography, 
    clean professional aesthetic, 
    no text, 
    landscape 16:9, 
    high quality, 
    sharp focus, 
    professional stock photo quality
    """
    
    negative_prompt = """
    text, words, letters, watermark, signature, 
    low quality, blurry, distorted, ugly, 
    cluttered, busy, chaotic
    """
    
    try:
        output = replicate.run(
            "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
            input={
                "prompt": prompt,
                "negative_prompt": negative_prompt,
                "width": 1920,
                "height": 1080,
                "num_outputs": 1,
                "guidance_scale": 7.5,
                "num_inference_steps": 50
            }
        )
        
        # Download and save
        import requests
        from PIL import Image
        from io import BytesIO
        
        image_data = requests.get(output[0]).content
        image = Image.open(BytesIO(image_data))
        
        os.makedirs(output_dir, exist_ok=True)
        
        safe_title = "".join(c if c.isalnum() or c in (' ', '-') else '' for c in article_title)
        safe_title = safe_title.replace(' ', '-').lower()[:50]
        filename = f"{datetime.now().strftime('%Y-%m-%d')}-{safe_title}-hero.png"
        filepath = os.path.join(output_dir, filename)
        
        image.save(filepath, "PNG", optimize=True, quality=95)
        
        return filepath
        
    except Exception as e:
        print(f"Error generating image with Stable Diffusion: {e}")
        return None
```

### Option 3: Midjourney (Manual with Prompt Templates)

**Pros**:
- Highest artistic quality
- Excellent for abstract/conceptual imagery
- Great community and resources

**Cons**:
- No official API (requires manual generation or unofficial APIs)
- Subscription required ($10-60/month)
- Slower turnaround (not fully automated)

**Workflow**:
1. Generate prompt using templates below
2. Submit to Midjourney Discord bot
3. Download highest quality version
4. Save to `medium/images/` directory

**Prompt Template**:
```
/imagine prompt: [article theme as visual concept], 
professional minimal abstract photography, 
clean modern aesthetic, 
[specific visual elements], 
landscape 16:9, 
professional stock photo quality, 
high detail, 
sharp focus, 
[color palette], 
no text --ar 16:9 --v 6 --stylize 500
```

**Example**:
```
/imagine prompt: just-in-time loading and dynamic resource matching visualized as flowing data streams, 
professional minimal abstract photography, 
clean modern aesthetic, 
abstract geometric networks, flowing light paths, minimal nodes, 
landscape 16:9, 
professional stock photo quality, 
high detail, 
sharp focus, 
blue and white color palette with accents, 
no text --ar 16:9 --v 6 --stylize 500
```

## Prompt Engineering Best Practices

### Anatomy of a Great Hero Image Prompt

```
[Core Concept] + [Visual Style] + [Technical Requirements] + [Mood/Aesthetic] + [Negative Constraints]
```

**Core Concept** (What to visualize):
- Transform abstract ideas into visual metaphors
- Example: "AI memory management" → "flowing data streams with selective filtering"
- Example: "Productivity" → "organized geometric pathways leading upward"

**Visual Style** (How it should look):
- "minimal modern abstract photography"
- "professional stock photo aesthetic"
- "clean geometric illustration"
- "cinematic lighting"

**Technical Requirements**:
- "landscape 16:9 aspect ratio"
- "high resolution, sharp focus"
- "suitable for thumbnails"
- "no text or typography"

**Mood/Aesthetic**:
- Professional: "clean, sophisticated, modern"
- Inspirational: "uplifting, hopeful, bright"
- Technical: "precise, analytical, structured"
- Creative: "vibrant, imaginative, dynamic"

**Negative Constraints** (What to avoid):
- "no text, no words, no letters"
- "not cluttered, not busy"
- "no watermarks, no signatures"
- "not low quality, not blurry"

### Example Prompts by Article Theme

**Technical/Developer Article**:
```
Abstract visualization of modular code architecture, 
clean geometric shapes representing interconnected systems, 
professional minimal style, 
dark background with glowing blue connections, 
sharp focus, 
landscape 16:9, 
modern tech aesthetic, 
no text
```

**Personal Growth Article**:
```
Minimalist path or stairway leading upward into light, 
clean professional photography, 
inspirational mood, 
soft lighting, 
muted color palette with warm tones, 
landscape 16:9, 
sharp focus, 
no text
```

**Productivity Article**:
```
Organized abstract workspace with geometric elements, 
clean minimal design, 
professional aesthetic, 
focused lighting highlighting key areas, 
blue and white color scheme, 
landscape 16:9, 
high quality, 
no text
```

**Data/Analytics Article**:
```
Abstract data visualization with flowing information streams, 
minimal modern style, 
clean geometric patterns, 
professional stock photo quality, 
blue gradient background, 
sharp focus, 
landscape 16:9, 
no text
```

## Fallback Strategies

### When AI Generation Unavailable

**Option 1: Curated Stock Photos**
- **Unsplash**: Free, high-quality, commercial-use allowed
- **Pexels**: Similar to Unsplash, large collection
- **Pixabay**: Free stock with generous license

Search strategies:
- Use abstract keywords: "abstract blue technology", "minimal workspace"
- Filter for landscape orientation, high resolution
- Look for images with negative space for Medium's text overlay

**Option 2: Simple Gradient Backgrounds**
```python
from PIL import Image, ImageDraw

def create_gradient_hero(width=1920, height=1080, color1=(41, 128, 185), color2=(109, 213, 250)):
    """
    Create a simple gradient background as hero image
    """
    image = Image.new('RGB', (width, height), color1)
    draw = ImageDraw.Draw(image)
    
    for y in range(height):
        ratio = y / height
        r = int(color1[0] * (1 - ratio) + color2[0] * ratio)
        g = int(color1[1] * (1 - ratio) + color2[1] * ratio)
        b = int(color1[2] * (1 - ratio) + color2[2] * ratio)
        draw.line([(0, y), (width, y)], fill=(r, g, b))
    
    return image
```

**Option 3: Geometric Patterns**
- Use tools like Canva (free tier) with geometric templates
- Create simple shapes/patterns in Figma
- Use CSS art generators and screenshot

## Integration with Medium Workflow

### Automatic Generation During Story Creation

Add to Phase 4 of Medium story workflow:

```markdown
### 4.5. Generate Hero Image

**→ Load:** orchestr8://skills/medium-hero-image-generation

**Activities:**
- Extract article theme and tone from content
- Generate optimized prompt for AI image generation
- Create hero image using available tool (DALL-E, SD, or Midjourney)
- Save image to `medium/images/[article-slug]-hero.png`
- Update frontmatter with image path
- Add alt text for accessibility

**Image generation command**:
```python
# Automatically detect best available tool
if os.getenv("OPENAI_API_KEY"):
    image_path = generate_hero_image_dalle(title, theme)
elif os.getenv("REPLICATE_API_TOKEN"):
    image_path = generate_hero_image_sd(title, theme)
else:
    print("No AI image generation API available")
    print("Using fallback: Provide Unsplash search terms")
    image_path = "[Placeholder: Search Unsplash for '{theme} minimal']"
```

**Update frontmatter**:
```yaml
hero_image: "medium/images/2025-11-11-article-title-hero.png"
hero_image_alt: "Abstract visualization of [key concept from article]"
```
```

### Manual Trigger

For existing articles, provide standalone command:

```bash
# Generate hero image for specific article
python scripts/generate-hero-image.py \
  --title "Article Title" \
  --theme "main theme" \
  --output "medium/images/"
```

## Quality Checklist

Before using a generated hero image:
- ✅ Width ≥ 1400px (1920px recommended)
- ✅ Aspect ratio 16:9 or 2:1 (landscape)
- ✅ File size < 5MB (2-3MB ideal)
- ✅ No text, watermarks, or signatures
- ✅ Clean, professional aesthetic
- ✅ Readable as thumbnail (test at 200px wide)
- ✅ Matches article tone and content
- ✅ High contrast for text overlay (if Medium adds title)
- ✅ Alt text describes visual concept
- ✅ Saved with descriptive filename

## Cost Comparison

| Tool | Cost per Image | Quality | Automation | Setup Complexity |
|------|---------------|---------|------------|------------------|
| DALL-E 3 | $0.04-0.08 | Excellent | Full | Low |
| Stable Diffusion (Replicate) | $0.002-0.005 | Good-Very Good | Full | Low |
| Stable Diffusion (Local) | Free | Good-Very Good | Full | High |
| Midjourney | ~$0.30-0.50* | Excellent | Partial | Medium |
| Unsplash (Manual) | Free | Varies | Manual | None |
| Gradient/Geometric | Free | Basic | Full | None |

*Based on subscription cost divided by typical monthly usage

## Best Practices

1. **Match Visual to Content**: Technical articles need clean, modern aesthetics; personal stories need warmth and humanity

2. **Test Readability**: View at thumbnail size (200x200px) to ensure visual clarity

3. **Consistent Style**: Maintain visual consistency across articles for brand recognition

4. **Alt Text**: Always include descriptive alt text for accessibility

5. **Iterate**: Generate 2-3 options, choose best, refine prompt for future use

6. **Archive Prompts**: Save successful prompts for reuse and iteration

7. **Preview in Context**: Place image in Medium draft to see how it looks with title overlay

8. **Optimize File Size**: Use tools like TinyPNG or ImageOptim to reduce file size without quality loss

## Common Mistakes to Avoid

❌ **Too literal**: Don't just visualize keywords (e.g., "laptop" for tech article)
❌ **Too busy**: Complex images don't read well as thumbnails
❌ **Text in image**: Medium adds title overlay; text causes clutter
❌ **Wrong aspect ratio**: Portrait or square images don't work well
❌ **Low resolution**: Under 1400px looks pixelated on retina displays
❌ **Oversaturated colors**: Clashes with Medium's clean aesthetic
❌ **Stock photo clichés**: Avoid overused concepts (light bulbs for ideas, etc.)

## Resources

- **Prompt Libraries**: [Midjourney Prompts](https://prompthero.com/midjourney-prompts)
- **Stock Photos**: [Unsplash](https://unsplash.com), [Pexels](https://pexels.com)
- **Image Optimization**: [TinyPNG](https://tinypng.com), [Squoosh](https://squoosh.app)
- **Color Palettes**: [Coolors](https://coolors.co), [Adobe Color](https://color.adobe.com)

---

**Next Steps**: Integrate this skill into your Medium workflow to automatically generate professional hero images for every article.
