// Enhanced Resource Preview Panel
// Split-view interface with live preview, syntax highlighting, and quick actions

class ResourcePreview {
  constructor(dashboard) {
    this.dashboard = dashboard;
    this.currentResource = null;
    this.isPanelOpen = false;

    this.init();
  }

  init() {
    this.createPreviewPanel();
    this.setupEventListeners();
  }

  createPreviewPanel() {
    const html = `
            <div id="resourcePreviewPanel" class="preview-panel">
                <div class="preview-header">
                    <div class="preview-title-section">
                        <h3 id="previewResourceName">Select a resource</h3>
                        <span id="previewResourceCategory" class="preview-category"></span>
                    </div>
                    <div class="preview-actions">
                        <button class="btn btn-icon" id="previewCopyURI" title="Copy URI">
                            <span>📋</span>
                        </button>
                        <button class="btn btn-icon" id="previewOpenNew" title="Open in Modal">
                            <span>↗️</span>
                        </button>
                        <button class="btn btn-icon" id="previewClose" title="Close Preview">
                            <span>✕</span>
                        </button>
                    </div>
                </div>

                <div class="preview-metadata" id="previewMetadata">
                    <div class="metadata-item">
                        <span class="metadata-label">Type:</span>
                        <span class="metadata-value" id="previewType">-</span>
                    </div>
                    <div class="metadata-item">
                        <span class="metadata-label">Tokens:</span>
                        <span class="metadata-value" id="previewTokens">-</span>
                    </div>
                    <div class="metadata-item">
                        <span class="metadata-label">Tags:</span>
                        <div class="metadata-tags" id="previewTags"></div>
                    </div>
                </div>

                <div class="preview-tabs">
                    <button class="preview-tab active" data-tab="content">Content</button>
                    <button class="preview-tab" data-tab="metadata">Full Metadata</button>
                    <button class="preview-tab" data-tab="related">Related</button>
                </div>

                <div class="preview-body">
                    <div class="preview-tab-content active" id="previewContentTab">
                        <div class="preview-loading">
                            <div class="skeleton skeleton-title"></div>
                            <div class="skeleton skeleton-paragraph"></div>
                            <div class="skeleton skeleton-paragraph"></div>
                            <div class="skeleton skeleton-paragraph" style="width: 80%;"></div>
                        </div>
                    </div>
                    <div class="preview-tab-content" id="previewMetadataTab">
                        <pre class="preview-json"></pre>
                    </div>
                    <div class="preview-tab-content" id="previewRelatedTab">
                        <div class="related-resources"></div>
                    </div>
                </div>

                <div class="preview-toc" id="previewTOC">
                    <div class="toc-title">Contents</div>
                    <div class="toc-list"></div>
                </div>
            </div>
        `;

    // Insert into explorer view
    const explorerContent = document.querySelector(".explorer-content");
    if (explorerContent) {
      explorerContent.style.display = "grid";
      explorerContent.style.gridTemplateColumns = "1fr";
      explorerContent.insertAdjacentHTML("beforeend", html);
    }
  }

