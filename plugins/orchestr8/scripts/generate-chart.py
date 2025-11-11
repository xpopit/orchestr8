#!/usr/bin/env python3
"""
Unified Chart Generation Script for Medium Articles and Documentation

Generates professional data visualization charts including comparisons, timelines,
distributions, and benchmarks.

Usage:
    python scripts/generate-chart.py --type comparison --data '{"Before": 200000, "After": 5000}' --title "Token Usage" --output medium/images/token-comparison.png
    python scripts/generate-chart.py --type cost --data '{"DALL-E": 0.06, "SD": 0.003, "Free": 0}' --output medium/images/cost.png
    python scripts/generate-chart.py --file medium/article.md --auto

Requirements:
    pip install matplotlib numpy
"""

import argparse
import json
import os
import re
import sys
from pathlib import Path

try:
    import matplotlib.patches as mpatches
    import matplotlib.pyplot as plt
    import numpy as np
except ImportError:
    print("Error: Required packages not installed")
    print("Run: pip install matplotlib numpy")
    sys.exit(1)

# Professional color palette
COLORS = {
    "primary": "#1168bd",
    "success": "#2d7a3e",
    "danger": "#d9534f",
    "warning": "#f39c12",
    "info": "#5bc0de",
    "neutral": "#999999",
    "purple": "#8e44ad",
    "yellow": "#f39c12",
}

COLOR_LIST = [
    COLORS["danger"],
    COLORS["success"],
    COLORS["primary"],
    COLORS["warning"],
    COLORS["info"],
    COLORS["purple"],
]


def setup_style():
    """Set up professional matplotlib styling"""
    plt.rcParams["font.family"] = "sans-serif"
    plt.rcParams["font.sans-serif"] = ["Arial", "Helvetica", "DejaVu Sans"]
    plt.rcParams["font.size"] = 11
    plt.rcParams["axes.linewidth"] = 1.5
    plt.rcParams["grid.alpha"] = 0.3
    plt.rcParams["grid.linestyle"] = "--"


def parse_data(data_str):
    """Parse data from command line argument or JSON"""
    try:
        return json.loads(data_str)
    except:
        # Try simple key:value,key:value format
        try:
            pairs = data_str.split(",")
            return {
                k.strip(): float(v.strip())
                for k, v in (pair.split(":") for pair in pairs)
            }
        except:
            print(f"Error: Cannot parse data: {data_str}")
            print("Expected format: JSON or 'Key1:Value1,Key2:Value2'")
            sys.exit(1)


def generate_comparison_chart(data, title, output, show_reduction=True):
    """Generate comparison bar chart with optional reduction annotation"""
    setup_style()

    categories = list(data.keys())
    values = list(data.values())
    colors = COLOR_LIST[: len(categories)]

    fig, ax = plt.subplots(figsize=(10, 6), dpi=150)

    # Create bars
    bars = ax.bar(
        categories, values, color=colors, width=0.6, edgecolor="white", linewidth=2
    )

    # Add value labels
    for bar in bars:
        height = bar.get_height()
        formatted = f"{int(height):,}" if height >= 1 else f"{height:.3f}"
        ax.text(
            bar.get_x() + bar.get_width() / 2.0,
            height,
            formatted,
            ha="center",
            va="bottom",
            fontsize=14,
            fontweight="bold",
        )

    # Add reduction annotation for 2-item comparisons
    if show_reduction and len(values) == 2 and values[0] > values[1]:
        reduction_pct = ((values[0] - values[1]) / values[0]) * 100
        reduction_val = values[0] - values[1]
        formatted_val = (
            f"{int(reduction_val):,}" if reduction_val >= 1 else f"{reduction_val:.3f}"
        )

        ax.text(
            0.5,
            max(values) * 0.55,
            f"{reduction_pct:.0f}% Reduction\n({formatted_val} saved)",
            ha="center",
            va="center",
            fontsize=18,
            fontweight="bold",
            bbox=dict(
                boxstyle="round,pad=0.8",
                facecolor="white",
                edgecolor=COLORS["primary"],
                linewidth=3,
            ),
        )

    # Styling
    ax.set_ylabel("Value", fontsize=13, fontweight="bold")
    ax.set_title(title, fontsize=16, fontweight="bold", pad=20)
    ax.set_ylim(0, max(values) * 1.2)
    ax.grid(axis="y", alpha=0.3, linestyle="--")
    ax.set_axisbelow(True)

    # Format y-axis
    ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f"{int(x):,}"))

    # Clean spines
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)

    plt.tight_layout()
    plt.savefig(output, dpi=150, bbox_inches="tight", facecolor="white")
    print(f"✓ Chart saved: {output}")


