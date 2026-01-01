# Market Game Results Viewer

A dark-mode web application to explore and compare results from a stock market simulation game. Built with Next.js 15, TypeScript, Tailwind CSS, and D3.js.

![Dashboard Preview](https://via.placeholder.com/800x400?text=Dashboard+Preview)

## Features

### Dashboard
- **Leaderboard** with sparkline trends and sortable columns
- **Net Worth Chart** showing all players over time
- **Summary Stats** including total prize pool, most active trader, and volatility metrics
- **Quick Stats** for trading strategies, win rates, and days at #1

### Player Detail Pages
- **Performance Chart** with interactive tooltips
- **Holdings Table** with gain/loss breakdown
- **Portfolio Allocation** donut chart
- **Transaction History** with filtering
- **Key Metrics** including Sharpe-like ratio, max drawdown, win streaks

### Compare View
- **Bump Chart** showing rank changes over time
- **Risk vs Return Scatter Plot** for strategy analysis
- **Strategy Comparison Table** with comprehensive metrics
- **Concentration Risk Analysis**

### Insights
- **Trading Activity Heatmap** (calendar view)
- **Records** (best/worst days, longest streaks)
- **Most Traded Symbols**
- **Day of Week Analysis**
- **Key Takeaways** summary

## Tech Stack

- **Framework**: Next.js 15 (App Router, Server Components)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (dark mode only)
- **Charts**: D3.js
- **CSV Parsing**: PapaParse
- **Package Manager**: Bun

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) >= 1.0

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd mw-game-results-viewer

# Install dependencies
bun install

# Start development server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
bun run build
bun run start
```

## Data Format

The app reads CSV files from the `data/` directory:

| File | Description |
|------|-------------|
| `Rankings - MREtest.csv` | Current leaderboard |
| `Portfolio Performance - {Name}.csv` | Daily net worth history |
| `Holdings - {Name}.csv` | Current portfolio positions |
| `Portfolio Transactions - {Name}.csv` | Trade history |

### Adding New Data

1. Export CSVs from your stock market game platform
2. Place files in the `data/` directory following the naming convention
3. Rebuild the app: `bun run build`

## Project Structure

```
src/
├── app/                    # Next.js pages
│   ├── page.tsx           # Dashboard
│   ├── compare/           # Comparison view
│   ├── insights/          # Analytics & insights
│   └── players/           # Player detail pages
├── components/
│   ├── charts/            # D3 chart components
│   ├── tables/            # Data tables
│   ├── cards/             # Stat cards
│   └── layout/            # Header, nav
└── lib/
    ├── data/              # CSV parsing & stats
    ├── types.ts           # TypeScript interfaces
    └── utils/             # Formatters
```

## License

MIT