  setupEventListeners() {
    // Close button
    const closeBtn = document.getElementById("previewClose");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => this.closePanel());
    }

    // Copy URI button
    const copyBtn = document.getElementById("previewCopyURI");
    if (copyBtn) {
      copyBtn.addEventListener("click", () => this.copyURI());
    }

    // Open in modal button
    const openBtn = document.getElementById("previewOpenNew");
    if (openBtn) {
      openBtn.addEventListener("click", () => this.openInModal());
    }

    // Tab switching
    document.querySelectorAll(".preview-tab").forEach((tab) => {
      tab.addEventListener("click", () => this.switchTab(tab.dataset.tab));
    });

    // Resource card clicks
    this.attachResourceClickHandlers();
  }

  attachResourceClickHandlers() {
    // DISABLED: Preview panel conflicts with modal behavior
    // The main app.js already handles resource card clicks with openResourceModal()
    // If we want to re-enable split-view preview, we need to:
    // 1. Remove the modal click handler from app.js
    // 2. OR add a toggle/setting to choose between modal vs preview panel
    // 3. OR detect if user prefers modal (e.g., small screen) vs panel (large screen)

    console.log(
      "[ResourcePreview] Click handlers disabled to prevent conflict with modal",
    );
    return;

    // Original code below (commented out):
    /*
        // Observe for dynamically added resource cards
        const observer = new MutationObserver(() => {
            const cards = document.querySelectorAll('.resource-card');
            cards.forEach(card => {
                if (!card.dataset.previewAttached) {
                    card.dataset.previewAttached = 'true';
                    card.addEventListener('click', (e) => {
                        // Don't open preview if clicking on an action button
                        if (e.target.closest('.resource-action')) return;

                        const uri = card.dataset.uri;
                        this.loadResource(uri);
                    });
                }
            });
        });

        const resourceGrid = document.getElementById('resourceGrid');
        if (resourceGrid) {
            observer.observe(resourceGrid, { childList: true, subtree: true });
        }
        */
  }

  async loadResource(uri) {
    this.currentResource = { uri };
    this.openPanel();

    // Show loading state
    document.getElementById("previewContentTab").innerHTML = `
            <div class="preview-loading">
                <div class="skeleton skeleton-title"></div>
                <div class="skeleton skeleton-paragraph"></div>
                <div class="skeleton skeleton-paragraph"></div>
                <div class="skeleton skeleton-paragraph" style="width: 80%;"></div>
            </div>
        `;

    try {
      const encodedUri = encodeURIComponent(uri);
      const response = await fetch(`/api/resource?uri=${encodedUri}`);
      const data = await response.json();

      if (data.error) {
        this.showError(data.error);
        return;
      }

      this.currentResource = { ...this.currentResource, ...data };
      this.renderPreview();
    } catch (error) {
      this.showError(error.message);
    }
  }

  openPanel() {
    const panel = document.getElementById("resourcePreviewPanel");
    const explorerContent = document.querySelector(".explorer-content");

    if (panel && explorerContent) {
      panel.classList.add("active");
      this.isPanelOpen = true;

      // Animate grid change
      explorerContent.style.gridTemplateColumns = "1fr 500px";

      // Adjust resource grid to allow scrolling
      const resourceGrid = document.getElementById("resourceGrid");
      if (resourceGrid) {
        resourceGrid.style.maxHeight = "calc(100vh - 250px)";
        resourceGrid.style.overflowY = "auto";
      }
    }
  }

  closePanel() {
    const panel = document.getElementById("resourcePreviewPanel");
    const explorerContent = document.querySelector(".explorer-content");

    if (panel && explorerContent) {
      panel.classList.remove("active");
      this.isPanelOpen = false;
      explorerContent.style.gridTemplateColumns = "1fr";

      const resourceGrid = document.getElementById("resourceGrid");
      if (resourceGrid) {
        resourceGrid.style.maxHeight = "";
        resourceGrid.style.overflowY = "";
      }
    }
  }

  renderPreview() {
    const resource = this.currentResource;

    // Update header
    document.getElementById("previewResourceName").textContent =
      resource.name || this.extractNameFromURI(resource.uri);

    const category = this.extractCategory(resource.uri);
    const categoryEl = document.getElementById("previewResourceCategory");
    categoryEl.textContent = category;
    categoryEl.className = `preview-category category-${category}`;

    // Update metadata
    document.getElementById("previewType").textContent =
      resource.mimeType || "text/markdown";

    const tokens = this.estimateTokens(resource.content);
    document.getElementById("previewTokens").textContent =
      `~${tokens.toLocaleString()}`;

    // Update tags
    this.renderTags(resource);

    // Render content
    this.renderContent(resource);

    // Generate TOC
    this.generateTOC(resource.content);

    // Load related resources
    this.loadRelatedResources(resource);
  }

  renderContent(resource) {
    const contentTab = document.getElementById("previewContentTab");
    const content = resource.content || resource.text || "";

    if (!content) {
      contentTab.innerHTML =
        '<div class="preview-empty">No content available</div>';
      return;
    }

    // Parse and render markdown with syntax highlighting
    const html = marked.parse(content);
    contentTab.innerHTML = `<div class="markdown-content">${html}</div>`;

    // Apply syntax highlighting to code blocks
    this.highlightCodeBlocks(contentTab);
  }

  highlightCodeBlocks(container) {
    const codeBlocks = container.querySelectorAll("pre code");
    codeBlocks.forEach((block) => {
      // Add line numbers
      const lines = block.textContent.split("\n");
      const lineNumbers = lines.map((_, i) => i + 1).join("\n");

      const wrapper = document.createElement("div");
      wrapper.className = "code-block-wrapper";

      const lineNumDiv = document.createElement("div");
      lineNumDiv.className = "code-line-numbers";
      lineNumDiv.textContent = lineNumbers;

      const codeDiv = document.createElement("div");
      codeDiv.className = "code-content";
      codeDiv.appendChild(block.cloneNode(true));

      wrapper.appendChild(lineNumDiv);
      wrapper.appendChild(codeDiv);

      block.parentElement.replaceWith(wrapper);
    });
  }

  generateTOC(content) {
    if (!content) return;

    const tocList = document.querySelector("#previewTOC .toc-list");
    const headers = [];

    // Extract headers
    const lines = content.split("\n");
    lines.forEach((line, index) => {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2].trim();
        const id = text.toLowerCase().replace(/[^\w]+/g, "-");
        headers.push({ level, text, id, line: index });
      }
    });

    if (headers.length === 0) {
      document.getElementById("previewTOC").style.display = "none";
      return;
    }

    document.getElementById("previewTOC").style.display = "block";

    const html = headers
      .map(
        (h) => `
            <div class="toc-item toc-level-${h.level}" data-line="${h.line}">
                <a href="#${h.id}">${h.text}</a>
            </div>
        `,
      )
      .join("");

    tocList.innerHTML = html;

    // Add click handlers
    tocList.querySelectorAll(".toc-item a").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const targetId = link.getAttribute("href").substring(1);
        const target =
          document.getElementById(targetId) ||
          document.querySelector(`[name="${targetId}"]`);
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });
  }

  renderTags(resource) {
    const tagsContainer = document.getElementById("previewTags");
    const tags = resource.tags || [];

    if (tags.length === 0) {
      tagsContainer.innerHTML =
        '<span style="color: var(--text-muted);">None</span>';
      return;
    }

    tagsContainer.innerHTML = tags
      .map((tag) => `<span class="tag">${tag}</span>`)
      .join("");
  }

  async loadRelatedResources(resource) {
    const relatedTab = document.getElementById("previewRelatedTab");
    const relatedContainer = relatedTab.querySelector(".related-resources");

    relatedContainer.innerHTML =
      '<div class="preview-loading">Finding related resources...</div>';

    try {
      // Extract keywords from resource
      const keywords = this.extractKeywords(resource);
      const category = this.extractCategory(resource.uri);

      // Search for similar resources
      const query = keywords.slice(0, 3).join(" ");
      const results = await this.searchSimilarResources(query, category);

      if (results.length === 0) {
        relatedContainer.innerHTML =
          '<div class="preview-empty">No related resources found</div>';
        return;
      }

      const html = results
        .map(
          (r) => `
                <div class="related-item" data-uri="${r.uri}">
                    <span class="related-icon">${this.getCategoryIcon(this.extractCategory(r.uri))}</span>
                    <div class="related-info">
                        <div class="related-name">${r.name || r.id}</div>
                        <div class="related-category">${this.extractCategory(r.uri)}</div>
                    </div>
                    <span class="related-score">${r.score || ""}%</span>
                </div>
            `,
        )
        .join("");

      relatedContainer.innerHTML = html;

      // Add click handlers
      relatedContainer.querySelectorAll(".related-item").forEach((item) => {
        item.addEventListener("click", () => {
          this.loadResource(item.dataset.uri);
        });
      });
    } catch (error) {
      relatedContainer.innerHTML =
        '<div class="preview-error">Error loading related resources</div>';
    }
  }

  async searchSimilarResources(query, category) {
    // Use fuzzy search on loaded resources
    const resources = this.dashboard.resources || [];

    return resources
      .filter((r) => this.extractCategory(r.uri) === category)
      .filter((r) => r.uri !== this.currentResource.uri)
      .slice(0, 5);
  }

  extractKeywords(resource) {
    const text = (resource.content || resource.description || "").toLowerCase();
    const tags = resource.tags || [];
    const commonWords = new Set([
      "the",
      "a",
      "an",
      "and",
      "or",
      "but",
      "in",
      "on",
      "at",
      "to",
      "for",
    ]);

    const words = text
      .split(/\W+/)
      .filter((w) => w.length > 3 && !commonWords.has(w))
      .slice(0, 10);

    return [...new Set([...tags, ...words])];
  }

  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll(".preview-tab").forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.tab === tabName);
    });

    // Update tab content
    document.querySelectorAll(".preview-tab-content").forEach((content) => {
      content.classList.toggle(
        "active",
        content.id ===
          `preview${tabName.charAt(0).toUpperCase() + tabName.slice(1)}Tab`,
      );
    });

    // Load tab content if needed
    if (tabName === "metadata") {
      this.renderMetadataTab();
    }
  }

  renderMetadataTab() {
    const metadataTab = document.getElementById("previewMetadataTab");
    const json = JSON.stringify(this.currentResource, null, 2);
    metadataTab.querySelector(".preview-json").textContent = json;
  }

  copyURI() {
    const uri = this.currentResource?.uri;
    if (!uri) return;

    navigator.clipboard
      .writeText(uri)
      .then(() => {
        this.dashboard.showToast("URI copied to clipboard", "success");
      })
      .catch(() => {
        this.dashboard.showToast("Failed to copy URI", "error");
      });
  }

  openInModal() {
    const uri = this.currentResource?.uri;
    if (!uri) return;

    this.dashboard.openResourceModal(uri);
  }

  showError(message) {
    const contentTab = document.getElementById("previewContentTab");
    contentTab.innerHTML = `
            <div class="preview-error">
                <span class="error-icon">⚠️</span>
                <div class="error-message">${message}</div>
            </div>
        `;
  }

  // Helper methods
  extractCategory(uri) {
    const match = uri.match(/^orchestr8:\/\/([^/?]+)/);
    return match ? match[1] : "unknown";
  }

  extractNameFromURI(uri) {
    const parts = uri.split("/");
    return parts[parts.length - 1].replace(/-/g, " ");
  }

  getCategoryIcon(category) {
    const icons = {
      agents: "🤖",
      skills: "⚡",
      workflows: "🔄",
      patterns: "📐",
      examples: "📚",
      guides: "📖",
    };
    return icons[category] || "📄";
  }

  estimateTokens(text) {
    if (!text) return 0;
    // Rough estimate: ~4 chars per token
    return Math.ceil(text.length / 4);
  }
}

// Initialize when dashboard is ready
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    if (window.dashboard) {
      window.resourcePreview = new ResourcePreview(window.dashboard);
    }
  }, 100);
});