def generate_cost_chart(data, title, output):
    """Generate cost comparison chart"""
    setup_style()

    methods = list(data.keys())
    costs = list(data.values())
    colors = [COLORS["danger"], COLORS["warning"], COLORS["success"]][: len(methods)]

    fig, ax = plt.subplots(figsize=(10, 6), dpi=150)

    bars = ax.bar(
        methods, costs, color=colors, width=0.6, edgecolor="white", linewidth=2
    )

    # Add cost labels
    for bar in bars:
        height = bar.get_height()
        label = f"${height:.3f}" if height > 0 else "Free"
        ax.text(
            bar.get_x() + bar.get_width() / 2.0,
            height,
            label,
            ha="center",
            va="bottom",
            fontsize=14,
            fontweight="bold",
        )

    ax.set_ylabel("Cost ($)", fontsize=13, fontweight="bold")
    ax.set_title(
        title if title else "Cost Comparison", fontsize=16, fontweight="bold", pad=20
    )
    ax.set_ylim(0, max(costs) * 1.3 if max(costs) > 0 else 0.1)
    ax.grid(axis="y", alpha=0.3, linestyle="--")
    ax.set_axisbelow(True)

    # Add savings annotation if applicable
    if len(costs) >= 2 and costs[0] > costs[1]:
        savings_pct = ((costs[0] - costs[1]) / costs[0]) * 100
        ax.text(
            0.5,
            max(costs) * 0.5,
            f"{savings_pct:.0f}% cheaper",
            ha="center",
            fontsize=14,
            fontweight="bold",
            bbox=dict(boxstyle="round", facecolor=COLORS["success"], alpha=0.2),
        )

    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)

    plt.tight_layout()
    plt.savefig(output, dpi=150, bbox_inches="tight", facecolor="white")
    print(f"✓ Chart saved: {output}")


def generate_pie_chart(data, title, output):
    """Generate pie chart for distribution"""
    setup_style()

    labels = list(data.keys())
    sizes = list(data.values())
    colors = COLOR_LIST[: len(labels)]
    explode = [
        0.05 if i == 0 or i == len(labels) - 1 else 0 for i in range(len(labels))
    ]

    fig, ax = plt.subplots(figsize=(10, 8), dpi=150)

    wedges, texts, autotexts = ax.pie(
        sizes,
        explode=explode,
        labels=labels,
        colors=colors,
        autopct="%1.1f%%",
        startangle=90,
        textprops={"fontsize": 12},
    )

    # Style percentage text
    for autotext in autotexts:
        autotext.set_color("white")
        autotext.set_fontweight("bold")
        autotext.set_fontsize(13)

    # Style labels
    for text in texts:
        text.set_fontweight("bold")
        text.set_fontsize(12)

    ax.set_title(
        title if title else "Distribution", fontsize=16, fontweight="bold", pad=20
    )

    plt.tight_layout()
    plt.savefig(output, dpi=150, bbox_inches="tight", facecolor="white")
    print(f"✓ Chart saved: {output}")


def generate_multi_metric_chart(data, title, output):
    """Generate multi-metric comparison chart"""
    setup_style()

    # Expect data format: {"Method A": {"Metric 1": value, "Metric 2": value}, ...}
    methods = list(data.keys())
    all_metrics = list(data[methods[0]].keys())

    x = np.arange(len(methods))
    width = 0.8 / len(all_metrics)

    fig, ax = plt.subplots(figsize=(12, 6), dpi=150)

    colors = COLOR_LIST[: len(all_metrics)]

    for i, metric in enumerate(all_metrics):
        values = [data[method][metric] for method in methods]
        offset = width * (i - (len(all_metrics) - 1) / 2)
        bars = ax.bar(
            x + offset,
            values,
            width,
            label=metric,
            color=colors[i],
            edgecolor="white",
            linewidth=1.5,
        )

        # Add value labels
        for bar in bars:
            height = bar.get_height()
            ax.text(
                bar.get_x() + bar.get_width() / 2.0,
                height,
                f"{int(height)}",
                ha="center",
                va="bottom",
                fontsize=9,
                fontweight="bold",
            )

    ax.set_xlabel("Method", fontsize=13, fontweight="bold")
    ax.set_ylabel("Value", fontsize=13, fontweight="bold")
    ax.set_title(
        title if title else "Multi-Metric Comparison",
        fontsize=16,
        fontweight="bold",
        pad=20,
    )
    ax.set_xticks(x)
    ax.set_xticklabels(methods)
    ax.legend(loc="upper right", fontsize=11, framealpha=0.9)
    ax.grid(axis="y", alpha=0.3, linestyle="--")
    ax.set_axisbelow(True)

    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)

    plt.tight_layout()
    plt.savefig(output, dpi=150, bbox_inches="tight", facecolor="white")
    print(f"✓ Chart saved: {output}")


