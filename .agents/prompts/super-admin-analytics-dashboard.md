# Super Admin Analytics Dashboard — Agent Prompt

Tag: `@.agents/skills/frontend-design/SKILL.md`

## Constraints

- Follow `src/modules/super-admin/` module architecture only
- Theme: `src/index.css` CSS variables + shadcn tokens — **no inline styles**, no hardcoded hex colors in chart config
- Use existing EvilCharts at `src/components/evilcharts/` — **do not duplicate** chart wrappers
- Reusable components live in `src/modules/super-admin/components/dashboard/`
- Domain data only (tenants, MRR, subscriptions, CRM, active users, system utilization) — never browser/device demo data

## Chart color mapping

Use `CHART_COLORS` from `src/modules/super-admin/data/analytics-dashboard.js`:

```js
colors: CHART_COLORS.chart1 // maps to oklch(var(--chart-1)), --primary, --secondary, etc.
```

## Component map

| Section | Component | EvilChart |
|---------|-----------|-----------|
| Stats row | `StatCard` | — |
| Revenue + plan mix | `DashboardSection` → `RevenueAnalyticsChart`, `TenantDistributionChart` | `EvilLineChart`, `EvilPieChart` |
| Growth | `SubscriptionGrowthChart`, `TenantStatusChart` | `EvilAreaChart`, `EvilBarChart` |
| System health | `SystemHealthRadialChart` | `EvilRadialChart` |
| Shell | `AnalyticsChartCard`, `DashboardAnalytics` | — |

## Adding a new chart

1. Add data + `ChartConfig` in `data/analytics-dashboard.js`
2. Create `components/dashboard/MyChart.jsx` using EvilCharts primitives (import from `@/components/evilcharts/charts/*`)
3. Wrap with `AnalyticsChartCard` only — no second wrapper layer
4. Register in `DashboardAnalytics.jsx`

## Example pattern (line chart)

```jsx
import { EvilLineChart, Line, XAxis, Legend, Tooltip, Dot, ActiveDot } from "@/components/evilcharts/charts/line-chart";
import AnalyticsChartCard from "./AnalyticsChartCard";
import { MY_DATA, MY_CONFIG } from "../../data/analytics-dashboard";

export default function MyChart() {
  return (
    <AnalyticsChartCard title="..." description="..." contentClassName="h-[320px] min-h-[280px] p-0">
      <EvilLineChart data={MY_DATA} config={MY_CONFIG} className="h-full w-full p-4" xDataKey="month">
        <XAxis dataKey="month" />
        <Legend isClickable />
        <Tooltip />
        <Line dataKey="seriesKey" strokeVariant="solid" isClickable>
          <Dot variant="border" />
          <ActiveDot variant="colored-border" />
        </Line>
      </EvilLineChart>
    </AnalyticsChartCard>
  );
}
```
