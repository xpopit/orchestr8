---
id: data-chart-generation
category: skill
tags: [charts, data-visualization, matplotlib, chartjs, comparison, metrics, performance, medium-images]
capabilities:
  - Generate professional comparison charts (before/after, A vs B)
  - Create performance metric visualizations (time series, distributions)
  - Produce cost analysis and ROI charts
  - Build benchmark result visualizations
  - Generate token usage, memory, and performance comparisons
  - Create web-optimized PNG charts for Medium articles
useWhen:
  - Visualizing performance improvements or comparisons
  - Showing cost savings or ROI metrics
  - Illustrating token usage, memory, or resource optimization
  - Creating data-driven content for Medium articles
  - Supporting technical claims with visual evidence
  - Generating benchmark result visualizations
estimatedTokens: 900
---

# Data Chart Generation

Create professional, publication-quality charts for technical articles, documentation, and Medium publications using Python (Matplotlib) or JavaScript (Chart.js).

## Overview

**Why Charts Matter:**
- 63% higher engagement on articles with data visualizations
- Complex data becomes immediately understandable
- Builds credibility with specific, visualized metrics
- Makes technical content accessible to broader audiences

**Output Requirements:**
- High resolution (300 DPI for print, 150 DPI for web)
- Professional color schemes
- Clear labels and legends
- Optimized file sizes (<500KB for charts)
- PNG format with transparency support

## Technology Stack

### Option 1: Python + Matplotlib (Recommended)

**Pros:**
- Full control over appearance
- Professional, publication-quality output
- Extensive customization options
- Great for complex visualizations
- Large ecosystem of extensions

**Setup:**
```bash
pip install matplotlib numpy pandas seaborn
```

### Option 2: JavaScript + Chart.js

**Pros:**
- Web-native, interactive capabilities
- Easier integration with web apps
- Modern, clean aesthetic
- Good for simple charts

**Setup:**
```bash
npm install chart.js canvas chartjs-node-canvas
```

### Option 3: Mermaid Charts

**Pros:**
- Markdown-native
- No dependencies
- Version control friendly
- Quick for simple visualizations

**Cons:**
- Limited customization
- Basic chart types only

## Common Chart Types

### 1. Comparison Bar Charts

**Use Case**: Before/after, Method A vs Method B, multiple options comparison

**Example: Token Usage Comparison**

```python
#!/usr/bin/env python3
"""
Generate token usage comparison chart
Usage: python generate-chart.py --type token-comparison --output medium/images/
"""

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import numpy as np

def generate_token_comparison():
    # Data
    categories = ['Traditional\nApproach', 'On-Demand\nLoading']
    values = [200000, 5000]
    colors = ['#d9534f', '#2d7a3e']  # Red for old, Green for new
    
    # Create figure
    fig, ax = plt.subplots(figsize=(10, 6), dpi=150)
    
    # Create bars
    bars = ax.bar(categories, values, color=colors, width=0.6, edgecolor='white', linewidth=2)
    
    # Add value labels on bars
    for bar in bars:
        height = bar.get_height()
        ax.text(bar.get_x() + bar.get_width()/2., height,
                f'{int(height):,} tokens',
                ha='center', va='bottom', fontsize=14, fontweight='bold')
    
    # Calculate and show reduction
    reduction_pct = ((values[0] - values[1]) / values[0]) * 100
    reduction_tokens = values[0] - values[1]
    
    # Add reduction annotation
    ax.text(0.5, max(values) * 0.55, 
            f'{reduction_pct:.0f}% Reduction\n({reduction_tokens:,} tokens saved)',
            ha='center', va='center', fontsize=18, fontweight='bold',
            bbox=dict(boxstyle='round,pad=0.8', facecolor='white', 
                     edgecolor='#1168bd', linewidth=3))
    
    # Styling
    ax.set_ylabel('Token Count', fontsize=13, fontweight='bold')
    ax.set_title('Token Usage: Traditional vs On-Demand Loading', 
                 fontsize=16, fontweight='bold', pad=20)
    ax.set_ylim(0, max(values) * 1.2)
    ax.grid(axis='y', alpha=0.3, linestyle='--')
    ax.set_axisbelow(True)
    
    # Format y-axis with commas
    ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f'{int(x):,}'))
    
    # Remove top and right spines
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    
    plt.tight_layout()
    plt.savefig('token-comparison.png', dpi=150, bbox_inches='tight', 
                facecolor='white', transparent=False)
    print("✓ Chart saved: token-comparison.png")

if __name__ == '__main__':
    generate_token_comparison()
```

