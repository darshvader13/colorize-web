import { ImageColorizer } from "@/components/ImageColorizer";
import { Sparkles } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold">
            <span className="gradient-text">Manga</span>
            <span className="text-foreground"> Colorizer</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Transform black and white manga panels into vibrant colorized images
          </p>
        </div>

        {/* Colorizer Component */}
        <ImageColorizer />
      </div>
    </div>
  );
};

export default Index;
