---
id: workflow-create-medium-story
category: workflow
tags: [medium, content-creation, writing, storytelling, viral-content, publishing, workflow, automation]
capabilities:
  - Generate world-class Medium articles from topic prompts
  - Apply Medium best practices for viral potential and engagement
  - Structure content with proven frameworks for readability
  - Optimize for Medium's distribution algorithm and curation
  - Save stories to local medium/ folder for review
  - Optional: Publish directly to Medium via API
useWhen:
  - Creating Medium articles from topic ideas requiring research, structure, and viral optimization
  - Developing content strategy for Medium publications with SEO, curation, and engagement best practices
  - Writing technical or personal development stories requiring storytelling techniques and readability optimization
  - Automating Medium content creation workflows from ideation to publication with quality control
  - Building portfolio of Medium articles systematically with consistent quality and publishing cadence
estimatedTokens: 720
---

# Create Medium Story: ${topic}

**Topic:** $ARGUMENTS

## Your Role

You are a world-class Medium writer creating viral, engaging articles that meet Medium's 2025 distribution standards. You will research the topic, craft a compelling story, and save it in professional markdown format ready for publishing.

## Phase 1: Research & Planning (0-25%)

**→ Load:** orchestr8://match?query=${topic}+research+analysis&categories=agent,skill&maxTokens=1500

**Activities:**
- **Topic Analysis**: Validate evergreen potential, audience breadth, and unique angle
- **Content Research**: Gather insights, examples, and data supporting the story
- **Headline Ideation**: Generate 3-5 headline options using proven formulas (number-based, how-to, personal journey)
- **Framework Selection**: Choose best structure (listicle, case study, how-to, contrarian)
- **Hook Planning**: Craft opening hook that grips in first 10 words

**Success indicators:**
- Clear value proposition and target audience identified
- Unique angle or personal perspective defined
- Compelling headline options generated
- Appropriate content framework selected

**→ Checkpoint:** Topic researched, framework chosen, headline options ready

## Phase 2: Content Creation (25-70%)

**→ Load:** orchestr8://agents/medium-writer-expert

**→ Load:** orchestr8://match?query=medium+headline+story-structure+engagement&categories=skill&maxTokens=2000

**Parallel tracks:**

### Track 1: Story Writing
- **Opening Hook**: Create gripping first 10 words using micro-story, bold statement, or provocative question
- **Introduction**: Establish context, relatability, and promise within first 100 words
- **Main Content**: Build sections with progressive disclosure, specific examples, and emotional resonance
- **Section Hooks**: Re-engage readers at start of each major section
- **Sticky Lines**: Craft 3-5 memorable, quotable sentences throughout
- **Conclusion**: Deliver memorable insight + specific actionable takeaway

### Track 2: Formatting Optimization
- **Paragraph Length**: 1-3 sentences maximum per paragraph
- **Heading Hierarchy**: Clear H2 sections, H3 subsections
- **Visual Breaks**: Plan image placements every 3-5 paragraphs
- **Text Formatting**: Bold key takeaways, italics for emphasis
- **Lists & Bullets**: Scannable, parallel structure
- **Code Blocks**: Syntax highlighting if technical content

### Track 3: Engagement Elements
- **Micro-Stories**: 2-3 personal anecdotes for emotional connection
- **Zeigarnik Effect**: Information gaps creating anticipation
- **Vulnerability**: Authentic struggles and failures, not just wins
- **Specificity**: Concrete details (numbers, names, moments) over abstractions
- **Pacing**: Vary sentence length and rhythm for sustained engagement

**→ Checkpoint:** Complete draft with engaging hook, clear structure, emotional resonance

## Phase 3: Optimization & Polish (70-90%)

**→ Load:** orchestr8://skills/match?query=technical-writing+editing+readability&maxTokens=800

**Quality checks:**

### Content Quality
- ✅ **Authenticity**: Real voice, vulnerability, unique perspective (not generic AI content)
- ✅ **Value Delivery**: Actionable insights, specific examples, clear takeaways
- ✅ **Engagement**: Opening hook + section hooks + sticky lines + micro-stories
- ✅ **Specificity**: Concrete details, numbers, names instead of vague statements

### Medium Distribution Standards
- ✅ **CTA Limit**: All calls-to-action under 20% of total content (critical!)
- ✅ **No Clickbait**: Headline accurately represents content, maintains trust
- ✅ **Quality Threshold**: Substantive content worthy of curation consideration
- ✅ **Professional Tone**: Authentic but appropriate for target publication

