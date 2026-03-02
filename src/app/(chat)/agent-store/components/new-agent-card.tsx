"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent } from "ui/card";
import { Plus } from "lucide-react";

export function NewAgentCard() {
  const router = useRouter();

  const handleClick = () => {
    router.push("/agent/new");
  };

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow border-dashed border-2"
      onClick={handleClick}
    >
      <CardContent className="p-4 flex flex-col items-center justify-center min-h-[200px]">
        <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Plus className="size-8 text-muted-foreground" />
        </div>
        <p className="font-semibold text-lg">新智能体</p>
        <p className="text-sm text-muted-foreground text-center mt-2">
          创建新的智能体模板
        </p>
      </CardContent>
    </Card>
  );
}