### 2. Cost Comparison Charts

**Example: Cost Savings Visualization**

```python
import matplotlib.pyplot as plt
import numpy as np

def generate_cost_comparison():
    methods = ['DALL-E 3', 'Stable Diffusion\n(Replicate)', 'Gradient\nFallback']
    costs = [0.06, 0.003, 0]  # Cost per image in dollars
    colors = ['#e74c3c', '#f39c12', '#2ecc71']
    
    fig, ax = plt.subplots(figsize=(10, 6), dpi=150)
    
    bars = ax.bar(methods, costs, color=colors, width=0.6, edgecolor='white', linewidth=2)
    
    # Add cost labels
    for bar in bars:
        height = bar.get_height()
        label = f'${height:.3f}' if height > 0 else 'Free'
        ax.text(bar.get_x() + bar.get_width()/2., height,
                label, ha='center', va='bottom', fontsize=14, fontweight='bold')
    
    ax.set_ylabel('Cost per Image ($)', fontsize=13, fontweight='bold')
    ax.set_title('Hero Image Generation: Cost Comparison', 
                 fontsize=16, fontweight='bold', pad=20)
    ax.set_ylim(0, max(costs) * 1.3)
    ax.grid(axis='y', alpha=0.3, linestyle='--')
    ax.set_axisbelow(True)
    
    # Add savings annotation
    savings_pct = ((costs[0] - costs[1]) / costs[0]) * 100
    ax.text(1.5, max(costs) * 0.5, 
            f'{savings_pct:.0f}% cheaper\nthan DALL-E',
            ha='center', fontsize=12,
            bbox=dict(boxstyle='round', facecolor='#2ecc71', alpha=0.2))
    
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    
    plt.tight_layout()
    plt.savefig('cost-comparison.png', dpi=150, bbox_inches='tight', facecolor='white')
    print("✓ Chart saved: cost-comparison.png")
```

### 3. Time Series Charts

**Example: Performance Over Time**

```python
import matplotlib.pyplot as plt
import numpy as np
from datetime import datetime, timedelta

def generate_performance_timeline():
    # Generate sample data
    start_date = datetime(2025, 1, 1)
    dates = [start_date + timedelta(days=i) for i in range(30)]
    
    # Before optimization (high, variable)
    before = np.random.normal(15000, 2000, 15)
    # After optimization (low, stable)
    after = np.random.normal(750, 100, 15)
    
    # Combine
    values = np.concatenate([before, after])
    
    fig, ax = plt.subplots(figsize=(12, 6), dpi=150)
    
    # Plot line
    ax.plot(dates[:15], before, color='#d9534f', linewidth=2, marker='o', 
            markersize=6, label='Before Optimization')
    ax.plot(dates[15:], after, color='#2d7a3e', linewidth=2, marker='o', 
            markersize=6, label='After Optimization')
    
    # Add vertical line at optimization point
    ax.axvline(x=dates[15], color='#1168bd', linestyle='--', linewidth=2, alpha=0.7)
    ax.text(dates[15], max(before) * 0.9, 'Optimization\nDeployed', 
            ha='center', fontsize=11, fontweight='bold',
            bbox=dict(boxstyle='round', facecolor='white', edgecolor='#1168bd'))
    
    ax.set_xlabel('Date', fontsize=13, fontweight='bold')
    ax.set_ylabel('Query Time (ms)', fontsize=13, fontweight='bold')
    ax.set_title('Performance Improvement: Query Response Time', 
                 fontsize=16, fontweight='bold', pad=20)
    
    ax.grid(alpha=0.3, linestyle='--')
    ax.legend(loc='upper right', fontsize=11, framealpha=0.9)
    
    # Format x-axis dates
    ax.tick_params(axis='x', rotation=45)
    
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    
    plt.tight_layout()
    plt.savefig('performance-timeline.png', dpi=150, bbox_inches='tight', facecolor='white')
    print("✓ Chart saved: performance-timeline.png")
```

### 4. Distribution Charts

**Example: Resource Allocation Pie Chart**

