---
id: medium-api-publishing
category: skill
tags: [medium, api, publishing, automation, integration, oauth, rest-api, markdown, programmatic-posting]
capabilities:
  - Publish articles to Medium programmatically via API
  - Authenticate with Medium using integration tokens
  - Format content in Markdown or HTML for API submission
  - Handle Medium API endpoints and response handling
  - Manage post metadata (title, tags, publish status)
  - Troubleshoot API errors and limitations
useWhen:
  - Automating Medium article publishing from markdown files or content management systems with API integration
  - Building content distribution workflows publishing to multiple platforms including Medium programmatically
  - Creating tools for batch publishing or scheduling Medium posts with REST API automation
  - Integrating Medium publishing into existing writing workflows or static site generators
  - Developing applications requiring programmatic Medium post creation with OAuth authentication
  - Troubleshooting Medium API integration issues with authentication errors or content formatting problems
estimatedTokens: 650
---

# Medium API Publishing

Programmatically publish articles to Medium using their REST API, with authentication, content formatting, and error handling.

## Important Limitations (2025)

### API Status
- **Official Medium API**: No longer actively maintained (GitHub repo archived March 2023)
- **New Integration Tokens**: Medium stopped issuing new integration tokens
- **Existing Tokens**: Continue to work if you already have one
- **Limited Functionality**: Can create posts and get user info only; cannot edit or delete posts

### Recommendation
If you don't already have a Medium integration token, you **cannot** use the official API for new projects. Alternative approaches:
- Manual posting through Medium's web interface
- Use third-party services (if they have existing tokens)
- Wait for potential API revival (no timeline)

## For Users With Existing Integration Tokens

### Authentication Setup

**1. Get Your Integration Token**
```
1. Go to https://medium.com/me/settings
2. Scroll to "Integration tokens" section
3. Enter description (e.g., "Article Publisher")
4. Click "Get integration token"
5. Copy token immediately (shown only once)
```

**2. Store Token Securely**
```bash
# Environment variable (recommended)
export MEDIUM_INTEGRATION_TOKEN="your_token_here"

# Or in .env file
MEDIUM_INTEGRATION_TOKEN=your_token_here

# Never commit tokens to version control!
# Add to .gitignore:
.env
```

### Get Your User ID

Before publishing, retrieve your Medium user ID:

```bash
# API Request
curl https://api.medium.com/v1/me \
  -H "Authorization: Bearer YOUR_INTEGRATION_TOKEN"

# Response
{
  "data": {
    "id": "5303d74c64f66366f00cb9b2a94f3251bf5",
    "username": "yourname",
    "name": "Your Name",
    "url": "https://medium.com/@yourname",
    "imageUrl": "https://..."
  }
}
```

Save the `id` field—you'll need it for publishing.

## Publishing a Post

### Endpoint
```
POST https://api.medium.com/v1/users/{USER_ID}/posts
```

### Required Headers
```bash
Authorization: Bearer YOUR_INTEGRATION_TOKEN
Content-Type: application/json
Accept: application/json
```

### Request Body Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `title` | string | Yes | Article title |
| `contentFormat` | string | Yes | "markdown", "html", or "plain" |
| `content` | string | Yes | Article content in specified format |
| `tags` | array | No | Array of strings (max 5 tags) |
| `publishStatus` | string | No | "public", "draft", or "unlisted" (default: "public") |
| `license` | string | No | "all-rights-reserved", "cc-40-by", "cc-40-by-sa", etc. |
| `notifyFollowers` | boolean | No | Whether to notify followers (default: false) |

### Example: Publish Markdown Article

```bash
curl -X POST https://api.medium.com/v1/users/USER_ID/posts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "How to Use the Medium API",
    "contentFormat": "markdown",
    "content": "# Introduction\n\nThis is my article content in **Markdown**.\n\n## Section 1\n\nParagraph text here.",
    "tags": ["programming", "api", "tutorial"],
    "publishStatus": "draft",
    "notifyFollowers": false
  }'
```

### Response

**Success (201 Created):**
```json
{
  "data": {
    "id": "e6f36a",
    "title": "How to Use the Medium API",
    "authorId": "5303d74c64f66366f00cb9b2a94f3251bf5",
    "tags": ["programming", "api", "tutorial"],
    "url": "https://medium.com/@yourname/how-to-use-the-medium-api-e6f36a",
    "canonicalUrl": "",
    "publishStatus": "draft",
    "publishedAt": 0,
    "license": "all-rights-reserved",
    "licenseUrl": "https://medium.com/policy/9db0094a1e0f"
  }
}
```

