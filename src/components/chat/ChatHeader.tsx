import { Contact } from "./ContactListItem";
import { ChevronLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ChatHeaderProps {
  contact: Contact;
  onBack: () => void;
  onDelete?: () => void;
  isMobile: boolean;
}

export const ChatHeader = ({ contact, onBack, onDelete, isMobile }: ChatHeaderProps) => {
  return (
    <div className="flex items-center justify-between bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center gap-3">
        {isMobile && (
          <Button
            onClick={onBack}
            variant="ghost"
            size="icon"
            className="text-gray-500"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
        <div>
          <h2 className="font-medium">{contact.name}</h2>
        </div>
      </div>
      {onDelete && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-gray-500">
              <Trash2 className="h-5 w-5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this conversation? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};