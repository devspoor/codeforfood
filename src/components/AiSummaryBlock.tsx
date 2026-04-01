interface Props {
  summary: string;
  generatedAt?: string;
}

export function AiSummaryBlock({ summary, generatedAt }: Props) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
          AI Summary
        </h2>
        <span className="text-xs bg-accent/10 text-accent px-1.5 py-0.5 rounded">
          0G
        </span>
      </div>
      <div className="text-sm whitespace-pre-wrap leading-relaxed">
        {summary}
      </div>
      {generatedAt && (
        <p className="text-xs text-muted mt-3">
          Updated {new Date(generatedAt).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}
