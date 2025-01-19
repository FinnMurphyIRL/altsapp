import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";

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
  const [participants, setParticipants] = useState<string[]>([""]);

  const handleAddParticipant = () => {
    setParticipants([...participants, ""]);
  };

  const handleRemoveParticipant = (index: number) => {
    if (participants.length > 1) {
      const newParticipants = [...participants];
      newParticipants.splice(index, 1);
      setParticipants(newParticipants);
    }
  };

  const handleParticipantChange = (index: number, value: string) => {
    const newParticipants = [...participants];
    newParticipants[index] = value;
    setParticipants(newParticipants);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploaderName || participants.some(p => !p)) return;

    const formattedParticipants: Participant[] = [
      { name: uploaderName, isUploader: true },
      ...participants.map(name => ({
        name,
        isUploader: false
      }))
    ];

    onParticipantsSelected(formattedParticipants);
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

      <div className="space-y-4">
        <Label>Chat Participants</Label>
        {participants.map((participant, index) => (
          <div key={index} className="flex gap-2">
            <Input
              value={participant}
              onChange={(e) => handleParticipantChange(index, e.target.value)}
              placeholder={`Enter participant ${index + 1}'s name`}
              required
            />
            {participants.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveParticipant(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleAddParticipant}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Another Participant
        </Button>
      </div>

      <Button type="submit" className="w-full">
        Continue
      </Button>
    </form>
  );
};