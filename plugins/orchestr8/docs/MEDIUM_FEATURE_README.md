# Medium Story Generation Feature

Generate world-class Medium articles with viral potential using AI-powered workflow automation.

## Quick Start

```bash
/orchestr8:create-medium-story "your article topic here"
```

**Example**:
```bash
/orchestr8:create-medium-story "How to learn Python in 30 days as a complete beginner"
```

## What You Get

The command generates two files in the `medium/` folder:

### 1. Your Article (`medium/YYYY-MM-DD-slug-title.md`)
```markdown
---
title: "Your Compelling Headline"
tags: ["tag1", "tag2", "tag3", "tag4", "tag5"]
publish_status: "draft"
hero_image: "[Placeholder]"
created_date: "2025-11-11"
---

# Your Compelling Headline

[World-class article optimized for Medium]
```

### 2. Publishing Instructions (`medium/YYYY-MM-DD-slug-title-INSTRUCTIONS.md`)
- Pre-publication checklist
- Headline alternatives for A/B testing
- Recommended Medium publications
- Manual publishing walkthrough
- API publishing info (if applicable)

## Features

✅ **Research-backed best practices** from Medium 2025 guidelines
✅ **Proven viral formulas** (listicles, case studies, how-tos)
✅ **Engagement optimization** (hooks, micro-stories, sticky lines)
✅ **Platform compliance** (distribution standards, CTA limits)
✅ **Multiple headline options** for testing
✅ **Publication-ready markdown** with frontmatter
✅ **Optional API publishing** for automation

## Article Quality Guarantees

Every generated article includes:

- **Gripping opening hook** in first 10 words (critical for engagement)
- **Authentic voice** with vulnerability and specificity
- **Clear scannable structure** with short paragraphs (1-3 sentences)
- **Emotional connection** through personal micro-stories
- **Sticky quotable lines** (3-5 memorable phrases)
- **Actionable takeaways** readers can apply immediately
- **Medium distribution compliance** (<20% CTAs, no clickbait)
- **Strategic tags** for curation categories

## Example Topics

**Technical Content**:
```bash
/orchestr8:create-medium-story "Building a REST API with TypeScript"
/orchestr8:create-medium-story "7 Python libraries every data scientist uses"
```

**Personal Development**:
```bash
/orchestr8:create-medium-story "My morning routine that changed everything"
/orchestr8:create-medium-story "How I learned to code at age 40"
```

**Career Advice**:
```bash
/orchestr8:create-medium-story "How I negotiated a 50% salary increase"
/orchestr8:create-medium-story "Landing your first developer job without a degree"
```

**Productivity**:
```bash
/orchestr8:create-medium-story "The productivity system that doubled my output"
/orchestr8:create-medium-story "5 habits that kill your focus (and what to do instead)"
```

## Publishing Your Article

### Option 1: Manual Publishing (Recommended)

1. Review generated article in `medium/[filename].md`
2. Read the instructions in `medium/[filename]-INSTRUCTIONS.md`
3. Go to https://medium.com/new-story
4. Copy/paste your markdown content
5. Add hero image and section images
6. Apply formatting (Medium auto-converts most markdown)
7. Add tags in right sidebar
8. Save as **draft** first
9. Review on mobile and desktop
10. Publish when ready

### Option 2: API Publishing (If You Have Token)

**Prerequisites**:
- Must have existing Medium integration token (no new tokens available)
- Token from https://medium.com/me/settings

**Steps**:
1. Set environment variable: `export MEDIUM_INTEGRATION_TOKEN="your_token"`
2. Use provided Python/Node.js script in instructions file
3. Publishes as draft for review
4. Manually add images and final polish on Medium

**Important**: Medium API is archived and no longer maintained. Manual publishing is more reliable.

## Workflow Phases

The command executes a 4-phase workflow:

### Phase 1: Research & Planning (0-25%)
- Analyzes topic for evergreen potential and unique angle
- Researches supporting insights and examples
- Generates 3-5 compelling headline options
- Selects optimal content framework (listicle/case study/how-to)
- Plans opening hook strategy

### Phase 2: Content Creation (25-70%)
- Writes engaging story with proven structure
- Crafts opening hook (micro-story, bold statement, or question)
- Builds sections with progressive disclosure
- Includes personal anecdotes for emotional connection
- Creates memorable sticky lines
- Formats with short paragraphs and visual breaks

### Phase 3: Optimization & Polish (70-90%)
- Ensures authentic voice with vulnerability
- Verifies Medium distribution standards compliance
- Optimizes formatting for readability
- Validates heading hierarchy and visual variety
- Confirms strategic tag selection for curation

### Phase 4: Finalization & Export (90-100%)
- Creates `medium/` folder if needed
- Saves story with frontmatter metadata
- Generates comprehensive publishing instructions
- Provides headline alternatives
- Lists recommended publications

## Medium Best Practices Applied

Based on 2025 Medium research:

**Content Quality**:
- ✅ Authenticity over perfection (real stories, vulnerability)
- ✅ Specificity builds credibility (numbers, names, details)
- ✅ Substance over surface (actionable insights, not fluff)

**Headline Strategy**:
- ✅ Balance curiosity with clarity
- ✅ Use numbers for listicles (proven to perform)
- ✅ Avoid clickbait (hurts distribution)