## Code Examples

### Python Implementation

```python
import os
import requests
import json

class MediumPublisher:
    def __init__(self, integration_token):
        self.token = integration_token
        self.base_url = "https://api.medium.com/v1"
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        self.user_id = None
    
    def get_user_info(self):
        """Get authenticated user information"""
        response = requests.get(
            f"{self.base_url}/me",
            headers=self.headers
        )
        response.raise_for_status()
        data = response.json()
        self.user_id = data["data"]["id"]
        return data["data"]
    
    def publish_post(self, title, content, content_format="markdown", 
                     tags=None, publish_status="draft", notify=False):
        """
        Publish a post to Medium
        
        Args:
            title: Article title
            content: Article content
            content_format: "markdown", "html", or "plain"
            tags: List of tags (max 5)
            publish_status: "public", "draft", or "unlisted"
            notify: Whether to notify followers
        """
        if not self.user_id:
            self.get_user_info()
        
        payload = {
            "title": title,
            "contentFormat": content_format,
            "content": content,
            "publishStatus": publish_status,
            "notifyFollowers": notify
        }
        
        if tags:
            payload["tags"] = tags[:5]  # Max 5 tags
        
        response = requests.post(
            f"{self.base_url}/users/{self.user_id}/posts",
            headers=self.headers,
            json=payload
        )
        response.raise_for_status()
        return response.json()

# Usage
token = os.getenv("MEDIUM_INTEGRATION_TOKEN")
publisher = MediumPublisher(token)

# Get user info
user = publisher.get_user_info()
print(f"Authenticated as: {user['name']}")

# Publish article
result = publisher.publish_post(
    title="My Article Title",
    content="# Hello\n\nThis is my article.",
    content_format="markdown",
    tags=["programming", "python"],
    publish_status="draft"
)

print(f"Published: {result['data']['url']}")
```

### Node.js Implementation

```javascript
const axios = require('axios');

class MediumPublisher {
  constructor(integrationToken) {
    this.token = integrationToken;
    this.baseUrl = 'https://api.medium.com/v1';
    this.headers = {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    this.userId = null;
  }

  async getUserInfo() {
    const response = await axios.get(`${this.baseUrl}/me`, {
      headers: this.headers
    });
    this.userId = response.data.data.id;
    return response.data.data;
  }

  async publishPost({
    title,
    content,
    contentFormat = 'markdown',
    tags = [],
    publishStatus = 'draft',
    notifyFollowers = false
  }) {
    if (!this.userId) {
      await this.getUserInfo();
    }

    const payload = {
      title,
      contentFormat,
      content,
      publishStatus,
      notifyFollowers
    };

    if (tags.length > 0) {
      payload.tags = tags.slice(0, 5); // Max 5 tags
    }

    const response = await axios.post(
      `${this.baseUrl}/users/${this.userId}/posts`,
      payload,
      { headers: this.headers }
    );

    return response.data;
  }
}

// Usage
const token = process.env.MEDIUM_INTEGRATION_TOKEN;
const publisher = new MediumPublisher(token);

(async () => {
  // Get user info
  const user = await publisher.getUserInfo();
  console.log(`Authenticated as: ${user.name}`);

  // Publish article
  const result = await publisher.publishPost({
    title: 'My Article Title',
    content: '# Hello\n\nThis is my article.',
    contentFormat: 'markdown',
    tags: ['programming', 'javascript'],
    publishStatus: 'draft'
  });

  console.log(`Published: ${result.data.url}`);
})();
```

## Content Formatting

### Markdown Format (Recommended)
```markdown
# Main Title

Introduction paragraph with **bold** and *italic* text.

## Section 1

Paragraph with [links](https://example.com) and inline `code`.

### Subsection

- Bullet point 1
- Bullet point 2

1. Numbered item 1
2. Numbered item 2

```python
# Code block
def example():
    return "Hello, Medium!"
```

> Blockquote for emphasis

![Image alt text](https://example.com/image.jpg)
```

### HTML Format
```html
<h1>Main Title</h1>
<p>Introduction paragraph with <strong>bold</strong> and <em>italic</em> text.</p>
<h2>Section 1</h2>
<p>Paragraph with <a href="https://example.com">links</a> and inline <code>code</code>.</p>
<ul>
  <li>Bullet point 1</li>
  <li>Bullet point 2</li>
</ul>
<pre><code class="python">def example():
    return "Hello, Medium!"
</code></pre>
<img src="https://example.com/image.jpg" alt="Image alt text" />
```

