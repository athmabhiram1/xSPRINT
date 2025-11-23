"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Zap, CheckCircle2, Shield, Shuffle, Eye } from "lucide-react";
import { generateFixtures } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface FixtureGeneratorProps {
  eventId: string;
  eventName: string;
  onSuccess?: () => void;
}

export function FixtureGenerator({
  eventId,
  eventName,
  onSuccess,
}: FixtureGeneratorProps) {
  const [format, setFormat] = useState<"knockout" | "roundrobin">("knockout");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const [sameClubAvoidance, setSameClubAvoidance] = useState(true);
  const [randomizeUnseeded, setRandomizeUnseeded] = useState(true);
  const [previewOnly, setPreviewOnly] = useState(false);

  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!eventId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Event ID is missing. Cannot generate fixtures.",
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await generateFixtures(eventId, format, {
        sameClubAvoidance,
        randomizeUnseeded,
        previewOnly,
      });

      if (response?.success) {
        setResult(response.data);

        toast({
          title: previewOnly
            ? "Preview generated!"
            : "Fixtures generated successfully!",
          description:
            response.data?.totalMatches > 0
              ? `${response.data.totalMatches} matches created`
              : "No matches generated",
        });

        if (!previewOnly) {
          onSuccess?.();
        }
      } else {
        throw new Error(response?.error || "Failed to generate fixtures");
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Fixture Error",
        description: err.message || "Could not generate fixtures",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <Zap className="text-primary" size={24} />
          <h3 className="text-xl font-bold">Advanced Fixture Generator</h3>
        </div>

        {/* FORMAT SELECTION */}
        <div className="space-y-4">
          <div>
            <Label>Tournament Format</Label>
            <Select
              value={format}
              onValueChange={(v) => setFormat(v as "knockout" | "roundrobin")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="knockout">Knockout (Elimination)</SelectItem>
                <SelectItem value="roundrobin">Round Robin (All Play All)</SelectItem>
              </SelectContent>
            </Select>

            <p className="text-sm text-muted-foreground mt-2">
              {format === "knockout"
                ? "Players are eliminated after one loss. Seeds are placed strategically."
                : "Each player faces every other player once."}
            </p>
          </div>

          {/* ADVANCED OPTIONS */}
          <div className="border border-border rounded-lg p-4 space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <Shield size={16} className="text-primary" />
              Smart Fixture Rules
            </h4>

            <div className="flex items-center justify-between">
              <Label>Same-Club Avoidance</Label>
              <Switch
                checked={sameClubAvoidance}
                onCheckedChange={setSameClubAvoidance}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Randomize Unseeded Players</Label>
              <Switch
                checked={randomizeUnseeded}
                onCheckedChange={setRandomizeUnseeded}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Preview Only (Do NOT Save)</Label>
              <Switch checked={previewOnly} onCheckedChange={setPreviewOnly} />
            </div>
          </div>

          {/* GENERATE BUTTON */}
          <Button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                {previewOnly ? "Preview Fixtures" : "Generate Fixtures"}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* RESULTS */}
      {result && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-800 rounded-xl p-6 shadow-md animate-fade-in">
          <div className="flex items-start gap-3">
            <CheckCircle2
              className="text-green-600 dark:text-green-300 mt-0.5"
              size={20}
            />
            <div className="flex-1">
              <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                {previewOnly
                  ? "Preview Generated"
                  : "Fixtures Generated Successfully"}
              </h4>

              <div className="space-y-1 text-sm text-green-800 dark:text-green-200">
                <p>
                  <strong>Format:</strong>{" "}
                  {result.type || format.toUpperCase()}
                </p>

                {result.totalRounds && (
                  <p>
                    <strong>Total Rounds:</strong> {result.totalRounds}
                  </p>
                )}

                {result.totalMatches && (
                  <p>
                    <strong>Total Matches:</strong> {result.totalMatches}
                  </p>
                )}

                {result.sameClubClashes != null && (
                  <p>
                    <strong>Same-Club Clashes Avoided:</strong>{" "}
                    {result.sameClubClashes}
                  </p>
                )}

                {result.analysis && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-primary">
                      View Fixture Analysis
                    </summary>
                    <pre className="text-xs p-2 mt-2 bg-black/10 rounded">
                      {JSON.stringify(result.analysis, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
