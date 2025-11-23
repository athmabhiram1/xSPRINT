'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Calendar, Clock, CheckCircle2, X } from 'lucide-react';
import { generateSchedule } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

// UPDATED PROPS (modal support added)
interface ScheduleGeneratorProps {
  eventId?: string;
  eventName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ScheduleGenerator({
  eventId,
  eventName,
  open,
  onOpenChange,
  onSuccess
}: ScheduleGeneratorProps) {
  const [startTime, setStartTime] = useState('');
  const [matchDuration, setMatchDuration] = useState(45);
  const [restTime, setRestTime] = useState(20);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  // Reset modal state when opening/closing
  useEffect(() => {
    if (!open) {
      setResult(null);
      setLoading(false);
    }
  }, [open]);

  const handleGenerate = async () => {
    if (!eventId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Event ID is required'
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const options: any = {
        matchDuration,
        restTime
      };

      if (startTime) {
        options.startTime = new Date(startTime).toISOString();
      }

      const response = await generateSchedule(eventId, options);

      if (response.success) {
        setResult(response.data);
        toast({
          title: 'Success!',
          description: `Schedule generated. ${response.data?.scheduled || 0} matches added.`
        });
        onSuccess?.();
      } else {
        throw new Error(response.error || 'Failed to generate schedule');
      }
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  // Modal is hidden → render nothing
  if (!open) return null;

  // Default time
  const defaultStart = new Date();
  defaultStart.setHours(9, 0, 0, 0);
  const defaultStartString = defaultStart.toISOString().slice(0, 16);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl shadow-xl p-6 w-full max-w-lg animate-scale-in">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="text-primary" size={22} />
            <h3 className="text-xl font-bold">Generate Schedule</h3>
          </div>

          <button
            onClick={() => onOpenChange(false)}
            className="p-2 hover:bg-muted rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* Inputs */}
        <div className="space-y-4">
          <div>
            <Label>Start Time (Optional)</Label>
            <Input
              type="datetime-local"
              value={startTime || defaultStartString}
              onChange={(e) => setStartTime(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Leave empty to auto-start from now
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Match Duration (min)</Label>
              <Input
                type="number"
                min={15}
                max={120}
                value={matchDuration}
                onChange={(e) => setMatchDuration(Number(e.target.value))}
              />
            </div>
            <div>
              <Label>Rest Time (min)</Label>
              <Input
                type="number"
                min={5}
                max={60}
                value={restTime}
                onChange={(e) => setRestTime(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-muted/40 p-4 rounded-xl text-sm space-y-1">
            <p className="font-medium flex items-center gap-2">
              <Clock size={15} /> Scheduling Rules
            </p>
            <ul className="list-disc ml-6 text-muted-foreground text-xs">
              <li>No overlapping matches for players</li>
              <li>{restTime} min minimum rest between matches</li>
              <li>Automatic multi-court backfilling</li>
              <li>Dependency-based progression</li>
            </ul>
          </div>

          {/* Button */}
          <Button className="w-full" size="lg" onClick={handleGenerate} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Generating...
              </>
            ) : (
              <>
                <Calendar className="h-4 w-4 mr-2" />
                Generate Schedule
              </>
            )}
          </Button>
        </div>

        {/* Success Box */}
        {result && (
          <div className="mt-6 bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-800 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="text-green-600 dark:text-green-400" />
              <p className="font-medium text-green-700 dark:text-green-300">
                Schedule Generated Successfully
              </p>
            </div>
            <p className="text-sm mt-1">
              <strong>{result.scheduled}</strong> matches scheduled out of{' '}
              <strong>{result.totalMatches}</strong>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