## Error Handling

### Common Error Codes

| Status Code | Error | Solution |
|-------------|-------|----------|
| 401 | Unauthorized | Check integration token is valid |
| 400 | Bad Request | Validate request payload format |
| 403 | Forbidden | Token may be revoked; regenerate |
| 404 | Not Found | Check user ID is correct |
| 500 | Server Error | Retry after delay |

### Error Response Example
```json
{
  "errors": [
    {
      "message": "Invalid integration token",
      "code": 2
    }
  ]
}
```

### Robust Error Handling (Python)
```python
def publish_with_retry(publisher, title, content, max_retries=3):
    """Publish with automatic retry on transient errors"""
    for attempt in range(max_retries):
        try:
            result = publisher.publish_post(title, content)
            return result
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 401:
                raise ValueError("Invalid token - cannot retry")
            elif e.response.status_code >= 500:
                if attempt < max_retries - 1:
                    time.sleep(2 ** attempt)  # Exponential backoff
                    continue
                raise
            else:
                raise
    raise Exception("Max retries exceeded")
```

## Best Practices

### Security
✅ **Do:**
- Store tokens in environment variables
- Add `.env` to `.gitignore`
- Rotate tokens periodically
- Use HTTPS for all requests

❌ **Don't:**
- Commit tokens to version control
- Share tokens publicly
- Hardcode tokens in source code

### Content Preparation
✅ **Do:**
- Validate Markdown/HTML before sending
- Test with `publishStatus: "draft"` first
- Keep tags relevant (max 5)
- Use proper heading hierarchy (H1, H2, H3)

❌ **Don't:**
- Send malformed Markdown/HTML
- Use all 5 tag slots with low-value tags
- Skip the draft review step

### Rate Limiting
- No official rate limits documented
- Implement exponential backoff for retries
- Don't spam rapid requests
- Monitor for 429 (Too Many Requests) responses

## Workflow Integration

### Publish from Local Markdown Files
```python
import os
import frontmatter

def publish_from_file(publisher, filepath):
    """Publish a markdown file with YAML frontmatter"""
    # Read file with frontmatter
    with open(filepath, 'r') as f:
        post = frontmatter.load(f)
    
    # Extract metadata
    title = post.get('title', os.path.basename(filepath))
    tags = post.get('tags', [])
    status = post.get('publish_status', 'draft')
    
    # Publish
    result = publisher.publish_post(
        title=title,
        content=post.content,
        content_format='markdown',
        tags=tags,
        publish_status=status
    )
    
    return result

# Usage
result = publish_from_file(publisher, 'articles/my-post.md')
print(f"Published: {result['data']['url']}")
```

### Example Markdown File with Frontmatter
```markdown
---
title: "How to Use the Medium API"
tags: ["programming", "api", "tutorial"]
publish_status: "draft"
---

# Introduction

Your article content here...
```

## Limitations and Workarounds

### Cannot Edit Published Posts
**Problem**: API doesn't support editing existing posts
**Workaround**: 
- Publish as draft first
- Review on Medium web interface
- Manually edit if needed
- Change to public when ready

### Cannot Delete Posts
**Problem**: API doesn't support deletion
**Workaround**: Manually delete via web interface

### Cannot Upload Images
**Problem**: API doesn't support image uploads
**Workaround**:
- Host images externally (Imgur, Cloudinary, S3)
- Reference via URL in Markdown: `![alt](https://...)`
- Or manually add images after API publish

### No Analytics Access
**Problem**: Cannot retrieve view counts, read ratios, etc.
**Workaround**: Use Medium web interface for analytics

## Alternative: Unofficial Medium API

If you don't have an integration token, there's an unofficial third-party API at **mediumapi.com** that provides read-only access (fetching articles, user info) but **cannot publish posts**.

## Summary Checklist

Before implementing Medium API publishing:
- ✅ Do you have an existing Medium integration token?
- ✅ Have you tested authentication with `/me` endpoint?
- ✅ Is token stored securely (environment variable)?
- ✅ Have you implemented error handling?
- ✅ Are you publishing drafts first for review?
- ✅ Is content properly formatted (valid Markdown/HTML)?
- ✅ Have you tested with sample content?
- ✅ Do you have a fallback plan if API fails?

## Official Resources

- **API Documentation**: https://github.com/Medium/medium-api-docs (archived)
- **Integration Token Settings**: https://medium.com/me/settings
- **Medium Help Center**: https://help.medium.com/hc/en-us/articles/213480228-API-Importing
