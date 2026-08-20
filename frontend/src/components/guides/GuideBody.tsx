import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";

export function GuideBody({ body }: { body: string }) {
  return (
    <div className="prose prose-neutral max-w-none text-neutral-800 prose-a:text-navy prose-headings:text-navy">
      <ReactMarkdown
        rehypePlugins={[rehypeSanitize]}
        components={{
          a: ({ href, children }) => (
            <a href={href} rel="noopener noreferrer nofollow" target="_blank">
              {children}
            </a>
          ),
        }}
      >
        {body}
      </ReactMarkdown>
    </div>
  );
}
