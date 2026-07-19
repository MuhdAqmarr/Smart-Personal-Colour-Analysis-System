"use client";

import { useState } from "react";

import { CameraCapture } from "@/components/analysis/camera-capture";
import { UploadDropzone } from "@/components/analysis/upload-dropzone";
import { useWizard } from "@/components/analysis/wizard-context";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function CaptureStep() {
  const { go, setImage } = useWizard();
  const [tab, setTab] = useState<string>("camera");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold tracking-tight">Add your photo</h2>
        <p className="text-muted-foreground mt-2 leading-relaxed">
          Use the camera for a fresh photo, or upload one that follows the guidance.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full">
          <TabsTrigger value="camera" className="flex-1">
            Camera
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex-1">
            Upload
          </TabsTrigger>
        </TabsList>
        <TabsContent value="camera" className="mt-4">
          <CameraCapture
            onCapture={(image) => setImage(image, "camera")}
            onUnavailable={() => setTab("upload")}
          />
        </TabsContent>
        <TabsContent value="upload" className="mt-4">
          <UploadDropzone onSelect={(image) => setImage(image, "upload")} />
        </TabsContent>
      </Tabs>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={() => go("guidance")}>
          Back to guidance
        </Button>
      </div>
    </div>
  );
}
