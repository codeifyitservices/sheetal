import React from "react";

type TiptapMark = {
  type: string;
  attrs?: Record<string, string>;
};

type TiptapNode = {
  type?: string;
  text?: string;
  attrs?: Record<string, any>;
  marks?: TiptapMark[];
  content?: TiptapNode[];
};

const renderChildren = (nodes: TiptapNode[] = [], keyPrefix: string) =>
  nodes.map((node, index) => renderNode(node, `${keyPrefix}-${index}`));

const withMarks = (
  children: React.ReactNode,
  marks: TiptapMark[] = [],
  key: string,
) =>
  marks.reduce((content, mark, index) => {
    const markKey = `${key}-mark-${index}`;

    if (mark.type === "bold") return <strong key={markKey}>{content}</strong>;
    if (mark.type === "italic") return <em key={markKey}>{content}</em>;
    if (mark.type === "underline") return <u key={markKey}>{content}</u>;
    if (mark.type === "strike") return <s key={markKey}>{content}</s>;
    if (mark.type === "code") return <code key={markKey}>{content}</code>;
    if (mark.type === "subscript") return <sub key={markKey}>{content}</sub>;
    if (mark.type === "superscript") return <sup key={markKey}>{content}</sup>;
    if (mark.type === "highlight") {
      return (
        <mark key={markKey} style={{ backgroundColor: mark.attrs?.color }}>
          {content}
        </mark>
      );
    }
    if (mark.type === "textStyle") {
      return (
        <span
          key={markKey}
          style={{
            color: mark.attrs?.color,
            fontSize: mark.attrs?.fontSize,
          }}
        >
          {content}
        </span>
      );
    }
    if (mark.type === "link") {
      return (
        <a
          key={markKey}
          href={mark.attrs?.href || "#"}
          target={mark.attrs?.target || undefined}
          rel={mark.attrs?.rel || "noopener noreferrer"}
        >
          {content}
        </a>
      );
    }

    return content;
  }, children);

const renderNode = (node: TiptapNode, key: string): React.ReactNode => {
  if (node.type === "text") return withMarks(node.text || "", node.marks, key);
  if (node.type === "hardBreak") return <br key={key} />;

  const children = renderChildren(node.content, key);
  const textAlign = node.attrs?.textAlign;
  const style = textAlign ? { textAlign } : undefined;

  switch (node.type) {
    case "doc":
      return <React.Fragment key={key}>{children}</React.Fragment>;
    case "paragraph":
      return <p key={key} style={style}>{children}</p>;
    case "heading": {
      const level = Math.min(Math.max(Number(node.attrs?.level || 2), 1), 6);
      return React.createElement(`h${level}`, { key, style }, children);
    }
    case "bulletList":
      return <ul key={key}>{children}</ul>;
    case "orderedList":
      return <ol key={key}>{children}</ol>;
    case "listItem":
      return <li key={key}>{children}</li>;
    case "taskList":
      return <ul key={key} data-type="taskList">{children}</ul>;
    case "taskItem":
      return (
        <li key={key} data-checked={node.attrs?.checked}>
          <label>
            <input type="checkbox" checked={Boolean(node.attrs?.checked)} readOnly />
          </label>
          <div>{children}</div>
        </li>
      );
    case "blockquote":
      return <blockquote key={key}>{children}</blockquote>;
    case "horizontalRule":
      return <hr key={key} />;
    case "image":
      return (
        <img
          key={key}
          src={node.attrs?.src || ""}
          alt={node.attrs?.alt || ""}
          title={node.attrs?.title || undefined}
        />
      );
    case "table":
      return <table key={key}><tbody>{children}</tbody></table>;
    case "tableRow":
      return <tr key={key}>{children}</tr>;
    case "tableHeader":
      return <th key={key}>{children}</th>;
    case "tableCell":
      return <td key={key}>{children}</td>;
    default:
      return <React.Fragment key={key}>{children}</React.Fragment>;
  }
};

export default function TiptapJsonRenderer({ content }: { content: unknown }) {
  if (!content) return null;

  if (typeof content === "string") {
    const trimmed = content.trim();
    if (trimmed.startsWith("{")) {
      try {
        const parsed = JSON.parse(trimmed);
        return <>{renderNode(parsed as TiptapNode, "root")}</>;
      } catch {
        return <div dangerouslySetInnerHTML={{ __html: content }} />;
      }
    }

    return <div dangerouslySetInnerHTML={{ __html: content }} />;
  }

  if (typeof content !== "object") return null;

  return <>{renderNode(content as TiptapNode, "root")}</>;
}