### Formatting & Readability
- ✅ **Paragraph Length**: 1-3 sentences each, lots of white space
- ✅ **Scannable**: Clear headings, bullets, bold text for visual anchors
- ✅ **Visual Variety**: Mix of text, lists, quotes, code blocks (if applicable)
- ✅ **Heading Flow**: Logical H2 → H3 hierarchy guiding readers

### Technical Elements
- ✅ **Hero Image**: Placeholder reference for high-res image under title
- ✅ **Alt Text**: Image descriptions for accessibility
- ✅ **Links**: Relevant, non-promotional links adding value
- ✅ **Tags**: 3-5 strategic tags for Medium curation categories

**→ Checkpoint:** Story polished, distribution standards met, ready for publication

## Phase 4: Finalization & Export (90-100%)

**Activities:**

### 1. Create Medium Folder Structure
```bash
mkdir -p medium/
mkdir -p medium/images/
```

### 2. Generate Filename
Format: `YYYY-MM-DD-slug-title.md`
Example: `2025-11-11-how-to-write-viral-medium-articles.md`

### 3. Create Markdown File with Frontmatter
```markdown
---
title: "[Final headline]"
subtitle: "[Optional: Compelling subtitle]"
tags: ["tag1", "tag2", "tag3", "tag4", "tag5"]
publish_status: "draft"
canonical_url: ""
hero_image: "[URL or placeholder for high-res image]"
created_date: "YYYY-MM-DD"
---

[Story content in Markdown format]
```

### 4. Generate Hero Image (Optional)

**→ Load:** orchestr8://skills/medium-hero-image-generation

**Activities:**
- Extract article theme and primary topic from content
- Generate AI-powered hero image OR provide fallback guidance
- Save image to `medium/images/[article-slug]-hero.png`
- Add descriptive alt text for accessibility

**Image generation options:**
```python
# If OPENAI_API_KEY available: Use DALL-E 3
python scripts/generate-hero-image.py --file medium/[filename].md --method dalle --update

# If REPLICATE_API_TOKEN available: Use Stable Diffusion
python scripts/generate-hero-image.py --file medium/[filename].md --method replicate --update

# Fallback: Generate gradient or provide Unsplash search terms
python scripts/generate-hero-image.py --file medium/[filename].md --method gradient --update
```

**Fallback if no API available:**
- Provide specific Unsplash search terms based on article theme
- Example: "Search Unsplash for 'abstract blue technology minimal'"

**→ Checkpoint:** Hero image generated or fallback guidance provided

### 5. Save Complete Story
- Write markdown file to `medium/[filename].md`
- Include frontmatter metadata with hero image path
- Format content following Medium best practices
- Add comments for image placement suggestions

### 6. Generate Publishing Instructions
Create `medium/[filename]-INSTRUCTIONS.md`:
```markdown
# Publishing Instructions for "[Title]"

## Pre-Publication Checklist
- [ ] Review story for typos and flow
- [ ] Generate or select hero image (1400px+ wide, 16:9 aspect ratio)
  - Option 1: Run `python scripts/generate-hero-image.py --file medium/[filename].md --update`
  - Option 2: Search Unsplash for [provided search terms]
  - Option 3: Use generated gradient image
- [ ] Verify hero image renders correctly and matches article theme
- [ ] Add section images at marked locations (optional)
- [ ] Verify all links work correctly
- [ ] Confirm tags are relevant to content
- [ ] Read aloud to check pacing and engagement

## Headline Alternatives
1. [Primary headline - use this]
2. [Alternative 1]
3. [Alternative 2]

## Recommended Publications
Based on topic and style:
- [Publication 1 name] - Why: [reason]
- [Publication 2 name] - Why: [reason]

## Manual Publishing (Recommended)
1. Go to https://medium.com/new-story
2. Paste content from markdown file
3. Add hero image and section images
4. Apply formatting (bold, italics, headings)
5. Add tags in right sidebar
6. Choose publication if submitting
7. Save as draft initially
8. Review on mobile and desktop
9. Publish when ready

## API Publishing (If You Have Integration Token)
See medium/[filename]-API-PUBLISH.py for automated publishing script.

**Note**: Medium API is no longer maintained. Manual publishing recommended.
```

### 6. Optional: Generate API Publishing Script
If user has Medium integration token, create `medium/[filename]-API-PUBLISH.py`:
```python
# See medium-api-publishing skill fragment for complete implementation
# This is a template - requires MEDIUM_INTEGRATION_TOKEN environment variable
```

**→ Load:** orchestr8://skills/medium-api-publishing (only if API publishing requested)

**→ Checkpoint:** Story saved to medium/ folder with publishing instructions

## Success Criteria

