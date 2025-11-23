import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface ErrorDisplayProps {
  title?: string;
  message?: string;
  showRefresh?: boolean;
  showHome?: boolean;
  onRetry?: () => void;
}

export function ErrorDisplay({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  showRefresh = true,
  showHome = true,
  onRetry
}: ErrorDisplayProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
      <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
        <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
      </div>
      
      <h2 className="text-2xl font-bold text-foreground mb-2">
        {title}
      </h2>
      
      <p className="text-muted-foreground max-w-md mb-8">
        {message}
      </p>
      
      <div className="flex items-center gap-4">
        {showRefresh && (
          <Button
            onClick={onRetry || (() => window.location.reload())}
            variant="default"
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
        )}
        
        {showHome && (
          <Link href="/">
            <Button variant="outline" className="gap-2">
              <Home className="w-4 h-4" />
              Go Home
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}

export function NotFound({
  resource = 'Page',
  message
}: {
  resource?: string;
  message?: string;
}) {
  return (
    <ErrorDisplay
      title={`${resource} Not Found`}
      message={message || `The ${resource.toLowerCase()} you're looking for doesn't exist or has been removed.`}
      showRefresh={false}
    />
  );
}

export function UnauthorizedError() {
  return (
    <ErrorDisplay
      title="Access Denied"
      message="You don't have permission to access this resource. Please sign in with an authorized account."
      showRefresh={false}
      showHome={true}
    />
  );
}

export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorDisplay
      title="Connection Error"
      message="Unable to connect to the server. Please check your internet connection or try again later."
      onRetry={onRetry}
    />
  );
}

export function MaintenanceMode() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8 text-center">
      <div className="max-w-md">
        <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mb-6 mx-auto">
          <AlertCircle className="w-10 h-10 text-yellow-600 dark:text-yellow-400" />
        </div>
        
        <h1 className="text-3xl font-bold text-foreground mb-4">
          Under Maintenance
        </h1>
        
        <p className="text-muted-foreground text-lg mb-6">
          We're currently performing scheduled maintenance to improve your experience.
          We'll be back online shortly.
        </p>
        
        <p className="text-sm text-muted-foreground">
          Please check back in a few minutes. Thank you for your patience!
        </p>
      </div>
    </div>
  );
}
