"use client";

import { generateUUID } from "lib/utils";
import { ReactNode, useState } from "react";
import { createRoot } from "react-dom/client";
import { Button } from "ui/button";
import { Textarea } from "ui/textarea";

type Alert = {
  title?: ReactNode;
  description: ReactNode;
};

const createContainer = () => {
  const container = document.createElement("div");
  container.id = generateUUID();
  document.body.appendChild(container);
  return container;
};

// Custom Confirm Dialog Component
function CustomConfirmDialog({
  title,
  description,
  onConfirm,
  onCancel,
  okText = "确定",
  cancelText = "取消",
}: {
  title?: ReactNode;
  description: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
  okText?: string;
  cancelText?: string;
}) {
  const handleBackdropClick = () => {
    onCancel();
  };

  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "16px",
      }}
      onClick={handleBackdropClick}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          padding: "24px",
          maxWidth: "448px",
          width: "100%",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
        }}
        onClick={handleContentClick}
      >
        <div style={{ marginBottom: "16px" }}>
          <h2
            style={{
              fontSize: "18px",
              fontWeight: 600,
              marginBottom: "8px",
              color: "#111827",
            }}
          >
            {title}
          </h2>
          <p
            style={{
              fontSize: "14px",
              color: "#6b7280",
              lineHeight: "1.5",
              whiteSpace: "pre-wrap",
            }}
          >
            {description}
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          <Button
            variant="ghost"
            onClick={onCancel}
          >
            {cancelText}
          </Button>
          <Button
            variant="secondary"
            onClick={onConfirm}
          >
            {okText}
          </Button>
        </div>
      </div>
    </div>
  );
}

export const notify = {
  component({
    children,
    className,
  }: { children: ReactNode; className?: string }) {
    return new Promise<void>((resolve) => {
      const container = createContainer();
      const root = createRoot(container);
      const close = () => {
        root.unmount();
        container.remove();
        resolve();
      };
      root.render(<div onClick={close}>{children}</div>);
    });
  },
  alert(alert: Alert) {
    return new Promise<void>((resolve) => {
      const container = createContainer();
      const root = createRoot(container);
      const close = () => {
        root.unmount();
        container.remove();
        resolve();
      };

      const handleConfirm = () => {
        close();
      };

      root.render(
        <CustomConfirmDialog
          title={alert.title}
          description={alert.description}
          onConfirm={handleConfirm}
          onCancel={handleConfirm}
          okText="确定"
        />
      );
    });
  },
  confirm: (confirm: Alert & { okText?: string; cancelText?: string }) => {
    return new Promise<boolean>((resolve) => {
      const container = createContainer();
      const root = createRoot(container);

      const handleConfirm = () => {
        resolve(true);
        root.unmount();
        container.remove();
      };

      const handleCancel = () => {
        resolve(false);
        root.unmount();
        container.remove();
      };

      root.render(
        <CustomConfirmDialog
          title={confirm.title}
          description={confirm.description}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          okText={confirm.okText}
          cancelText={confirm.cancelText}
        />
      );
    });
  },
  prompt: (prompt: Alert) => {
    return new Promise<string>((resolve) => {
      const container = createContainer();
      const root = createRoot(container);

      const close = (text: string = "") => {
        root.unmount();
        container.remove();
        resolve(text);
      };

      const Component = () => {
        const [text, setText] = useState("");
        const handleBackdropClick = () => close();
        const handleContentClick = (e: React.MouseEvent) => e.stopPropagation();

        return (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: "16px",
            }}
            onClick={handleBackdropClick}
          >
            <div
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                padding: "24px",
                maxWidth: "448px",
                width: "100%",
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
              }}
              onClick={handleContentClick}
            >
              <div style={{ marginBottom: "16px" }}>
                <h2
                  style={{
                    fontSize: "18px",
                    fontWeight: 600,
                    marginBottom: "8px",
                    color: "#111827",
                  }}
                >
                  {prompt.title}
                </h2>
                <div
                  style={{
                    fontSize: "14px",
                    color: "#6b7280",
                  }}
                >
                  {prompt.description}
                </div>
                <Textarea
                  className="resize-none"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  style={{ marginTop: "16px" }}
                />
              </div>
              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                <Button
                  variant="ghost"
                  onClick={() => close()}
                  disabled={!text.trim()}
                >
                  取消
                </Button>
                <Button
                  variant="secondary"
                  disabled={!text.trim()}
                  onClick={() => close(text)}
                >
                  确定
                </Button>
              </div>
            </div>
          </div>
        );
      };

      root.render(<Component />);
    });
  },
};
