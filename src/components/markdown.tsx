import ReactMarkdown from "react-markdown";

export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose-study">
      <ReactMarkdown>{children}</ReactMarkdown>
    </div>
  );
}
