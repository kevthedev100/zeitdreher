"use client";

import { useState, useEffect } from "react";
import { createClient } from "../../supabase/client";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Folder, File, Activity } from "lucide-react";

interface HierarchicalNavigationProps {
  onSelectActivity: (
    areaId: string,
    fieldId: string,
    activityId: string,
  ) => void;
}

export default function HierarchicalNavigation({
  onSelectActivity,
}: HierarchicalNavigationProps) {
  const [areas, setAreas] = useState<any[]>([]);
  const [fields, setFields] = useState<{ [areaId: string]: any[] }>({});
  const [activities, setActivities] = useState<{ [fieldId: string]: any[] }>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [openAreas, setOpenAreas] = useState<string[]>([]);
  const [openFields, setOpenFields] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    const getUserId = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        loadAreas(user.id);
      } else {
        setLoading(false);
      }
    };

    getUserId();
  }, []);

  const loadAreas = async (uid: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("areas")
        .select("*")
        .eq("is_active", true)
        .eq("user_id", uid)
        .order("name");

      if (error) throw error;
      setAreas(data || []);

      // Pre-load fields for all areas
      if (data && data.length > 0) {
        const fieldsData: { [areaId: string]: any[] } = {};
        for (const area of data) {
          const fields = await loadFieldsForArea(area.id, uid);
          fieldsData[area.id] = fields;
        }
        setFields(fieldsData);
      }
    } catch (error) {
      console.error("Error loading areas:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadFieldsForArea = async (areaId: string, uid: string) => {
    try {
      const { data, error } = await supabase
        .from("fields")
        .select("*")
        .eq("area_id", areaId)
        .eq("is_active", true)
        .eq("user_id", uid)
        .order("name");

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`Error loading fields for area ${areaId}:`, error);
      return [];
    }
  };

  const loadActivitiesForField = async (fieldId: string) => {
    try {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .eq("field_id", fieldId)
        .eq("is_active", true)
        .eq("user_id", userId)
        .order("name");

      if (error) throw error;

      // Update activities state
      setActivities((prev) => ({
        ...prev,
        [fieldId]: data || [],
      }));

      return data || [];
    } catch (error) {
      console.error(`Error loading activities for field ${fieldId}:`, error);
      return [];
    }
  };

  const toggleArea = (areaId: string) => {
    if (openAreas.includes(areaId)) {
      setOpenAreas(openAreas.filter((id) => id !== areaId));
    } else {
      setOpenAreas([...openAreas, areaId]);
    }
  };

  const toggleField = async (fieldId: string) => {
    if (openFields.includes(fieldId)) {
      setOpenFields(openFields.filter((id) => id !== fieldId));
    } else {
      setOpenFields([...openFields, fieldId]);
      // Load activities if not already loaded
      if (!activities[fieldId]) {
        await loadActivitiesForField(fieldId);
      }
    }
  };

  const handleActivityClick = (
    areaId: string,
    fieldId: string,
    activityId: string,
  ) => {
    onSelectActivity(areaId, fieldId, activityId);
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 bg-gray-200 rounded w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  if (areas.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>Keine Bereiche gefunden.</p>
        <p className="text-sm mt-2">
          Bitte erstellen Sie zuerst Bereiche im Profil.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 w-full">
      {areas.map((area) => (
        <Collapsible
          key={area.id}
          open={openAreas.includes(area.id)}
          onOpenChange={() => toggleArea(area.id)}
          className="border rounded-md overflow-hidden w-full"
        >
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start p-2 h-auto min-h-[40px]"
            >
              <div
                className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
                style={{ backgroundColor: area.color }}
              ></div>
              <Folder
                className="w-4 h-4 mr-2 flex-shrink-0"
                style={{ color: area.color }}
              />
              <span className="flex-1 text-left text-sm truncate">
                {area.name}
              </span>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pl-6 pr-2 pb-2">
            {fields[area.id] && fields[area.id].length > 0 ? (
              <div className="space-y-1">
                {fields[area.id].map((field) => (
                  <Collapsible
                    key={field.id}
                    open={openFields.includes(field.id)}
                    onOpenChange={() => toggleField(field.id)}
                    className="border-l border-gray-200 w-full"
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-start p-2 h-auto min-h-[36px] text-sm"
                      >
                        <File className="w-3 h-3 mr-2 flex-shrink-0" />
                        <span className="flex-1 text-left text-sm truncate">
                          {field.name}
                        </span>
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pl-6 pr-2 pb-1">
                      {activities[field.id] &&
                      activities[field.id].length > 0 ? (
                        <div className="space-y-1">
                          {activities[field.id].map((activity) => (
                            <Button
                              key={activity.id}
                              variant="ghost"
                              className="w-full justify-start p-2 h-auto min-h-[32px] text-xs border-l border-gray-200"
                              onClick={() =>
                                handleActivityClick(
                                  area.id,
                                  field.id,
                                  activity.id,
                                )
                              }
                            >
                              <Activity className="w-3 h-3 mr-2 flex-shrink-0" />
                              <span className="flex-1 text-left text-xs truncate">
                                {activity.name}
                              </span>
                            </Button>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-500 p-2">
                          Keine Aktivitäten gefunden
                        </div>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500 p-2">
                Keine Felder gefunden
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  );
}