def extract_metrics_from_article(filepath):
    """Extract numeric metrics from article for automatic chart generation"""
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()

        metrics = {}

        # Look for token usage patterns
        token_match = re.search(
            r"(\d+,?\d*)\s*tokens?.*?to.*?(\d+,?\d*)\s*tokens?", content, re.IGNORECASE
        )
        if token_match:
            before = int(token_match.group(1).replace(",", ""))
            after = int(token_match.group(2).replace(",", ""))
            metrics["token_usage"] = {"Before": before, "After": after}

        # Look for cost patterns
        cost_match = re.search(r"\$?([\d.]+).*?to.*?\$?([\d.]+)", content)
        if cost_match:
            before = float(cost_match.group(1))
            after = float(cost_match.group(2))
            metrics["cost"] = {"Before": before, "After": after}

        # Look for percentage reduction
        pct_match = re.search(r"(\d+)%\s*reduction", content, re.IGNORECASE)
        if pct_match:
            metrics["reduction_pct"] = int(pct_match.group(1))

        return metrics
    except Exception as e:
        print(f"Error extracting metrics from {filepath}: {e}")
        return {}


def main():
    parser = argparse.ArgumentParser(
        description="Generate professional data visualization charts",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Token usage comparison
  python generate-chart.py --type comparison --data '{"Before": 200000, "After": 5000}' --title "Token Usage Reduction" --output medium/images/token-comparison.png

  # Cost comparison
  python generate-chart.py --type cost --data '{"DALL-E": 0.06, "Stable Diffusion": 0.003, "Free": 0}' --output medium/images/cost.png

  # Pie chart
  python generate-chart.py --type pie --data '{"Core": 35, "API": 25, "Data": 20, "Cache": 15, "Other": 5}' --title "Resource Distribution" --output chart.png

  # Auto-extract from article
  python generate-chart.py --file medium/article.md --auto --output-dir medium/images/
        """,
    )

    parser.add_argument(
        "--type",
        choices=["comparison", "cost", "pie", "multi-metric"],
        help="Chart type",
    )
    parser.add_argument("--data", help="Data in JSON format")
    parser.add_argument("--title", help="Chart title")
    parser.add_argument("--output", help="Output file path")
    parser.add_argument("--file", help="Extract metrics from markdown file")
    parser.add_argument(
        "--auto",
        action="store_true",
        help="Auto-generate charts from extracted metrics",
    )
    parser.add_argument(
        "--output-dir",
        default="medium/images",
        help="Output directory for auto-generated charts",
    )

    args = parser.parse_args()

    # Auto mode: extract and generate
    if args.auto and args.file:
        metrics = extract_metrics_from_article(args.file)
        if not metrics:
            print("No metrics found in article")
            sys.exit(1)

        os.makedirs(args.output_dir, exist_ok=True)

        if "token_usage" in metrics:
            output = os.path.join(args.output_dir, "token-comparison.png")
            generate_comparison_chart(
                metrics["token_usage"], "Token Usage: Before vs After", output
            )

        if "cost" in metrics:
            output = os.path.join(args.output_dir, "cost-comparison.png")
            generate_cost_chart(metrics["cost"], "Cost Comparison", output)

        print(f"\n✓ Auto-generated {len(metrics)} chart(s) in {args.output_dir}")
        return

    # Manual mode: generate specific chart
    if not args.type or not args.data or not args.output:
        parser.print_help()
        sys.exit(1)

    data = parse_data(args.data)

    # Create output directory if needed
    os.makedirs(os.path.dirname(args.output) or ".", exist_ok=True)

    if args.type == "comparison":
        generate_comparison_chart(data, args.title, args.output)
    elif args.type == "cost":
        generate_cost_chart(data, args.title, args.output)
    elif args.type == "pie":
        generate_pie_chart(data, args.title, args.output)
    elif args.type == "multi-metric":
        generate_multi_metric_chart(data, args.title, args.output)


if __name__ == "__main__":
    main()