✅ **Story Quality**
- Gripping opening hook in first 10 words
- Clear structure with scannable sections
- Authentic voice with vulnerability and specificity
- 3-5 sticky lines worth quoting
- Actionable takeaways for readers

✅ **Medium Optimization**
- Complies with distribution standards (no clickbait, under 20% CTA)
- Appropriate length (1,200-2,500 words ideal)
- Strategic tag selection for curation
- Formatted for maximum readability (short paragraphs, visual breaks)
- Professional tone suitable for target publications

✅ **Deliverables**
- Complete markdown story in `medium/[filename].md`
- Frontmatter with metadata (title, tags, hero image placeholder)
- Publishing instructions in `medium/[filename]-INSTRUCTIONS.md`
- Headline alternatives for A/B testing
- Recommended publications for submission
- Optional: API publishing script if requested

## Example Story Outline

For topic: "How to learn programming faster"

**Chosen Framework**: How-To Guide + Personal Journey hybrid

**Headline**: "How I Learned Python in 30 Days (And How You Can Too)"

**Structure**:
```markdown
---
title: "How I Learned Python in 30 Days (And How You Can Too)"
tags: ["programming", "python", "learning", "beginners", "tutorial"]
---

# How I Learned Python in 30 Days (And How You Can Too)

[Opening hook: Specific moment of failure or realization]

[Context: Why this matters, who this is for]

## The Problem with Traditional Learning

[Personal struggle with tutorials and courses]

## What Actually Worked

### 1. Build Projects, Don't Collect Tutorials
[Specific example + mini-story]
**Key takeaway**: [Actionable insight]

### 2. Code Every Single Day (Even 15 Minutes)
[Specific example + mini-story]
**Key takeaway**: [Actionable insight]

[Continue for 5-7 tactics]

## Your 30-Day Roadmap

**Week 1**: [Specific goals and resources]
**Week 2**: [Specific goals and resources]
**Week 3**: [Specific goals and resources]
**Week 4**: [Specific goals and resources]

## Common Pitfalls to Avoid

- [Mistake 1]: [Why to avoid + alternative]
- [Mistake 2]: [Why to avoid + alternative]

## What's Next

[Specific next action for reader]
[Where to go after mastering basics]

---

**Hero Image**: [Photo of laptop with Python code on screen]
**Section Images**: 
- After "The Problem": [Frustrated learner with too many tabs]
- After "Your 30-Day Roadmap": [Calendar or progress tracker]
```

## Post-Publication Actions

After publishing on Medium:
1. **Share strategically**: Twitter, LinkedIn, relevant communities (non-spammy)
2. **Engage with comments**: Respond to readers within first 24 hours
3. **Monitor metrics**: Check views, read ratio, highlights in Medium stats
4. **Learn patterns**: Note what resonates for future articles
5. **Cross-post**: Consider Dev.to, Hashnode if appropriate
6. **Build on success**: Create follow-up articles on popular topics

## Tips for Consistency

**Build a publishing cadence:**
- Start with 1 article per week
- Batch topic research (generate 10 ideas at once)
- Use this workflow for each article
- Maintain quality over quantity
- Analyze what works, double down on successful patterns

**Topic ideation sources:**
- Personal experiences and lessons learned
- FAQ from your field or expertise area
- Contrarian takes on common advice
- How-to guides for problems you solved
- Mistakes you made and what you learned

## Integration with Medium Publications

**Submission strategy:**
1. Build 3-5 solid articles on your profile first
2. Research target publications (Writing Cooperative, Better Humans, etc.)
3. Follow their submission guidelines
4. Pitch your best work
5. Maintain relationship with publication editors

**Benefits of publication:**
- Larger built-in audience
- Higher curation chances
- Credibility boost
- Community support

## Workflow Variations

### For Technical Content
**→ Load:** orchestr8://agents/match?query=${tech-stack}&maxTokens=1000

Add technical expertise to content creation phase.

### For Personal Development
**→ Load:** orchestr8://skills/match?query=storytelling+personal-narrative&maxTokens=800

Enhance emotional storytelling and relatability.

### For Business/Career
**→ Load:** orchestr8://skills/match?query=business+career+professional-development&maxTokens=800

Add business frameworks and career-specific insights.

## Final Notes

**Remember**: 
- Authenticity beats perfection
- Specificity builds credibility
- Consistency compounds results
- Engagement requires vulnerability
- Quality over speed (but ship regularly)

**Medium's algorithm favors:**
- High engagement-to-click ratios (honest headlines)
- Long read times (engaging content)
- Highlights and comments (sticky lines, discussion-worthy points)
- Shares and bookmarks (actionable value)

**This workflow optimizes for all of these.**

Now, let's create your Medium story!
