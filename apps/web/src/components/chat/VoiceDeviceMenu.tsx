import { type AudioDevices, listAudioDevices } from "@t3tools/client-runtime/voice-call";
import { ChevronDownIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "../ui/button";
import {
  Menu,
  MenuGroup,
  MenuGroupLabel,
  MenuPopup,
  MenuRadioGroup,
  MenuSeparator,
  MenuTrigger,
} from "../ui/menu";
import { toastManager } from "../ui/toast";
import { useComposerMenuProps } from "./composerEventScope";
import { RadioRow } from "./VoiceCallMenu";

const NO_DEVICES: AudioDevices = { microphones: [], speakers: [] };

/** Which microphone and speaker the live call uses; null is the system default. */
export function VoiceDeviceMenu({
  open,
  onOpenChange,
  microphoneId,
  speakerId,
  onChooseMicrophone,
  onChooseSpeaker,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  microphoneId: string | null;
  speakerId: string | null;
  onChooseMicrophone: (deviceId: string | null) => Promise<void>;
  onChooseSpeaker: (deviceId: string | null) => Promise<void>;
}) {
  const menuProps = useComposerMenuProps();
  const [devices, setDevices] = useState(NO_DEVICES);
  // oxlint-disable-next-line t3code/no-unreasoned-state-sync -- the browser owns the device list; it is read each time the menu opens, however it was opened
  useEffect(() => {
    if (open) void listAudioDevices().then(setDevices);
  }, [open]);
  const choose = (pick: (deviceId: string | null) => Promise<void>) => (value: string) =>
    pick(value || null).catch((cause: unknown) =>
      toastManager.add({
        type: "error",
        title: "Could not switch audio device",
        description: cause instanceof Error ? cause.message : undefined,
      }),
    );
  const group = (
    label: string,
    list: ReadonlyArray<MediaDeviceInfo>,
    current: string | null,
    pick: (deviceId: string | null) => Promise<void>,
  ) => (
    <MenuGroup>
      <MenuGroupLabel>{label}</MenuGroupLabel>
      <MenuRadioGroup value={current ?? ""} onValueChange={choose(pick)}>
        <RadioRow value="">System default</RadioRow>
        {list.map(({ deviceId, label: name }) => (
          <RadioRow key={deviceId} value={deviceId}>
            <span className="min-w-0 truncate">{name || deviceId}</span>
          </RadioRow>
        ))}
      </MenuRadioGroup>
    </MenuGroup>
  );
  return (
    <Menu open={open} onOpenChange={onOpenChange}>
      <MenuTrigger
        render={<Button size="icon-tiny" variant="ghost-muted" aria-label="Audio devices" />}
      >
        <ChevronDownIcon aria-hidden />
      </MenuTrigger>
      <MenuPopup align="end" side="top" {...menuProps}>
        {group("Microphone", devices.microphones, microphoneId, onChooseMicrophone)}
        {devices.speakers.length > 0 && (
          <>
            <MenuSeparator />
            {group("Speaker", devices.speakers, speakerId, onChooseSpeaker)}
          </>
        )}
      </MenuPopup>
    </Menu>
  );
}