**Formatting**:
- ✅ Short paragraphs (1-3 sentences)
- ✅ Clear heading hierarchy (H2 sections, H3 subsections)
- ✅ Visual breaks every 3-5 paragraphs
- ✅ Scannable with bullets and bold text

**Engagement**:
- ✅ Hook in first 10 words (critical!)
- ✅ Micro-stories for emotional connection
- ✅ Sticky lines readers want to quote
- ✅ Actionable takeaways

**Distribution**:
- ✅ CTAs under 20% of content (Medium requirement)
- ✅ Strategic tags for curation
- ✅ Publication submission strategy
- ✅ Optimal length (1,400-1,750 words)

## Tips for Best Results

### Topic Selection
- Choose evergreen subjects (self-improvement, productivity, career, learning)
- Pick topics where you have personal experience or unique perspective
- Validate broad audience appeal

### Customization
- Add your specific examples and anecdotes during review
- Adjust headline if you have a stronger variation
- Replace image placeholders with actual high-res photos
- Personalize based on your authentic voice

### Building Consistency
1. Start with 1 article per week
2. Batch topic ideas (generate 10 at once)
3. Use this command for each article
4. Analyze what works, iterate on successful patterns
5. Build audience systematically

### Topic Ideation
- Personal experiences and lessons learned
- Common questions in your field
- Contrarian takes on popular advice
- How-to guides for problems you solved
- Mistakes you made and insights gained

## What Makes Articles Viral on Medium

Based on analysis of 100+ viral Medium articles:

1. **Number-based headlines** (5 Ways, 7 Habits, etc.)
2. **Personal proof** (I tried X, here's what happened)
3. **Contrarian angles** (Stop doing X, do Y instead)
4. **Specific results** (concrete numbers, timeframes)
5. **Emotional hooks** (vulnerability, relatability)
6. **Scannable structure** (easy to skim, hard to stop reading)
7. **Actionable takeaways** (readers can apply immediately)

All of these are built into the workflow.

## Files Created

```
medium/
├── 2025-11-11-how-to-learn-python-in-30-days.md
├── 2025-11-11-how-to-learn-python-in-30-days-INSTRUCTIONS.md
├── 2025-11-11-productivity-system-that-doubled-output.md
├── 2025-11-11-productivity-system-that-doubled-output-INSTRUCTIONS.md
└── ...
```

## Post-Publication Strategy

After publishing on Medium:

1. **Share strategically**:
   - Twitter with compelling excerpt
   - LinkedIn with professional context
   - Relevant communities (non-spammy)

2. **Engage actively**:
   - Respond to comments within 24 hours
   - Thank highlights and shares
   - Join conversations

3. **Monitor metrics**:
   - Check Medium stats dashboard
   - Note views, read ratio, highlights
   - Track which topics perform

4. **Learn and iterate**:
   - Identify successful patterns
   - Double down on what works
   - Experiment with new angles

5. **Build on success**:
   - Create follow-up articles
   - Submit to publications
   - Cross-post to other platforms

## Advanced: Publication Submission

**Benefits of submitting to Medium publications**:
- Larger built-in audience
- Higher curation chances  
- Credibility boost
- Community support

**Top publications by category** (2025):

**Tech/Programming**:
- The Startup
- Better Programming
- JavaScript in Plain English
- Level Up Coding

**Personal Development**:
- The Ascent
- Better Humans
- Mind Cafe
- The Writing Cooperative

**Strategy**:
1. Build 3-5 solid articles on your profile first
2. Research target publications
3. Follow their submission guidelines
4. Pitch your best work
5. Maintain relationship with editors

## Troubleshooting

**Article feels generic?**
- Add more personal anecdotes
- Include specific numbers and details
- Increase vulnerability (share failures)

**Headline not compelling?**
- Use number formulas (7 Ways, 5 Habits)
- Add specific metric (In 30 Days)
- Create curiosity gap (without being clickbait)

**Article too long?**
- Cut unnecessary backstory
- Make paragraphs shorter
- Remove tangents
- Focus on core value

**Article too short?**
- Add more examples for each point
- Include micro-stories
- Expand on implications
- Add a "common mistakes" section

## Resources

**Within this plugin**:
- Agent: `resources/agents/_fragments/medium-writer-expert.md`
- Skills: `resources/skills/_fragments/medium-*.md`
- Workflow: `resources/workflows/_fragments/workflow-create-medium-story.md`

**External**:
- Medium Partner Program: https://medium.com/creators
- Medium Help Center: https://help.medium.com/
- Medium Stats Dashboard: https://medium.com/me/stats

## Limitations

1. **Medium API**: No longer issuing new tokens; manual publishing recommended
2. **Image handling**: Must add images manually (API doesn't support upload)
3. **Editing**: Generated content is starting point; personalize before publishing
4. **No analytics**: Cannot retrieve Medium stats programmatically

## Success Metrics

A successful Medium article:
- **Engagement**: High read ratio, many highlights, active comments
- **Distribution**: Selected for Medium curation
- **Virality**: Shared on social media, bookmarked frequently
- **Authority**: Positions you as expert in your field
- **Growth**: Builds follower base and publication opportunities

This workflow optimizes for all of these outcomes.

## Support

For issues or questions about this feature:
1. Check `MEDIUM_FEATURE_SUMMARY.md` for technical details
2. Review generated `-INSTRUCTIONS.md` files
3. Consult individual fragment files in `resources/`
4. Open an issue on the repository

---

**Happy writing! Create world-class Medium articles with confidence.**
