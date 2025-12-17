import { useState, useCallback } from "react";
import { Upload, Sparkles, Image as ImageIcon, Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

import sampleGoku from "@/assets/samples/goku.jpg";
import sampleFmab from "@/assets/samples/fmab.jpg";
import sampleJjb from "@/assets/samples/jjb.jpg";

const API_URL = "https://darshvader13--deoldify-colorization-colorize-endpoint.modal.run";

const SAMPLE_IMAGES = [
  { src: sampleGoku, name: "Dragon Ball" },
  { src: sampleFmab, name: "FMA Brotherhood" },
  { src: sampleJjb, name: "JoJo's Bizarre" },
];

export const ImageColorizer = () => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [colorizedImage, setColorizedImage] = useState<string | null>(null);
  const [originalDimensions, setOriginalDimensions] = useState<{ width: number; height: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const resizeImage = (file: File, width: number, height: number): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      img.onload = () => {
        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Failed to create blob"));
          },
          "image/jpeg",
          0.9
        );
      };

      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = URL.createObjectURL(file);
    });
  };

  const resizeBase64ToOriginal = (base64Data: string, targetWidth: number, targetHeight: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      img.onload = () => {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        ctx?.drawImage(img, 0, 0, targetWidth, targetHeight);
        resolve(canvas.toDataURL("image/jpeg", 0.95));
      };

      img.onerror = () => reject(new Error("Failed to resize colorized image"));
      
      // Convert base64 to data URL
      const imgBytes = atob(base64Data);
      const arrayBuffer = new Uint8Array(imgBytes.length);
      for (let i = 0; i < imgBytes.length; i++) {
        arrayBuffer[i] = imgBytes.charCodeAt(i);
      }
      const blob = new Blob([arrayBuffer], { type: "image/jpeg" });
      img.src = URL.createObjectURL(blob);
    });
  };

  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.onerror = () => reject(new Error("Failed to get dimensions"));
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setColorizedImage(null);

    try {
      // Get original dimensions
      const dimensions = await getImageDimensions(file);
      setOriginalDimensions(dimensions);

      // Show original image
      const reader = new FileReader();
      reader.onload = (e) => setOriginalImage(e.target?.result as string);
      reader.readAsDataURL(file);

      // Resize to (280, 400) for API
      const resizedBlob = await resizeImage(file, 280, 400);
      const formData = new FormData();
      formData.append("file", resizedBlob, "image.jpg");

      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Colorization failed");
      }

      const data = await response.json();
      
      // Resize colorized image back to original dimensions
      const resizedColorized = await resizeBase64ToOriginal(
        data.image_base64,
        dimensions.width,
        dimensions.height
      );
      setColorizedImage(resizedColorized);

      toast({
        title: "Success!",
        description: "Your image has been colorized",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to colorize image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleDownload = useCallback(() => {
    if (!colorizedImage) return;
    
    const link = document.createElement("a");
    link.href = colorizedImage;
    link.download = "colorized-image.jpg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Downloaded!",
      description: "Your colorized image has been saved",
    });
  }, [colorizedImage]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleSampleClick = useCallback(async (sampleSrc: string) => {
    setIsLoading(true);
    setColorizedImage(null);

    try {
      // Fetch sample image as blob
      const response = await fetch(sampleSrc);
      const blob = await response.blob();
      const file = new File([blob], "sample.jpg", { type: "image/jpeg" });
      
      // Get original dimensions
      const dimensions = await getImageDimensions(file);
      setOriginalDimensions(dimensions);

      // Show original image
      setOriginalImage(sampleSrc);

      // Resize to 400x280 for API
      const resizedBlob = await resizeImage(file, 400, 280);
      const formData = new FormData();
      formData.append("file", resizedBlob, "image.jpg");

      const apiResponse = await fetch(API_URL, {
        method: "POST",
        body: formData,
      });

      if (!apiResponse.ok) {
        throw new Error("Colorization failed");
      }

      const data = await apiResponse.json();
      
      const resizedColorized = await resizeBase64ToOriginal(
        data.image_base64,
        dimensions.width,
        dimensions.height
      );
      setColorizedImage(resizedColorized);

      toast({
        title: "Success!",
        description: "Sample image has been colorized",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to colorize image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative glass-card rounded-2xl border-2 border-dashed p-12
          transition-all duration-300 cursor-pointer group
          ${isDragging ? "border-primary glow scale-[1.02]" : "border-border hover:border-primary/50"}
        `}
      >
        <input
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="flex flex-col items-center gap-4 text-center">
          <div className={`
            p-4 rounded-full bg-secondary transition-all duration-300
            ${isDragging ? "bg-primary/20" : "group-hover:bg-primary/10"}
          `}>
            <Upload className={`w-8 h-8 transition-colors ${isDragging ? "text-primary" : "text-muted-foreground group-hover:text-primary"}`} />
          </div>
          <div>
            <p className="text-lg font-medium text-foreground">
              Drop your black & white image here
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              or click to browse • Output will match original dimensions
            </p>
          </div>
        </div>
      </div>

      {/* Sample Images */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <div className="text-center">
          <p className="text-sm font-medium text-muted-foreground">Or try a sample manga panel</p>
        </div>
        <div className="flex justify-center gap-4 flex-wrap">
          {SAMPLE_IMAGES.map((sample, index) => (
            <button
              key={index}
              onClick={() => handleSampleClick(sample.src)}
              disabled={isLoading}
              className="group relative rounded-lg overflow-hidden border-2 border-border hover:border-primary transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <img
                src={sample.src}
                alt={sample.name}
                className="w-24 h-32 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-2">
                <span className="text-xs font-medium text-foreground">{sample.name}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="glass-card rounded-2xl p-12 flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-4 border-secondary" />
            <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-transparent border-t-primary animate-spin-slow" />
            <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-primary animate-pulse-glow" />
          </div>
          <p className="text-lg font-medium text-foreground">Bringing colors to life...</p>
        </div>
      )}

      {/* Results */}
      {(originalImage || colorizedImage) && !isLoading && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {originalImage && (
              <div className="glass-card rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <ImageIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">Original</span>
                  {originalDimensions && (
                    <span className="text-xs text-muted-foreground/70">
                      ({originalDimensions.width}×{originalDimensions.height})
                    </span>
                  )}
                </div>
                <img
                  src={originalImage}
                  alt="Original"
                  className="w-full rounded-lg object-contain max-h-[600px]"
                />
              </div>
            )}
            {colorizedImage && (
              <div className="glass-card rounded-2xl p-4 space-y-3 glow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-primary">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm font-medium">Colorized</span>
                    {originalDimensions && (
                      <span className="text-xs text-primary/70">
                        ({originalDimensions.width}×{originalDimensions.height})
                      </span>
                    )}
                  </div>
                  <Button 
                    onClick={handleDownload} 
                    size="sm" 
                    className="gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                </div>
                <img
                  src={colorizedImage}
                  alt="Colorized"
                  className="w-full rounded-lg object-contain max-h-[600px]"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