```python
import matplotlib.pyplot as plt

def generate_resource_distribution():
    # Data
    resources = ['Core Logic', 'API Handlers', 'Data Access', 'Caching', 'Other']
    sizes = [35, 25, 20, 15, 5]
    colors = ['#1168bd', '#5bc0de', '#2d7a3e', '#d9534f', '#999999']
    explode = (0.05, 0, 0, 0.05, 0)  # Highlight important slices
    
    fig, ax = plt.subplots(figsize=(10, 8), dpi=150)
    
    wedges, texts, autotexts = ax.pie(sizes, explode=explode, labels=resources,
                                        colors=colors, autopct='%1.1f%%',
                                        startangle=90, textprops={'fontsize': 12})
    
    # Make percentage text bold
    for autotext in autotexts:
        autotext.set_color('white')
        autotext.set_fontweight('bold')
        autotext.set_fontsize(13)
    
    # Make labels bold
    for text in texts:
        text.set_fontweight('bold')
        text.set_fontsize(12)
    
    ax.set_title('Resource Allocation: Code Distribution', 
                 fontsize=16, fontweight='bold', pad=20)
    
    plt.tight_layout()
    plt.savefig('resource-distribution.png', dpi=150, bbox_inches='tight', 
                facecolor='white', transparent=False)
    print("✓ Chart saved: resource-distribution.png")
```

### 5. Multi-Series Comparison

**Example: Benchmark Results**

```python
import matplotlib.pyplot as plt
import numpy as np

def generate_benchmark_comparison():
    methods = ['Method A', 'Method B', 'Method C', 'Method D']
    metrics = {
        'Speed (ms)': [150, 85, 120, 60],
        'Memory (MB)': [45, 32, 38, 28],
        'CPU (%)': [65, 40, 55, 35]
    }
    
    x = np.arange(len(methods))
    width = 0.25
    
    fig, ax = plt.subplots(figsize=(12, 6), dpi=150)
    
    colors = ['#1168bd', '#2d7a3e', '#f39c12']
    
    for i, (metric, values) in enumerate(metrics.items()):
        offset = width * (i - 1)
        bars = ax.bar(x + offset, values, width, label=metric, 
                      color=colors[i], edgecolor='white', linewidth=1.5)
        
        # Add value labels
        for bar in bars:
            height = bar.get_height()
            ax.text(bar.get_x() + bar.get_width()/2., height,
                    f'{int(height)}',
                    ha='center', va='bottom', fontsize=10, fontweight='bold')
    
    ax.set_xlabel('Method', fontsize=13, fontweight='bold')
    ax.set_ylabel('Value', fontsize=13, fontweight='bold')
    ax.set_title('Performance Benchmark: Multiple Metrics Comparison', 
                 fontsize=16, fontweight='bold', pad=20)
    ax.set_xticks(x)
    ax.set_xticklabels(methods)
    ax.legend(loc='upper right', fontsize=11, framealpha=0.9)
    ax.grid(axis='y', alpha=0.3, linestyle='--')
    ax.set_axisbelow(True)
    
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    
    plt.tight_layout()
    plt.savefig('benchmark-comparison.png', dpi=150, bbox_inches='tight', facecolor='white')
    print("✓ Chart saved: benchmark-comparison.png")
```

## Unified Chart Generation Script

Create `scripts/generate-chart.py` for easy chart generation:

