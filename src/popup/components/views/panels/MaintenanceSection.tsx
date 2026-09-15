import { useState } from "react";
import { Button } from "@/popup/components/ui/button";
import { SettingSection } from "@/popup/components/SettingSection";

interface MaintenanceSectionProps {
  platformName: string;
  onReset: () => void;
}

/** Per-platform reset, behind a confirm step so it cannot happen by accident. */
export function MaintenanceSection({
  platformName,
  onReset,
}: MaintenanceSectionProps) {
  const [confirming, setConfirming] = useState(false);

  return (
    <SettingSection title="Maintenance">
      <div className="flex items-center gap-3 px-3 py-2.5">
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] leading-tight">
            Reset {platformName} settings
          </p>
          <p className="mt-0.5 text-[11.5px] leading-snug text-muted-foreground">
            {confirming
              ? "This puts every option on this page back to its default."
              : "Protected chats are not affected."}
          </p>
        </div>
        {confirming ? (
          <div className="flex shrink-0 gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirming(false)}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive!"
              onClick={() => {
                onReset();
                setConfirming(false);
              }}
            >
              Reset
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirming(true)}
          >
            Reset
          </Button>
        )}
      </div>
    </SettingSection>
  );
}
