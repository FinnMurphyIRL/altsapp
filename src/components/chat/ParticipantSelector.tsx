import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";

interface ParticipantSelectorProps {
  onParticipantsSelected: (participants: { name: string; isUploader: boolean }[]) => void;
}

export const ParticipantSelector = ({ onParticipantsSelected }: ParticipantSelectorProps) => {
  const [participants, setParticipants] = useState<{ name: string; isUploader: boolean }[]>([
    { name: "", isUploader: true },
  ]);

  const addParticipant = () => {
    setParticipants([...participants, { name: "", isUploader: false }]);
  };

  const removeParticipant = (index: number) => {
    if (participants.length > 1) {
      const newParticipants = participants.filter((_, i) => i !== index);
      setParticipants(newParticipants);
    }
  };

  const updateParticipant = (index: number, name: string) => {
    const newParticipants = [...participants];
    newParticipants[index].name = name;
    setParticipants(newParticipants);
  };

  const handleSubmit = () => {
    if (participants.every((p) => p.name.trim())) {
      onParticipantsSelected(participants);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Who's in this chat?</h3>
      <div className="space-y-2">
        {participants.map((participant, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              placeholder={participant.isUploader ? "Your name in the chat" : "Participant name"}
              value={participant.name}
              onChange={(e) => updateParticipant(index, e.target.value)}
            />
            {!participant.isUploader && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeParticipant(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={addParticipant}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> Add Participant
        </Button>
        <Button onClick={handleSubmit}>Continue</Button>
      </div>
    </div>
  );
};