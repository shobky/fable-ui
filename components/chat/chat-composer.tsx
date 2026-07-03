import { ProviderId, ProviderReadiness } from "@/lib/ai/provider-config";
import { PendingAttachment, SubmittedPrompt } from "@/lib/types/chat.types";
import {
  ChangeEvent,
  FormEvent,
  KeyboardEvent,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Attachment01Icon,
  Image01Icon,
  Loading03Icon,
  SentIcon,
  Settings02Icon,
} from "@hugeicons/core-free-icons";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { fileToAttachment } from "@/lib/helpers/chat.helpers";
import { AttachmentGrid } from "./attachment-grid";
import { HugeIcon } from "../hugeicon";
import { ProviderSettings } from "./provider-settings";
import { ModelSelector } from "./model-selector";
type ChatComposerProps = {
  provider: ProviderId;
  model: string;
  selectedProvider?: ProviderReadiness;
  providerReadiness: ProviderReadiness[];
  isBusy: boolean;
  errorText?: string | null;
  initialPrompt?: string;
  autoSend?: boolean;
  onProviderChange: (provider: ProviderId) => void;
  onModelChange: (model: string) => void;
  onClearError: () => void;
  onSend: (prompt: SubmittedPrompt) => Promise<boolean>;
};

const ChatComposer = memo(function ChatComposer({
  provider,
  model,
  selectedProvider,
  providerReadiness,
  isBusy,
  errorText,
  initialPrompt,
  autoSend,
  onProviderChange,
  onModelChange,
  onClearError,
  onSend,
}: ChatComposerProps) {
  const [input, setInput] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasAppliedInitialPromptRef = useRef(false);

  const resizeTextarea = useCallback((target = textareaRef.current) => {
    if (!target) {
      return;
    }

    target.style.height = "auto";
    target.style.height = `${Math.min(target.scrollHeight, 192)}px`;
  }, []);

  const submitDraft = useCallback(
    async (draft: SubmittedPrompt) => {
      const text = draft.text.trim();

      if ((!text && draft.attachments.length === 0) || isBusy) {
        return false;
      }

      onClearError();
      setInput("");
      setPendingAttachments([]);
      requestAnimationFrame(() => resizeTextarea());

      const wasSent = await onSend({ text, attachments: draft.attachments });

      if (!wasSent) {
        setInput(text);
        setPendingAttachments(draft.attachments);
        requestAnimationFrame(() => resizeTextarea());
      }

      return wasSent;
    },
    [isBusy, onClearError, onSend, resizeTextarea],
  );

  useEffect(() => {
    if (hasAppliedInitialPromptRef.current || !initialPrompt) {
      return;
    }

    hasAppliedInitialPromptRef.current = true;
    setInput(initialPrompt);
    requestAnimationFrame(() => resizeTextarea());

    if (autoSend) {
      void submitDraft({ text: initialPrompt, attachments: [] });
    }
  }, [autoSend, initialPrompt, resizeTextarea, submitDraft]);

  function handleInputChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setInput(event.target.value);
    resizeTextarea(event.target);
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);

    if (files.length === 0) {
      return;
    }

    const attachments = await Promise.all(files.map(fileToAttachment));
    setPendingAttachments((current) => [...current, ...attachments]);
    event.target.value = "";
  }

  function removeAttachment(id: string) {
    setPendingAttachments((current) => current.filter((attachment) => attachment.id !== id));
  }

  async function submitPrompt() {
    await submitDraft({
      text: input,
      attachments: pendingAttachments,
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitPrompt();
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submitPrompt();
    }
  }

  return (
    <form
      data-testid="chat-composer"
      onSubmit={handleSubmit}
      className="sticky bottom-0 z-20 bg-background/90 px-4 pb-4 pt-3 backdrop-blur-xl sm:px-6"
    >
      <div className="mx-auto max-w-3xl">
        {errorText ? (
          <div className="mb-3 rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {errorText}
          </div>
        ) : null}
        <InputGroup className="has-[[data-slot=input-group-control]:focus-visible]:ring-0 min-h-28 rounded-[2rem] bg-card/90 p-2 shadow-2xl shadow-foreground/10 ring-1 ring-foreground/5">
          {pendingAttachments.length > 0 ? (
            <InputGroupAddon align="block-start" className="pb-2">
              <AttachmentGrid
                attachments={pendingAttachments}
                onRemove={(attachment) => attachment.id && removeAttachment(attachment.id)}
              />
            </InputGroupAddon>
          ) : null}

          <InputGroupTextarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleComposerKeyDown}
            placeholder="Ask fable-UI to inspect data, confirm an action, or show an interface..."
            aria-label="Prompt"
            rows={1}
            className="max-h-48 min-h-16 px-3 text-base"
          />

          <InputGroupAddon align="block-end" className="justify-between gap-3 pt-2">
            <div className="flex items-center gap-1">
              <input ref={fileInputRef} type="file" multiple className="sr-only" onChange={handleFileChange} />
              <InputGroupButton aria-label="Attach files" size="icon-sm" onClick={() => fileInputRef.current?.click()}>
                <HugeIcon icon={Attachment01Icon} aria-hidden="true" />
              </InputGroupButton>
              <InputGroupButton aria-label="Attach images" size="icon-sm" onClick={() => fileInputRef.current?.click()}>
                <HugeIcon icon={Image01Icon} aria-hidden="true" />
              </InputGroupButton>
              <Dialog>
                <DialogTrigger asChild>
                  <InputGroupButton aria-label="Provider settings" size="icon-sm">
                    <HugeIcon icon={Settings02Icon} aria-hidden="true" />
                  </InputGroupButton>
                </DialogTrigger>
                <DialogContent className="sm:max-w-xl">
                  <DialogHeader>
                    <DialogTitle>Provider settings</DialogTitle>
                    <DialogDescription>Choose the model used by this chat page.</DialogDescription>
                  </DialogHeader>
                  <ProviderSettings
                    provider={provider}
                    model={model}
                    providerReadiness={providerReadiness}
                    onProviderChange={onProviderChange}
                    onModelChange={onModelChange}
                  />
                </DialogContent>
              </Dialog>
            </div>

            <div className="flex min-w-0 items-center gap-4">
              {/* <InputGroupText className="hidden truncate sm:flex font-normal">
                {model || selectedProvider?.defaultModel}
              </InputGroupText> */}
              <ModelSelector
                provider={provider}
                model={model}
                providerReadiness={providerReadiness}
                onProviderChange={onProviderChange}
                onModelChange={onModelChange}
              />
              <InputGroupButton
                type="submit"
                variant="default"
                size="icon-sm"
                disabled={isBusy || (input.trim().length === 0 && pendingAttachments.length === 0)}
                aria-label="Send message"
              >
                {isBusy ? (
                  <HugeIcon icon={Loading03Icon} className="animate-spin" aria-hidden="true" />
                ) : (
                  <HugeIcon icon={SentIcon} aria-hidden="true" />
                )}
              </InputGroupButton>
            </div>
          </InputGroupAddon>
        </InputGroup>
      </div>
    </form>
  );
});

export default ChatComposer;
ChatComposer.displayName = "ChatComposer";