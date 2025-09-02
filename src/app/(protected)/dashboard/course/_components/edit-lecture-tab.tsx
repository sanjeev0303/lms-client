import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Save, Settings } from "lucide-react";

interface EditLectureTabProps {
  onSave?: () => void;
  isSaving?: boolean;
}

const EditLectureTab = ({ onSave, isSaving = false }: EditLectureTabProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Edit Lecture
          </CardTitle>
          <CardDescription>
            Make changes and click save when done.
          </CardDescription>
        </div>

        <div>
          <Button
            onClick={onSave}
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </CardHeader>
    </Card>
  );
};

export default EditLectureTab;
