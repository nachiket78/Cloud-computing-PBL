import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { label } from "../lib/constants.js";
import { useReducedMotion } from "../lib/motion.js";

function readToken(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function SeverityChart({ incidents }) {
  const reduce = useReducedMotion();
  const [colors, setColors] = useState({ low: "#5e6573", medium: "#b45309", high: "#b42318", grid: "#e4e7ec", text: "#5e6573", surface: "#ffffff", border: "#e4e7ec" });

  useEffect(() => {
    const read = () => {
      setColors({
        low: readToken("--chart-low"),
        medium: readToken("--chart-medium"),
        high: readToken("--chart-high"),
        grid: readToken("--chart-grid"),
        text: readToken("--text-secondary"),
        surface: readToken("--surface"),
        border: readToken("--border"),
      });
    };
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  const data = ["low", "medium", "high"].map((severity) => ({
    severity,
    label: label(severity),
    count: incidents.filter((item) => item.severity === severity).length,
    fill: colors[severity],
  }));

  return (
    <div className="chart-body">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barSize={28} margin={{ top: 8, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={colors.grid} />
          <XAxis dataKey="label" tick={{ fill: colors.text, fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fill: colors.text, fontSize: 12 }} axisLine={false} tickLine={false} width={36} />
          <Tooltip
            cursor={{ fill: "transparent" }}
            contentStyle={{
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: 10,
              fontSize: 13,
              color: colors.text,
            }}
            formatter={(value) => [value, "Cases"]}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]} isAnimationActive={!reduce} animationDuration={240}>
            {data.map((entry) => (
              <Cell key={entry.severity} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
