// GitHub PR Comment Copier - Content Script
import "./styles.css";

interface CommentData {
    author: string;
    content: string;
    file?: string;
    line?: string;
    code?: string;
}

interface ThreadData {
    file?: string;
    line?: string;
    code?: string;
    comments: Array<{
        author: string;
        content: string;
        timestamp?: string;
    }>;
}

function escapeXML(str: string): string {
    if (!str) return "";
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

function formatCommentAsXML(commentData: CommentData): string {
    let xml = "";
    xml += "<comment>\n";
    xml += `  <author>${escapeXML(commentData.author)}</author>\n`;

    if (commentData.file) {
        xml += `  <file>${escapeXML(commentData.file)}</file>\n`;
    }
    if (commentData.line) {
        xml += `  <line>${escapeXML(commentData.line)}</line>\n`;
    }

    if (commentData.code) {
        xml += `  <code>\n${escapeXML(commentData.code)}\n  </code>\n`;
    }

    xml += `  <content>${escapeXML(commentData.content)}</content>\n`;
    xml += "</comment>";

    return xml;
}

function formatThreadAsXML(threadData: ThreadData): string {
    let xml = "<thread>\n";

    if (threadData.file) {
        xml += `  <file>${escapeXML(threadData.file)}</file>\n`;
    }
    if (threadData.line) {
        xml += `  <line>${escapeXML(threadData.line)}</line>\n`;
    }

    if (threadData.code) {
        xml += `  <code>\n${escapeXML(threadData.code)}\n  </code>\n`;
    }

    xml += "  <comments>\n";
    threadData.comments.forEach((comment) => {
        xml += "    <comment>\n";
        xml += `      <author>${escapeXML(comment.author)}</author>\n`;
        if (comment.timestamp) {
            xml += `      <timestamp>${escapeXML(comment.timestamp)}</timestamp>\n`;
        }
        xml += `      <content>${escapeXML(comment.content)}</content>\n`;
        xml += "    </comment>\n";
    });
    xml += "  </comments>\n";
    xml += "</thread>";

    return xml;
}

function extractThreadData(commentElement: Element): ThreadData | null {
    const reviewThread = commentElement.closest(
        ".review-thread-component, .js-resolvable-timeline-thread-container",
    );

    if (!reviewThread) return null;

    const threadData: ThreadData = {
        comments: [],
    };

    // Extract file path
    const fileLink = reviewThread.querySelector(
        'a.text-mono, a[href*="/files/"]',
    );
    if (fileLink) {
        threadData.file = fileLink.textContent?.trim() || "";
    }

    // Extract code from diff table
    const diffTable = reviewThread.querySelector(".diff-table");
    if (diffTable) {
        const codeLines: string[] = [];
        const rows = diffTable.querySelectorAll("tr");

        rows.forEach((row) => {
            const lineNumCell = row.querySelector("td[data-line-number]");
            const codeCell = row.querySelector("td.blob-code");

            if (lineNumCell && codeCell) {
                const lineNum = lineNumCell.getAttribute("data-line-number");
                const codeText = codeCell.textContent?.trim() || "";

                if (lineNum) {
                    codeLines.push(`${lineNum}: ${codeText}`);
                }
            }
        });

        if (codeLines.length > 0) {
            threadData.code = codeLines.join("\n");
            // Use the last line number
            const lastLine = codeLines[codeLines.length - 1];
            const lineMatch = lastLine.match(/^(\d+):/);
            if (lineMatch) {
                threadData.line = lineMatch[1];
            }
        }
    }

    // Extract all comments in the thread
    const commentElements = reviewThread.querySelectorAll(
        ".review-comment, .timeline-comment",
    );

    commentElements.forEach((comment) => {
        const author =
            comment.querySelector(".author")?.textContent?.trim() || "Unknown";
        const bodyEl = comment.querySelector(".comment-body");
        const content = bodyEl?.textContent?.trim() || "";

        if (content) {
            const timestamp =
                comment
                    .querySelector("relative-time")
                    ?.getAttribute("datetime") || "";

            threadData.comments.push({
                author,
                content,
                timestamp,
            });
        }
    });

    return threadData.comments.length > 0 ? threadData : null;
}

async function copyCommentToClipboard(
    button: HTMLButtonElement,
    commentData: CommentData,
): Promise<void> {
    try {
        const xml = formatCommentAsXML(commentData);
        await navigator.clipboard.writeText(xml);

        // Success feedback
        const originalText = button.textContent;
        button.textContent = "✓";
        button.style.backgroundColor = "#28a745";
        setTimeout(() => {
            button.textContent = originalText;
            button.style.backgroundColor = "#0969da";
        }, 1500);
    } catch (err) {
        console.error("Failed to copy:", err);
        button.textContent = "✗";
        setTimeout(() => {
            button.textContent = "Copy";
        }, 1500);
    }
}

async function copyThreadToClipboard(
    button: HTMLButtonElement,
    threadData: ThreadData,
): Promise<void> {
    try {
        const xml = formatThreadAsXML(threadData);
        await navigator.clipboard.writeText(xml);

        // Success feedback
        const originalText = button.textContent;
        button.textContent = "✓";
        button.style.backgroundColor = "#28a745";
        setTimeout(() => {
            button.textContent = originalText;
            button.style.backgroundColor = "#0969da";
        }, 1500);
    } catch (err) {
        console.error("Failed to copy:", err);
        button.textContent = "✗";
        setTimeout(() => {
            button.textContent = "Copy";
        }, 1500);
    }
}

function addCopyButtonToComment(
    commentElement: Element,
    isReview = false,
): void {
    // Check if button already exists
    if (commentElement.querySelector(".pr-comment-copy-btn")) {
        return;
    }

    const author =
        commentElement.querySelector(".author")?.textContent?.trim() ||
        "Unknown";
    const bodyEl = commentElement.querySelector(".comment-body");
    const content = bodyEl?.textContent?.trim() || "";

    if (!content) return;

    // For review comments, try to extract thread data first
    let threadData: ThreadData | null = null;
    if (isReview) {
        threadData = extractThreadData(commentElement);
    }

    // If we have thread data with multiple comments, use thread copying
    if (threadData && threadData.comments.length > 1) {
        // Create button for thread copying
        const button = document.createElement("button");
        button.textContent = "Copy";
        button.className = "pr-comment-copy-btn";
        button.onclick = (e) => {
            e.preventDefault();
            copyThreadToClipboard(button, threadData!);
        };

        // Find best place to insert button
        const commentActions = commentElement.querySelector(
            ".timeline-comment-actions, .comment-actions",
        );
        if (commentActions) {
            commentActions.appendChild(button);
        } else {
            // Fallback: prepend to comment header
            const header = commentElement.querySelector(
                ".timeline-comment-header, .review-comment-contents",
            );
            if (header && header instanceof HTMLElement) {
                header.style.position = "relative";
                button.style.position = "absolute";
                button.style.right = "10px";
                button.style.top = "10px";
                header.appendChild(button);
            }
        }
        return;
    }

    // Otherwise, use single comment copying
    const commentData: CommentData = {
        author: author,
        content: content,
    };

    // Extract file/line for review comments
    if (isReview && threadData) {
        commentData.file = threadData.file;
        commentData.line = threadData.line;
        commentData.code = threadData.code;
    } else if (isReview) {
        // Fallback extraction if thread data didn't work
        const reviewThread = commentElement.closest(
            ".review-thread-component, .js-resolvable-timeline-thread-container",
        );

        if (reviewThread) {
            const fileLink = reviewThread.querySelector(
                'a.text-mono, a[href*="/files/"]',
            );
            if (fileLink) {
                commentData.file = fileLink.textContent?.trim() || "";
            }
        }

        if (!commentData.file) {
            const diffFile = commentElement.closest(
                ".js-file, [data-path], .file",
            );
            if (diffFile) {
                commentData.file =
                    diffFile.getAttribute("data-path") ||
                    diffFile.getAttribute("data-file-path") ||
                    diffFile
                        .querySelector(".file-info a")
                        ?.textContent?.trim() ||
                    diffFile
                        .querySelector("[data-path]")
                        ?.getAttribute("data-path") ||
                    "";
            }
        }

        const diffTable =
            reviewThread?.querySelector(".diff-table") ||
            commentElement.closest("table.diff-table");
        if (diffTable) {
            const codeLines: string[] = [];
            const rows = diffTable.querySelectorAll("tr");

            rows.forEach((row) => {
                const lineNumCell = row.querySelector("td[data-line-number]");
                const codeCell = row.querySelector("td.blob-code");

                if (lineNumCell && codeCell) {
                    const lineNum =
                        lineNumCell.getAttribute("data-line-number");
                    const codeText = codeCell.textContent?.trim() || "";

                    if (lineNum) {
                        codeLines.push(`${lineNum}: ${codeText}`);
                    }
                }
            });

            if (codeLines.length > 0) {
                commentData.code = codeLines.join("\n");
                const lastLine = codeLines[codeLines.length - 1];
                const lineMatch = lastLine.match(/^(\d+):/);
                if (lineMatch) {
                    commentData.line = lineMatch[1];
                }
            }
        }
    }

    // Create button
    const button = document.createElement("button");
    button.textContent = "Copy";
    button.className = "pr-comment-copy-btn";
    button.onclick = (e) => {
        e.preventDefault();
        copyCommentToClipboard(button, commentData);
    };

    // Find best place to insert button
    const commentActions = commentElement.querySelector(
        ".timeline-comment-actions, .comment-actions",
    );
    if (commentActions) {
        commentActions.appendChild(button);
    } else {
        // Fallback: prepend to comment header
        const header = commentElement.querySelector(
            ".timeline-comment-header, .review-comment-contents",
        );
        if (header && header instanceof HTMLElement) {
            header.style.position = "relative";
            button.style.position = "absolute";
            button.style.right = "10px";
            button.style.top = "10px";
            header.appendChild(button);
        }
    }
}

function addCopyButtonsToAllComments(): void {
    // Conversation comments
    document.querySelectorAll(".timeline-comment").forEach((comment) => {
        addCopyButtonToComment(comment, false);
    });

    // Review comments
    document.querySelectorAll(".review-comment").forEach((comment) => {
        addCopyButtonToComment(comment, true);
    });
}

// Initialize when page loads
function init(): void {
    // Check if we're on a PR page
    if (window.location.pathname.match(/\/pull\/\d+/)) {
        addCopyButtonsToAllComments();
    }
}

// Run on load
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
} else {
    init();
}

// Watch for new comments added dynamically
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) {
                // Element node
                const element = node as Element;
                // Check if the added node is a comment or contains comments
                if (
                    element.matches?.(".timeline-comment") ||
                    element.matches?.(".review-comment")
                ) {
                    addCopyButtonToComment(
                        element,
                        element.matches(".review-comment"),
                    );
                } else if (element.querySelectorAll) {
                    element
                        .querySelectorAll(".timeline-comment")
                        .forEach((c) => addCopyButtonToComment(c, false));
                    element
                        .querySelectorAll(".review-comment")
                        .forEach((c) => addCopyButtonToComment(c, true));
                }
            }
        });
    });
});

observer.observe(document.body, { childList: true, subtree: true });
