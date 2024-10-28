'use client';

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";

export default function BackButton() {
  const router = useRouter();

  return (
    <Button
      onClick={() => router.back()}
      variant="ghost"
      className="flex items-center gap-1 mb-4 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-200"
    >
      <ChevronLeft size={20} />
      ⬅️ Back
    </Button>
  );
} 