```python
#!/usr/bin/env python3
"""
Unified chart generation script
Usage: python scripts/generate-chart.py --type [chart-type] --data [data] --output [path]
"""

import argparse
import json
import matplotlib.pyplot as plt
import numpy as np

def parse_data(data_str):
    """Parse data from command line argument"""
    try:
        return json.loads(data_str)
    except:
        # Try simple key:value format
        pairs = data_str.split(',')
        return {k.strip(): float(v.strip()) for k, v in 
                (pair.split(':') for pair in pairs)}

def generate_comparison(data, title, output):
    """Generate comparison bar chart"""
    categories = list(data.keys())
    values = list(data.values())
    colors = ['#d9534f', '#2d7a3e', '#1168bd', '#f39c12'][:len(categories)]
    
    fig, ax = plt.subplots(figsize=(10, 6), dpi=150)
    bars = ax.bar(categories, values, color=colors, width=0.6)
    
    for bar in bars:
        height = bar.get_height()
        ax.text(bar.get_x() + bar.get_width()/2., height,
                f'{int(height):,}',
                ha='center', va='bottom', fontsize=12, fontweight='bold')
    
    ax.set_title(title, fontsize=16, fontweight='bold', pad=20)
    ax.grid(axis='y', alpha=0.3, linestyle='--')
    ax.set_axisbelow(True)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    
    plt.tight_layout()
    plt.savefig(output, dpi=150, bbox_inches='tight', facecolor='white')
    print(f"✓ Chart saved: {output}")

def main():
    parser = argparse.ArgumentParser(description='Generate data visualization charts')
    parser.add_argument('--type', required=True, 
                       choices=['comparison', 'timeline', 'pie', 'benchmark'],
                       help='Chart type')
    parser.add_argument('--data', required=True, help='Data in JSON or key:value format')
    parser.add_argument('--title', default='Data Comparison', help='Chart title')
    parser.add_argument('--output', default='chart.png', help='Output file path')
    
    args = parser.parse_args()
    
    data = parse_data(args.data)
    
    if args.type == 'comparison':
        generate_comparison(data, args.title, args.output)
    # Add other types as needed
    
if __name__ == '__main__':
    main()
```

## Professional Styling Tips

### Color Palettes

**Professional (default)**:
```python
colors = {
    'primary': '#1168bd',    # Blue
    'success': '#2d7a3e',    # Green
    'danger': '#d9534f',     # Red
    'warning': '#f39c12',    # Orange
    'info': '#5bc0de',       # Light Blue
    'neutral': '#999999'     # Gray
}
```

**Vibrant**:
```python
colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6']
```

**Monochrome**:
```python
colors = ['#2c3e50', '#34495e', '#7f8c8d', '#95a5a6', '#bdc3c7']
```

### Typography
```python
plt.rcParams['font.family'] = 'sans-serif'
plt.rcParams['font.sans-serif'] = ['Arial', 'Helvetica', 'DejaVu Sans']
plt.rcParams['font.size'] = 11
plt.rcParams['font.weight'] = 'normal'
```

### Grid and Spines
```python
# Clean minimal style
ax.grid(axis='y', alpha=0.3, linestyle='--', linewidth=0.8)
ax.set_axisbelow(True)  # Grid behind bars
ax.spines['top'].set_visible(False)
ax.spines['right'].set_visible(False)
ax.spines['left'].set_linewidth(1.5)
ax.spines['bottom'].set_linewidth(1.5)
```

## Best Practices

1. **High Resolution**: 150 DPI for web, 300 DPI for print
2. **Clear Labels**: No abbreviations, descriptive axis labels
3. **Readable Fonts**: Minimum 10pt, bold for emphasis
4. **Color Accessibility**: Use patterns/textures for colorblind users
5. **White Space**: Don't cram too much data
6. **Professional Colors**: Avoid neon, use muted professional palette
7. **Source Attribution**: Add data source in subtitle or footer
8. **Optimize Files**: Compress PNG without losing quality
9. **Test Sizes**: Verify readability at thumbnail size
10. **Consistent Style**: Match visual style across all charts

## Optimization

### File Size Reduction
```python
# Optimize for web
plt.savefig('chart.png', dpi=150, bbox_inches='tight', 
            optimize=True, facecolor='white')

# Or use external tool
# pngquant chart.png --quality=85-95 --output chart-optimized.png
```

### Responsive Sizing
```python
# For different contexts
sizes = {
    'hero': (19.20, 10.80),  # 1920x1080 for hero images
    'inline': (12, 6),        # Standard inline chart
    'thumbnail': (8, 6),      # Smaller charts
    'square': (10, 10)        # Square for social media
}

fig, ax = plt.subplots(figsize=sizes['inline'], dpi=150)
```

## Integration with Medium Workflow

```python
# In Phase 3 of visualization generation:

# 1. Extract metrics from article content
metrics = extract_metrics_from_article('medium/article.md')

# 2. Generate relevant charts
if 'token_usage' in metrics:
    generate_token_comparison(metrics['token_usage'])

if 'cost_savings' in metrics:
    generate_cost_comparison(metrics['cost_savings'])

# 3. Save to medium/images/
# 4. Update article with image references
# 5. Generate captions and alt text
```

---

**With these tools, you can create publication-quality charts that make technical content engaging and credible!**
