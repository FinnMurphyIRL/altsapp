import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Participant {
  name: string;
  isUploader: boolean;
}

interface ParticipantSelectorProps {
  onParticipantsSelected: (participants: Participant[]) => void;
  defaultUploaderName?: string | null;
}

export const ParticipantSelector = ({ 
  onParticipantsSelected,
  defaultUploaderName
}: ParticipantSelectorProps) => {
  const [uploaderName, setUploaderName] = useState(defaultUploaderName || "");
  const [participantName, setParticipantName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploaderName || !participantName) return;

    const participants: Participant[] = [
      { name: uploaderName, isUploader: true },
      { name: participantName, isUploader: false },
    ];

    onParticipantsSelected(participants);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="uploaderName">Your Name</Label>
        <Input
          id="uploaderName"
          value={uploaderName}
          onChange={(e) => setUploaderName(e.target.value)}
          placeholder="Enter your name"
          required
          readOnly={!!defaultUploaderName}
          className={defaultUploaderName ? "bg-gray-100" : ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="participantName">Chat Partner's Name</Label>
        <Input
          id="participantName"
          value={participantName}
          onChange={(e) => setParticipantName(e.target.value)}
          placeholder="Enter their name"
          required
        />
      </div>

      <Button type="submit" className="w-full">
        Continue
      </Button>
    </form>
  );
};