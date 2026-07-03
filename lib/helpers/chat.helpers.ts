import { PendingAttachment } from "../types/chat.types";

export function describeChatError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || "");

  if (/failed to fetch|network|load failed|connection/i.test(message)) {
    return "Network connection issue. The message did not reach the chat server, so your draft was restored.";
  }

  if (/not configured|api key|environment|env/i.test(message)) {
    return message;
  }

  if (/unauthorized|authentication|permission|forbidden|401|403/i.test(message)) {
    return "Provider authentication error. Check the selected model and API key configuration.";
  }

  if (/rate limit|quota|429/i.test(message)) {
    return "Provider rate limit reached. Wait a moment or switch to another configured provider.";
  }

  if (/500|502|503|504|server/i.test(message)) {
    return "Server error. The chat route failed while asking the provider.";
  }

  return message || "Unexpected chat error. The draft was restored so you can try again.";
}

export function fileToAttachment(file: File): Promise<PendingAttachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve({
        id: `${file.name}-${file.size}-${file.lastModified}`,
        type: "file",
        filename: file.name,
        mediaType: file.type || "application/octet-stream",
        url: String(reader.result),
        size: file.size,
      });
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}