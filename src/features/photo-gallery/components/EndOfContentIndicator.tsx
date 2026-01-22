import { Text, tokens } from "@fluentui/react-components";

interface EndOfContentIndicatorProps {
  type: "projects" | "photos";
  totalItems: number;
}

export function EndOfContentIndicator({ type, totalItems }: EndOfContentIndicatorProps) {
  const isProjects = type === "projects";
  const title = isProjects ? "Fim dos projetos" : "Fim das fotos";
  const label = isProjects ? "projeto" : "foto";
  const suffix = totalItems !== 1 ? "s" : "";

  return (
    <div
      className="flex items-center gap-3"
      style={{
        padding: "12px 16px",
        borderRadius: "8px",
        backgroundColor: tokens.colorNeutralBackground2,
        border: `1px solid ${tokens.colorNeutralStroke2}`,
      }}
    >
      <div style={{ fontSize: "20px" }}>{isProjects ? "🏁" : "📸"}</div>
      <div>
        <Text weight="semibold" block>
          {title}
        </Text>
        <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>
          {totalItems} {label}
          {suffix} carregada{suffix}
        </Text>
      </div>
    </div>
  );
}
